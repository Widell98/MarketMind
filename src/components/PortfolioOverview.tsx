import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Target,
  Zap,
  Brain,
  AlertTriangle,
  Shield,
  Plus,
  Edit3,
  MessageCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  User,
  Globe,
  Building2,
  X,
  ShoppingCart,
  Edit,
  Trash2,
  LogIn
} from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AddHoldingDialog from './AddHoldingDialog';
import EditHoldingDialog from './EditHoldingDialog';
import CurrentHoldingsPrices from './CurrentHoldingsPrices';

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
  const { holdings, actualHoldings, recommendations, loading, deleteHolding, addHolding, updateHolding, refetch } = useUserHoldings();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [expandedStocks, setExpandedStocks] = useState<Set<number>>(new Set());
  const [isDeletingRecommendations, setIsDeletingRecommendations] = useState(false);
  const [addHoldingDialogOpen, setAddHoldingDialogOpen] = useState(false);
  const [editHoldingDialogOpen, setEditHoldingDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);

  // Get AI recommendations from portfolio data
  const aiRecommendations = portfolio?.recommended_stocks || [];
  
  // Combine database recommendations with portfolio recommendations
  // Filter out recommendations that match existing actual holdings (by name or symbol)
  const allRecommendations = [
    ...recommendations,
    ...aiRecommendations.map((stock: any, index: number) => ({
      id: `portfolio-rec-${index}`,
      name: stock.name || stock.symbol,
      symbol: stock.symbol,
      holding_type: 'recommendation',
      purchase_price: stock.targetPrice || stock.price,
      sector: stock.sector,
      currency: 'SEK'
    }))
  ].filter(recommendation => {
    // Filter out recommendations that already exist as actual holdings
    return !actualHoldings.some(holding => 
      holding.name.toLowerCase() === recommendation.name.toLowerCase() ||
      (holding.symbol && recommendation.symbol && 
       holding.symbol.toLowerCase() === recommendation.symbol.toLowerCase())
    );
  });

  // Calculate portfolio exposure data
  const calculateExposureData = () => {
    const allHoldings = [...actualHoldings, ...allRecommendations];
    
    // Sector exposure
    const sectorExposure: { [key: string]: number } = {};
    // Market exposure (based on currency and market info)
    const marketExposure: { [key: string]: number } = {};
    
    allHoldings.forEach(holding => {
      const value = holding.current_value || holding.purchase_price || 100; // Default value for recommendations
      
      // Sector distribution
      const sector = holding.sector || 'Övrigt';
      sectorExposure[sector] = (sectorExposure[sector] || 0) + value;
      
      // Market distribution (based on currency and available market data)
      let market = 'Sverige'; // Default
      if (holding.currency === 'USD') market = 'USA';
      else if (holding.currency === 'EUR') market = 'Europa';
      else if (holding.market) market = holding.market;
      
      marketExposure[market] = (marketExposure[market] || 0) + value;
    });
    
    // Convert to chart data
    const totalValue = Object.values(sectorExposure).reduce((sum, val) => sum + val, 0);
    
    const sectorData = Object.entries(sectorExposure).map(([sector, value]) => ({
      name: sector,
      value: value,
      percentage: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0
    })).sort((a, b) => b.value - a.value);
    
    const marketData = Object.entries(marketExposure).map(([market, value]) => ({
      name: market,
      value: value,
      percentage: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0
    })).sort((a, b) => b.value - a.value);
    
    return { sectorData, marketData, totalValue };
  };

  const exposureData = calculateExposureData();

  // Color palettes for charts
  const sectorColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
  const marketColors = ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED'];

  const insights = [
    {
      type: 'opportunity',
      icon: <TrendingUp className="w-4 h-4 text-green-600" />,
      title: 'Stark prestanda',
      description: 'Din portfölj har presterat bättre än marknaden med +8.2% i år',
      action: 'Se detaljerad analys',
      chatMessage: 'Analysera min portföljs prestanda i detalj. Visa hur den har presterat jämfört med marknaden och vilka innehav som bidragit mest till avkastningen.'
    },
    {
      type: 'warning',
      icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
      title: 'Rebalanseringsmöjlighet',
      description: 'Dina tech-aktier har vuxit och utgör nu 35% av portföljen',
      action: 'Visa förslag',
      chatMessage: 'Min tech-sektor har vuxit till 35% av portföljen. Analysera om detta är för mycket exponering och föreslå rebalanseringsstrategier för bättre diversifiering.'
    },
    {
      type: 'info',
      icon: <Target className="w-4 h-4 text-blue-600" />,
      title: 'Diversifiering',
      description: 'Bra spridning över olika sektorer och geografiska marknader',
      action: 'Utforska mer',
      chatMessage: 'Analysera min portföljs diversifiering i detalj. Visa fördelningen över sektorer och geografiska marknader och föreslå eventuella förbättringar.'
    }
  ];

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
        description: `${holdingName} har tagits bort från dina innehav.`,
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
        detail: { message: prompt }
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
        detail: { message }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  const handleRebalanceAction = () => {
    handleExamplePrompt('Analysera min nuvarande portfölj och föreslå en rebalanseringsstrategi. Visa vilka aktier jag borde köpa mer av, sälja eller behålla för att optimera min riskjusterade avkastning.');
  };

  const handleInsightAction = (insight: typeof insights[0]) => {
    handleExamplePrompt(insight.chatMessage);
  };

  const clearAIRecommendations = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att rensa rekommendationer",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingRecommendations(true);

    try {
      // Delete all AI recommendations from user_holdings
      const { error } = await supabase
        .from('user_holdings')
        .delete()
        .eq('user_id', user.id)
        .eq('holding_type', 'recommendation');

      if (error) {
        console.error('Error deleting AI recommendations:', error);
        toast({
          title: "Fel",
          description: "Kunde inte rensa AI-rekommendationer. Försök igen senare.",
          variant: "destructive",
        });
        return;
      }

      // Refresh holdings data
      refetch();

      toast({
        title: "Rekommendationer rensade",
        description: "Alla AI-rekommendationer har tagits bort från din portfölj.",
      });
    } catch (error) {
      console.error('Error clearing AI recommendations:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen senare.",
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      // First, clear AI recommendations
      const { error: recommendationsError } = await supabase
        .from('user_holdings')
        .delete()
        .eq('user_id', user.id)
        .eq('holding_type', 'recommendation');

      if (recommendationsError) {
        console.error('Error deleting AI recommendations:', recommendationsError);
      }

      // Delete the user's risk profile
      const { error: profileError } = await supabase
        .from('user_risk_profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error deleting risk profile:', profileError);
        toast({
          title: "Fel",
          description: "Kunde inte återställa profilen. Försök igen senare.",
          variant: "destructive",
        });
        return;
      }

      // Delete the user's portfolio
      const { error: portfolioError } = await supabase
        .from('user_portfolios')
        .delete()
        .eq('user_id', user.id);

      if (portfolioError) {
        console.error('Error deleting portfolio:', portfolioError);
        // Don't show error for portfolio deletion as it might not exist
      }

      toast({
        title: "Profil återställd",
        description: "Din riskprofil och AI-rekommendationer har raderats. Du kan nu skapa en ny profil.",
      });

      // Navigate to portfolio advisor to start over
      navigate('/portfolio-advisor');
    } catch (error) {
      console.error('Error resetting profile:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen senare.",
        variant: "destructive",
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
        description: `${holdingData.name} har lagts till i dina innehav.`,
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
        description: `${holdingData.name} har uppdaterats.`,
      });
      refetch();
    }
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Key Metrics - Login Required */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riskjusterad avkastning</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <LogIn className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Logga in för att se dina data</p>
                <Button size="sm" onClick={() => navigate('/auth')}>
                  Logga in
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diversifiering</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <LogIn className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Logga in för att se dina data</p>
                <Button size="sm" onClick={() => navigate('/auth')}>
                  Logga in
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riskpoäng</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <LogIn className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Logga in för att se dina data</p>
                <Button size="sm" onClick={() => navigate('/auth')}>
                  Logga in
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Exposure and Current Prices Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Sector Exposure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Building2 className="w-5 h-5 text-orange-600" />
                Sektorexponering
              </CardTitle>
              <CardDescription>Fördelning över olika industrisektorer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Logga in för att se din sektorfördelning och portföljanalys
                </p>
                <Button onClick={() => navigate('/auth')}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Logga in
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Holdings Prices */}
          <CurrentHoldingsPrices />
        </div>

        {/* User's Current Holdings - Login Required */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Dina Nuvarande Innehav
                </CardTitle>
                <CardDescription>Aktier och fonder du redan äger</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inga innehav registrerade</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Lägg till dina nuvarande aktier och fonder för att få en komplett bild av din portfölj och bättre AI-rekommendationer.
              </p>
              <Button 
                className="flex items-center gap-2" 
                onClick={() => setAddHoldingDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Lägg till innehav
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI-Recommended Holdings - Login Required */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Rekommenderade Innehav
                </CardTitle>
                <CardDescription>Aktier som AI-advisorn rekommenderar för din portfölj</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Logga in för att få personliga AI-rekommendationer för din portfölj
              </p>
              <Button onClick={() => navigate('/auth')}>
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights - Login Required */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-insikter och rekommendationer
                </CardTitle>
                <CardDescription>
                  Personaliserade förslag baserat på din portfölj och marknadstrender
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Logga in för att få personliga AI-insikter och investeringsförslag
              </p>
              <Button onClick={() => navigate('/auth')}>
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Login Required */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Zap className="w-5 h-5 text-blue-600" />
              Snabbåtgärder för portfölj
            </CardTitle>
            <CardDescription>
              AI-assisterade funktioner för att optimera din portfölj
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Logga in för att få tillgång till AI-assisterade portföljfunktioner
              </p>
              <Button onClick={() => navigate('/auth')}>
                <LogIn className="w-4 h-4 mr-2" />
                Logga in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riskjusterad avkastning</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.34</div>
            <p className="text-xs text-muted-foreground">
              Sharpe ratio (bra balans)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversifiering</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Välspridd över sektorer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riskpoäng</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio?.risk_score || 6}/10</div>
            <p className="text-xs text-muted-foreground">
              Måttlig risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Exposure and Current Prices Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sector Exposure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="w-5 h-5 text-orange-600" />
              Sektorexponering
            </CardTitle>
            <CardDescription>Fördelning över olika industrisektorer</CardDescription>
          </CardHeader>
          <CardContent>
            {exposureData.sectorData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={exposureData.sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {exposureData.sectorData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={sectorColors[index % sectorColors.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${formatCurrency(value)} (${exposureData.sectorData.find(d => d.name === name)?.percentage}%)`,
                          'Värde'
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {exposureData.sectorData.map((sector, index) => (
                    <div key={sector.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sectorColors[index % sectorColors.length] }}
                        />
                        <span>{sector.name}</span>
                      </div>
                      <span className="font-medium">{sector.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Lägg till innehav för att se sektorfördelning</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Holdings Prices */}
        <CurrentHoldingsPrices />
      </div>

      {/* User's Current Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Dina Nuvarande Innehav
                {actualHoldings.length > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {actualHoldings.length} innehav
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Aktier och fonder du redan äger</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setAddHoldingDialogOpen(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Lägg till innehav</span>
                <span className="sm:hidden">Lägg till</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {actualHoldings.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inga innehav registrerade</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Lägg till dina nuvarande aktier och fonder för att få en komplett bild av din portfölj och bättre AI-rekommendationer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Innehav</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Antal</TableHead>
                    <TableHead>Värde</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actualHoldings.map((holding) => (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{holding.name}</div>
                          {holding.symbol && (
                            <div className="text-sm text-muted-foreground">{holding.symbol}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getHoldingTypeColor(holding.holding_type)}>
                          {getHoldingTypeLabel(holding.holding_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {holding.quantity && (
                          <div className="font-medium">{holding.quantity} st</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(holding.current_value || holding.purchase_price, holding.currency)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditHolding(holding)}
                            className="h-8 px-2 text-xs font-medium bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 transition-colors"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Redigera
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStockChat(holding.name, holding.symbol)}
                            className="h-8 px-2 text-xs font-medium bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Diskutera
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs font-medium bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 transition-colors"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Radera
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Radera innehav</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Är du säker på att du vill radera <strong>{holding.name}</strong> från dina innehav? 
                                  Denna åtgärd kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteHolding(holding.id, holding.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Radera
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-Recommended Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI-Rekommenderade Innehav
                {allRecommendations.length > 0 && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {allRecommendations.length} rekommendationer
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Aktier som AI-advisorn rekommenderar för din portfölj</CardDescription>
            </div>
            <div className="flex gap-2">
              {allRecommendations.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isDeletingRecommendations}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Rensa alla</span>
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
                      <AlertDialogAction 
                        onClick={clearAIRecommendations}
                        disabled={isDeletingRecommendations}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeletingRecommendations ? "Rensar..." : "Ja, rensa alla"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Laddar rekommendationer...</p>
            </div>
          ) : allRecommendations.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga AI-rekommendationer ännu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Implementera din riskprofil för att få personliga aktieförslag från AI-advisorn
              </p>
              <Button
                onClick={() => navigate('/portfolio-advisor')}
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Skapa investeringsstrategi
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rekommenderad Aktie</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Sektor</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRecommendations.map((recommendation, index) => (
                    <TableRow key={recommendation.id || index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-purple-600" />
                          <div>
                            <div className="font-medium">{recommendation.name}</div>
                            {recommendation.symbol && (
                              <div className="text-sm text-muted-foreground">{recommendation.symbol}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getHoldingTypeColor(recommendation.holding_type)}>
                          AI-Rekommendation
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {recommendation.sector || 'Okänd sektor'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddFromRecommendation(recommendation)}
                            className="h-8 px-2 text-xs font-medium bg-white hover:bg-green-50 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Köp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStockChat(recommendation.name, recommendation.symbol)}
                            className="h-8 px-2 text-xs font-medium bg-white hover:bg-purple-50 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Diskutera
                          </Button>
                          {recommendation.id && recommendation.id.startsWith('portfolio-rec-') === false && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteHolding(recommendation.id)}
                              className="h-8 px-2 text-xs font-medium bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 transition-colors"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Radera
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="w-5 h-5 text-blue-600" />
            Snabbåtgärder för portfölj
          </CardTitle>
          <CardDescription>
            AI-assisterade funktioner för att optimera din portfölj
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => handleQuickAction("Jämför AI-rekommendationerna med mina nuvarande innehav. Vad borde jag sälja?")}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Portföljjämförelse</div>
                <div className="text-xs text-muted-foreground">Nuvarande vs. rekommenderat</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => handleQuickAction("Vilka aktier borde jag köpa först baserat på AI-rekommendationerna och min budget?")}
            >
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-sm">Köpordning</div>
                <div className="text-xs text-muted-foreground">Prioritera investeringar</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => handleQuickAction("Berätta vilka risker som finns i de AI-rekommenderade aktierna")}
            >
              <Shield className="w-4 h-4 text-red-600" />
              <div>
                <div className="font-medium text-sm">Riskanalys</div>
                <div className="text-xs text-muted-foreground">Identifiera risker</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => handleQuickAction("Föreslå alternativa aktier som inte finns i AI-rekommendationerna men som skulle passa min profil")}
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <div>
                <div className="font-medium text-sm">Alternativa val</div>
                <div className="text-xs text-muted-foreground">Utforska andra möjligheter</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => handleQuickAction("Analysera min nuvarande portfölj och föreslå en rebalanseringsstrategi. Visa vilka aktier jag borde köpa mer av, sälja eller behålla för att optimera min riskjusterade avkastning.")}
            >
              <Target className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-sm">Rebalansering</div>
                <div className="text-xs text-muted-foreground">Optimera fördelningen</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Holding Dialog */}
      <AddHoldingDialog
        isOpen={addHoldingDialogOpen}
        onClose={() => setAddHoldingDialogOpen(false)}
        onAdd={handleAddHolding}
        initialData={selectedRecommendation}
      />

      {/* Edit Holding Dialog */}
      <EditHoldingDialog
        isOpen={editHoldingDialogOpen}
        onClose={() => setEditHoldingDialogOpen(false)}
        onSave={handleUpdateHolding}
        holding={selectedHolding}
      />
    </div>
  );
};

export default PortfolioOverview;
