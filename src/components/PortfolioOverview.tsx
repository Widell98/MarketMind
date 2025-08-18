import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Target, Zap, Brain, AlertTriangle, Shield, Plus, Edit3, MessageCircle, Settings, ChevronDown, ChevronUp, Info, Star, User, Globe, Building2, X, ShoppingCart, Edit, Trash2, LogIn, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioInsights } from '@/hooks/usePortfolioInsights';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AddHoldingDialog from './AddHoldingDialog';
import EditHoldingDialog from './EditHoldingDialog';
import UserHoldingsManager from './UserHoldingsManager';
interface PortfolioOverviewProps {
  portfolio: any;
  onQuickChat?: (message: string) => void;
  onActionClick?: (action: string) => void;
}
const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolio,
  onQuickChat,
  onActionClick
}) => {
  const {
    holdings,
    actualHoldings,
    recommendations,
    loading,
    deleteHolding,
    addHolding,
    updateHolding,
    refetch
  } = useUserHoldings();
  const {
    insights,
    loading: insightsLoading,
    markAsRead
  } = usePortfolioInsights();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [expandedStocks, setExpandedStocks] = useState<Set<number>>(new Set());
  const [isDeletingRecommendations, setIsDeletingRecommendations] = useState(false);
  const [addHoldingDialogOpen, setAddHoldingDialogOpen] = useState(false);
  const [editHoldingDialogOpen, setEditHoldingDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);

  // Get AI recommendations from portfolio data with better extraction
  const aiRecommendations = portfolio?.recommended_stocks || [];
  console.log('Portfolio data:', portfolio);
  console.log('AI recommendations from portfolio:', aiRecommendations);
  console.log('Database recommendations:', recommendations);

  // Only use database recommendations - don't combine with portfolio recommendations
  // Filter out duplicates and invalid entries
  const allRecommendations = recommendations.filter(recommendation => {
    // Filter out recommendations that already exist as actual holdings
    const alreadyOwned = actualHoldings.some(holding => holding.name.toLowerCase().includes(recommendation.name.toLowerCase()) || holding.symbol && recommendation.symbol && holding.symbol.toLowerCase() === recommendation.symbol.toLowerCase());

    // Filter out invalid or duplicate entries
    const isValid = recommendation.name && recommendation.name.length > 2 && !recommendation.name.includes('Total allokering') && !recommendation.name.includes('Investera');
    return !alreadyOwned && isValid;
  });
  console.log('Filtered database recommendations:', allRecommendations);

  // Calculate portfolio exposure data
  const calculateExposureData = () => {
    const allHoldings = [...actualHoldings, ...allRecommendations];

    // Sector exposure
    const sectorExposure: {
      [key: string]: number;
    } = {};
    // Market exposure (based on currency and market info)
    const marketExposure: {
      [key: string]: number;
    } = {};
    allHoldings.forEach(holding => {
      const value = holding.current_value || holding.purchase_price || 100; // Default value for recommendations

      // Sector distribution
      const sector = holding.sector || 'Övrigt';
      sectorExposure[sector] = (sectorExposure[sector] || 0) + value;

      // Market distribution (based on currency and available market data)
      let market = 'Sverige'; // Default
      if (holding.currency === 'USD') market = 'USA';else if (holding.currency === 'EUR') market = 'Europa';else if (holding.market) market = holding.market;
      marketExposure[market] = (marketExposure[market] || 0) + value;
    });

    // Convert to chart data
    const totalValue = Object.values(sectorExposure).reduce((sum, val) => sum + val, 0);
    const sectorData = Object.entries(sectorExposure).map(([sector, value]) => ({
      name: sector,
      value: value,
      percentage: totalValue > 0 ? Math.round(value / totalValue * 100) : 0
    })).sort((a, b) => b.value - a.value);
    const marketData = Object.entries(marketExposure).map(([market, value]) => ({
      name: market,
      value: value,
      percentage: totalValue > 0 ? Math.round(value / totalValue * 100) : 0
    })).sort((a, b) => b.value - a.value);
    return {
      sectorData,
      marketData,
      totalValue
    };
  };
  const exposureData = calculateExposureData();

  // Color palettes for charts
  const sectorColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
  const marketColors = ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED'];

  // Helper function to get insight icon based on type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'risk_warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'rebalancing':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'news_impact':
        return <Info className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  // Helper function to get insight color based on severity
  const getInsightColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  const formatCurrency = (amount: number | null | undefined, currency: string = 'SEK') => {
    if (!amount) return '0 kr';
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency === 'SEK' ? 'SEK' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  const getHoldingTypeColor = (type: string) => {
    const colors = {
      stock: 'bg-blue-100 text-blue-800',
      fund: 'bg-green-100 text-green-800',
      crypto: 'bg-purple-100 text-purple-800',
      bonds: 'bg-yellow-100 text-yellow-800',
      real_estate: 'bg-orange-100 text-orange-800',
      recommendation: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };
  const getHoldingTypeLabel = (type: string) => {
    const labels = {
      stock: 'Aktie',
      fund: 'Fond',
      crypto: 'Krypto',
      bonds: 'Obligation',
      real_estate: 'Fastighet',
      recommendation: 'AI-Rekommendation',
      other: 'Övrigt'
    };
    return labels[type as keyof typeof labels] || 'Övrigt';
  };
  const handleStockChat = (stockName: string, stockSymbol?: string) => {
    // Create a detailed message about the stock
    const stockInfo = stockSymbol ? `${stockName} (${stockSymbol})` : stockName;
    const message = `Berätta mer om ${stockInfo}. Vad gör företaget, vilka är deras huvudsakliga affärsområden, och varför skulle det vara en bra investering för min portfölj? Analysera också eventuella risker och möjligheter.`;

    // Navigate to chat page with stock parameters
    const params = new URLSearchParams({
      stock: stockName,
      message: message
    });
    navigate(`/ai-chat?${params.toString()}`);
  };
  const handleDeleteHolding = async (holdingId: string, holdingName: string) => {
    console.log(`Deleting holding: ${holdingName} (${holdingId})`);
    const success = await deleteHolding(holdingId);
    if (success) {
      console.log('Holding deleted successfully');
      toast({
        title: "Innehav raderat",
        description: `${holdingName} har tagits bort från dina innehav.`
      });
      refetch();
    }
  };
  const toggleStockExpansion = (index: number) => {
    const newExpanded = new Set(expandedStocks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedStocks(newExpanded);
  };
  const handleExamplePrompt = (prompt: string) => {
    const chatTab = document.querySelector('[data-value="chat"]') as HTMLElement;
    if (chatTab) {
      chatTab.click();
    }
    setTimeout(() => {
      const event = new CustomEvent('sendExamplePrompt', {
        detail: {
          message: prompt
        }
      });
      window.dispatchEvent(event);
    }, 100);
  };
  const handleQuickAction = (message: string) => {
    // Navigate to AI chat and trigger the pre-filled message
    navigate('/ai-chat');

    // Small delay to ensure navigation is complete before dispatching event
    setTimeout(() => {
      const event = new CustomEvent('sendExamplePrompt', {
        detail: {
          message
        }
      });
      window.dispatchEvent(event);
    }, 100);
  };
  const handleRebalanceAction = () => {
    handleExamplePrompt('Analysera min nuvarande portfölj och föreslå en rebalanseringsstrategi. Visa vilka aktier jag borde köpa mer av, sälja eller behålla för att optimera min riskjusterade avkastning.');
  };
  const handleInsightAction = (insight: any) => {
    const message = `Berätta mer om denna insikt: ${insight.title}. ${insight.description}`;
    handleExamplePrompt(message);

    // Mark insight as read
    if (!insight.is_read) {
      markAsRead(insight.id);
    }
  };
  const clearAIRecommendations = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att rensa rekommendationer",
        variant: "destructive"
      });
      return;
    }
    setIsDeletingRecommendations(true);
    try {
      // Delete all AI recommendations from user_holdings
      const {
        error
      } = await supabase.from('user_holdings').delete().eq('user_id', user.id).eq('holding_type', 'recommendation');
      if (error) {
        console.error('Error deleting AI recommendations:', error);
        toast({
          title: "Fel",
          description: "Kunde inte rensa AI-rekommendationer. Försök igen senare.",
          variant: "destructive"
        });
        return;
      }

      // Refresh holdings data
      refetch();
      toast({
        title: "Rekommendationer rensade",
        description: "Alla AI-rekommendationer har tagits bort från din portfölj."
      });
    } catch (error) {
      console.error('Error clearing AI recommendations:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen senare.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingRecommendations(false);
    }
  };
  const handleResetProfile = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att återställa din profil",
        variant: "destructive"
      });
      return;
    }
    setIsResetting(true);
    try {
      // First, clear AI recommendations
      const {
        error: recommendationsError
      } = await supabase.from('user_holdings').delete().eq('user_id', user.id).eq('holding_type', 'recommendation');
      if (recommendationsError) {
        console.error('Error deleting AI recommendations:', recommendationsError);
      }

      // Delete the user's risk profile
      const {
        error: profileError
      } = await supabase.from('user_risk_profiles').delete().eq('user_id', user.id);
      if (profileError) {
        console.error('Error deleting risk profile:', profileError);
        toast({
          title: "Fel",
          description: "Kunde inte återställa profilen. Försök igen senare.",
          variant: "destructive"
        });
        return;
      }

      // Delete the user's portfolio
      const {
        error: portfolioError
      } = await supabase.from('user_portfolios').delete().eq('user_id', user.id);
      if (portfolioError) {
        console.error('Error deleting portfolio:', portfolioError);
        // Don't show error for portfolio deletion as it might not exist
      }
      toast({
        title: "Profil återställd",
        description: "Din riskprofil och AI-rekommendationer har raderats. Du kan nu skapa en ny profil."
      });

      // Navigate to portfolio advisor to start over
      navigate('/portfolio-advisor');
    } catch (error) {
      console.error('Error resetting profile:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen senare.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };
  const handleAddFromRecommendation = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setAddHoldingDialogOpen(true);
  };
  const handleEditHolding = (holding: any) => {
    setSelectedHolding(holding);
    setEditHoldingDialogOpen(true);
  };
  const handleAddHolding = async (holdingData: any) => {
    const success = await addHolding(holdingData);
    if (success) {
      toast({
        title: "Innehav tillagt",
        description: `${holdingData.name} har lagts till i dina innehav.`
      });
      // Refresh the data to show the new holding and update recommendations
      refetch();
    }
    return success;
  };
  const handleUpdateHolding = async (holdingData: any) => {
    if (!selectedHolding) return;
    const success = await updateHolding(selectedHolding.id, holdingData);
    if (success) {
      toast({
        title: "Innehav uppdaterat",
        description: `${holdingData.name} har uppdaterats.`
      });
      refetch();
    }
  };
  const handleGetAIRecommendations = () => {
    navigate('/ai-chat', {
      state: {
        initialMessage: 'Jag behöver AI-rekommendationer för min portfölj. Kan du analysera mina nuvarande innehav och föreslå nya investeringar som passar min riskprofil?'
      }
    });
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return <div className="space-y-6">
        {/* User's Current Holdings with integrated prices and cash management */}
        <UserHoldingsManager />

        {/* Sector Exposure - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="w-5 h-5 text-orange-600" />
              Sektorexponering
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Fördelning över olika industrisektorer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LogIn className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Logga in för att se din sektorfördelning och portföljanalys
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI-Recommended Holdings - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Rekommenderade Innehav
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Aktier som AI-advisorn rekommenderar för din portfölj
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LogIn className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Logga in för att få personliga AI-rekommendationer för din portfölj
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-insikter och rekommendationer
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Personaliserade förslag baserat på din portfölj och marknadstrender
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LogIn className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Logga in för att få personliga AI-insikter och investeringsförslag
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Login Required */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Zap className="w-5 h-5 text-blue-600" />
              Snabbåtgärder för portfölj
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              AI-assisterade funktioner för att optimera din portfölj
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LogIn className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Logga in för att få tillgång till AI-assisterade portföljfunktioner
              </p>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="space-y-6">
      {/* User's Current Holdings with integrated prices and cash management - NOW FIRST */}
      <UserHoldingsManager />

      {/* AI-Recommended Holdings - NOW SECOND with consistent styling */}
      <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-purple/5 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                AI-Rekommenderade Innehav
                {allRecommendations.length > 0 && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-2 px-3 py-1 rounded-full">
                    {allRecommendations.length} rekommendationer
                  </Badge>}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2 ml-13 leading-relaxed">
                Aktier som AI-advisorn rekommenderar för din portfölj
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {allRecommendations.length > 0 && <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isDeletingRecommendations} className="text-destructive hover:text-destructive/80 border-destructive/20 hover:border-destructive/30 rounded-xl">
                      {isDeletingRecommendations ? "Rensar..." : "Rensa alla"}
                      <Trash2 className="w-3 h-3 ml-1" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rensa AI-rekommendationer</AlertDialogTitle>
                      <AlertDialogDescription>
                        Är du säker på att du vill ta bort alla AI-rekommendationer från din portfölj? 
                        Denna åtgärd kan inte ångras.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAIRecommendations}>
                        Rensa alla
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {allRecommendations.length === 0 ? <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Inga AI-rekommendationer</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                Du har inga AI-rekommendationer just nu. Gå till AI-chatten för att få personliga investeringsförslag.
              </p>
              <Button onClick={handleGetAIRecommendations} className="px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" size="lg">
                <Brain className="w-4 h-4 mr-2" />
                Få AI-rekommendationer
              </Button>
            </div> : <div>
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground font-medium">
                  {allRecommendations.length} AI-rekommendationer
                </div>
                <Button variant="ghost" size="sm" onClick={handleGetAIRecommendations} className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-xl font-medium">
                  Få fler <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className={`space-y-4 ${allRecommendations.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                {allRecommendations.map((recommendation, index) => <div key={recommendation.id || index} className="p-5 bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30 hover:bg-card/70">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Star className="w-4 h-4 text-primary" />
                          </div>
                          <h4 className="font-semibold text-base truncate text-foreground">{recommendation.name}</h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 rounded-full px-2 py-1">
                              <Brain className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          </div>
                        </div>
                        
                        {recommendation.symbol && <p className="text-sm text-muted-foreground mb-3 font-medium">
                            Symbol: {recommendation.symbol}
                          </p>}

                        {recommendation.allocation !== undefined}

                        {recommendation.sector && <div className="flex items-center gap-2 flex-wrap mb-4">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs rounded-full px-2 py-1 bg-muted/50 border-muted">
                              {recommendation.sector}
                            </Badge>
                          </div>}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                          <Button variant="outline" size="sm" onClick={() => handleAddFromRecommendation(recommendation)} className="text-xs bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30 flex-1 rounded-xl py-2">
                            <ShoppingCart className="w-3 h-3 mr-2" />
                            Lägg till i portfölj
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleStockChat(recommendation.name, recommendation.symbol)} className="text-xs bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30 flex-1 rounded-xl py-2">
                            <MessageCircle className="w-3 h-3 mr-2" />
                            Diskutera
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteHolding(recommendation.id, recommendation.name)} className="text-destructive hover:text-destructive/80 hover:bg-destructive/5 text-xs rounded-xl px-3">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Quick Actions - NOW THIRD */}
      

      {/* Sector Exposure - NOW FOURTH */}
      

      {/* AI Insights from Database - NOW FIFTH */}
      {insights.length > 0 && <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-insikter och rekommendationer
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 ml-2">
                    {insights.filter(i => !i.is_read).length} nya
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Personaliserade förslag baserat på din portfölj och marknadstrender
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 5).map(insight => <div key={insight.id} className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${getInsightColor(insight.severity)} ${!insight.is_read ? 'ring-2 ring-purple-200' : ''}`} onClick={() => handleInsightAction(insight)}>
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.insight_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {!insight.is_read && <Badge variant="secondary" className="text-xs">
                            Ny
                          </Badge>}
                        <Badge variant="outline" className="text-xs">
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                      {insight.action_required && <div className="mt-2">
                          <Badge variant="destructive" className="text-xs">
                            Åtgärd krävs
                          </Badge>
                        </div>}
                    </div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}

      {/* Add Holding Dialog */}
      <AddHoldingDialog isOpen={addHoldingDialogOpen} onClose={() => setAddHoldingDialogOpen(false)} onAdd={handleAddHolding} initialData={selectedRecommendation} />

      {/* Edit Holding Dialog */}
      <EditHoldingDialog isOpen={editHoldingDialogOpen} onClose={() => setEditHoldingDialogOpen(false)} onSave={handleUpdateHolding} holding={selectedHolding} />
    </div>;
};
export default PortfolioOverview;