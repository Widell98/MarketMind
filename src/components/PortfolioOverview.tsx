import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Target, Zap, Brain, AlertTriangle, Shield, Plus, Edit3, MessageCircle, Settings, ChevronDown, ChevronUp, Info, Star, User, Globe, Building2, X, ShoppingCart, Edit, Trash2, LogIn } from 'lucide-react';
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
  // The database recommendations already include the AI-generated ones with proper allocation
  const allRecommendations = recommendations.filter(recommendation => {
    // Filter out recommendations that already exist as actual holdings
    return !actualHoldings.some(holding => 
      holding.name.toLowerCase().includes(recommendation.name.toLowerCase()) || 
      (holding.symbol && recommendation.symbol && 
       holding.symbol.toLowerCase() === recommendation.symbol.toLowerCase())
    );
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
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI-Rekommenderade Innehav
                {allRecommendations.length > 0 && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 ml-2">
                    {allRecommendations.length} rekommendationer
                  </Badge>}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Aktier som AI-advisorn rekommenderar för din portfölj
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {allRecommendations.length > 0 && <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isDeletingRecommendations} className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                      <X className="w-4 h-4 mr-1" />
                      {isDeletingRecommendations ? "Rensar..." : "Rensa alla"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rensa alla AI-rekommendationer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Detta kommer att ta bort alla AI-rekommenderade aktier från din portfölj. 
                        Dina egna innehav påverkas inte.
                        <br /><br />
                        <strong>Denna åtgärd kan inte ångras.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAIRecommendations} disabled={isDeletingRecommendations} className="bg-red-600 hover:bg-red-700">
                        {isDeletingRecommendations ? "Rensar..." : "Ja, rensa alla"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Laddar rekommendationer...</p>
            </div> : allRecommendations.length === 0 ? <div className="text-center py-12">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga AI-rekommendationer ännu</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Få personliga aktieförslag från AI-advisorn baserat på din riskprofil
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={handleGetAIRecommendations} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                  <MessageCircle className="w-4 h-4" />
                  Få AI-rekommendationer
                </Button>
              </div>
            </div> : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Rekommenderad Aktie</TableHead>
                    <TableHead className="font-medium">Typ</TableHead>
                    <TableHead className="font-medium">Sektor</TableHead>
                    <TableHead className="text-right font-medium">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRecommendations.map((recommendation, index) => <TableRow key={recommendation.id || index} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{recommendation.name}</div>
                            {recommendation.symbol && <div className="text-xs text-muted-foreground">{recommendation.symbol}</div>}
                            {recommendation.allocation && <div className="text-xs text-purple-600 font-medium">{recommendation.allocation}% allokering</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          AI-Rekommendation
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {recommendation.sector || 'Okänd sektor'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleAddFromRecommendation(recommendation)} className="h-8 px-2 text-xs bg-white hover:bg-green-50 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300">
                            <ShoppingCart className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleStockChat(recommendation.name, recommendation.symbol)} className="h-8 px-2 text-xs bg-white hover:bg-purple-50 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300">
                            <MessageCircle className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteHolding(recommendation.id, recommendation.name)} className="h-8 px-2 text-xs bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </CardContent>
      </Card>

      {/* Sector Exposure with consistent styling */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="w-5 h-5 text-orange-600" />
            Sektorexponering
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Fördelning över olika industrisektorer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exposureData.sectorData.length > 0 ? <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={exposureData.sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value">
                      {exposureData.sectorData.map((entry, index) => <Cell key={`cell-${index}`} fill={sectorColors[index % sectorColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${formatCurrency(value)} (${exposureData.sectorData.find(d => d.name === name)?.percentage}%)`, 'Värde']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {exposureData.sectorData.map((sector, index) => <div key={sector.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{
                  backgroundColor: sectorColors[index % sectorColors.length]
                }} />
                      <span className="font-medium">{sector.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{sector.percentage}%</span>
                  </div>)}
              </div>
            </div> : <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Ingen sektordata ännu</h3>
              <p className="text-sm">Lägg till innehav för att se sektorfördelning</p>
            </div>}
        </CardContent>
      </Card>

      {/* AI Insights from Database with consistent styling */}
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

      {/* Quick Actions with consistent styling */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-3 text-left border-gray-200 hover:bg-muted/50" onClick={() => handleQuickAction("Jämför AI-rekommendationerna med mina nuvarande innehav. Vad borde jag sälja?")}>
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm mb-1">Portföljjämförelse</div>
                <div className="text-xs text-muted-foreground">Nuvarande vs. rekommenderat</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-3 text-left border-gray-200 hover:bg-muted/50" onClick={() => handleQuickAction("Vilka aktier borde jag köpa först baserat på AI-rekommendationerna och min budget?")}>
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-sm mb-1">Köpordning</div>
                <div className="text-xs text-muted-foreground">Prioritera investeringar</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-3 text-left border-gray-200 hover:bg-muted/50" onClick={() => handleQuickAction("Berätta vilka risker som finns i de AI-rekommenderade aktierna")}>
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-sm mb-1">Riskanalys</div>
                <div className="text-xs text-muted-foreground">Identifiera risker</div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-3 text-left border-gray-200 hover:bg-muted/50" onClick={() => handleQuickAction("Föreslå alternativa aktier som inte finns i AI-rekommendationerna men som skulle passa min profil")}>
              <Plus className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-sm mb-1">Alternativa val</div>
                <div className="text-xs text-muted-foreground">Utforska andra möjligheter</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-3 text-left border-gray-200 hover:bg-muted/50 sm:col-span-2 lg:col-span-1" onClick={() => handleQuickAction("Analysera min nuvarande portfölj och föreslå en rebalanseringsstrategi. Visa vilka aktier jag borde köpa mer av, sälja eller behålla för att optimera min riskjusterade avkastning.")}>
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-sm mb-1">Rebalansering</div>
                <div className="text-xs text-muted-foreground">Optimera fördelningen</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Holding Dialog */}
      <AddHoldingDialog isOpen={addHoldingDialogOpen} onClose={() => setAddHoldingDialogOpen(false)} onAdd={handleAddHolding} initialData={selectedRecommendation} />

      {/* Edit Holding Dialog */}
      <EditHoldingDialog isOpen={editHoldingDialogOpen} onClose={() => setEditHoldingDialogOpen(false)} onSave={handleUpdateHolding} holding={selectedHolding} />
    </div>;
};

export default PortfolioOverview;
