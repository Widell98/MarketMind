import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStockCase } from '@/hooks/useStockCases';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToastAction } from '@/components/ui/toast';
import { ArrowLeft, Heart, Share2, TrendingUp, TrendingDown, Calendar, Building, BarChart3, Eye, Users, AlertTriangle, Target, StopCircle, Brain, ShoppingCart, Plus, UserPlus, PlusCircle, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import StockCaseAIChat from '@/components/StockCaseAIChat';
import MarketSentimentAnalysis from '@/components/MarketSentimentAnalysis';
import SaveOpportunityButton from '@/components/SaveOpportunityButton';
import StockCaseComments from '@/components/StockCaseComments';
import AddStockCaseUpdateDialog from '@/components/AddStockCaseUpdateDialog';
import StockCaseHistoryViewer from '@/components/StockCaseHistoryViewer';
import type { StockCase } from '@/types/stockCase';
const StockCaseDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user
  } = useAuth();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const {
    stockCase,
    loading,
    error
  } = useStockCase(id || '');
  const {
    likeCount,
    isLiked,
    toggleLike,
    loading: likesLoading
  } = useStockCaseLikes(id || '');
  const {
    followUser,
    unfollowUser,
    isFollowing
  } = useUserFollows();

  // Effect to scroll to comments when navigated from "Diskutera" button
  useEffect(() => {
    if (location.state?.scrollToComments) {
      // Use setTimeout to ensure the page is fully rendered
      setTimeout(() => {
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
          commentsSection.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, 500);

      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // NOW we can have conditional logic and early returns
  if (loading) {
    return <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>;
  }
  if (error || !stockCase) {
    return <Layout>
        <div className="max-w-4xl mx-auto text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Stock Case hittades inte
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Det stock case du letar efter finns inte eller har tagits bort.
          </p>
          <Button onClick={() => navigate('/stock-cases')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till Stock Cases
          </Button>
        </div>
      </Layout>;
  }
  const performance = stockCase.performance_percentage;
  const isPositivePerformance = performance && performance >= 0;
  const isOwner = user && stockCase.user_id === user.id;
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: stockCase.title,
          text: `Kolla in detta stock case: ${stockCase.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Sharing failed:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Länk kopierad",
        description: "Stock case-länken har kopierats till urklipp"
      });
    }
  };
  const handleLikeClick = () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att gilla stock cases",
        variant: "destructive"
      });
      return;
    }
    toggleLike();
  };
  const handleFollowClick = () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att följa användare",
        variant: "destructive"
      });
      return;
    }
    if (!stockCase.user_id) return;
    if (isFollowing(stockCase.user_id)) {
      unfollowUser(stockCase.user_id);
    } else {
      followUser(stockCase.user_id);
    }
  };
  const handleSaveSuccess = () => {
    toast({
      title: "Sparad till portfölj!",
      description: "Detta stock case har sparats och är nu tillgängligt i dina Community-rekommenderade Innehav.",
      action: <ToastAction altText="Gå till portfölj" onClick={() => navigate('/portfolio-implementation')}>
          Gå till portfölj
        </ToastAction>
    });

    // Refresh the community recommendations if the function is available
    if (typeof (window as any).refreshCommunityRecommendations === 'function') {
      (window as any).refreshCommunityRecommendations();
    }
  };
  const handleVersionSelect = (version: any) => {
    setSelectedVersion(version);
  };

  // Use selected version data or fall back to original stock case
  const displayData = selectedVersion || {
    title: stockCase.title,
    description: stockCase.description,
    image_url: stockCase.image_url,
    created_at: stockCase.created_at,
    isOriginal: true
  };
  return <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/stock-cases')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Hero Section */}
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-4xl font-bold">{stockCase.title}</h1>
              {stockCase.ai_generated === true && <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  <Brain className="w-4 h-4 mr-1" />
                  AI
                </Badge>}
            </div>
            
            
            {/* Performance Badge */}
            {performance !== null && <Badge variant={isPositivePerformance ? "default" : "destructive"} className="text-lg px-4 py-1">
                {isPositivePerformance ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
              </Badge>}
          </div>

          {/* Hero Image */}
          {displayData.image_url && <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img src={displayData.image_url} alt={stockCase.company_name} className="w-full h-full object-cover" />
                {selectedVersion && !selectedVersion.isOriginal && <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      <History className="w-3 h-3 mr-1" />
                      Uppdaterad version
                    </Badge>
                  </div>}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center items-center gap-4">
                <Button variant={isLiked ? "default" : "outline"} onClick={handleLikeClick} disabled={likesLoading} size="lg" className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-200 ${isLiked ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40' : 'hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20'}`}>
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{likeCount}</span>
                </Button>

                {user && <SaveOpportunityButton itemType="stock_case" itemId={stockCase.id} itemTitle={stockCase.company_name} variant="outline" showText={true} onSaveSuccess={handleSaveSuccess} size="lg" className="px-6 py-3 rounded-xl transition-all duration-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-950/20" />}

                {/* Owner Actions */}
                {isOwner && <Button variant="outline" onClick={() => setShowUpdateDialog(true)} size="lg" className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 dark:hover:bg-amber-950/20">
                    <PlusCircle className="w-5 h-5" />
                    <span className="font-medium">Uppdatera Case</span>
                  </Button>}
              </div>

              {/* History Viewer - visible for everyone but only editable by owner */}
              <StockCaseHistoryViewer stockCaseId={stockCase.id} originalStockCase={{
            title: stockCase.title,
            description: stockCase.description,
            image_url: stockCase.image_url,
            created_at: stockCase.created_at,
            user_id: stockCase.user_id
          }} onVersionSelect={handleVersionSelect} compact={true} />

              {/* Login prompt for non-users */}
              {!user && <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Logga in för att gilla och spara
                  </p>
                </div>}
            </div>}
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Combined Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Översikt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Price Information */}
                  {stockCase.entry_price && <div>
                      <p className="text-sm text-muted-foreground">Inköpspris</p>
                      <p className="font-semibold text-lg">{stockCase.entry_price} SEK</p>
                    </div>}
                  {stockCase.current_price && <div>
                      <p className="text-sm text-muted-foreground">Nuvarande pris</p>
                      <p className="font-semibold text-lg">{stockCase.current_price} SEK</p>
                    </div>}
                  {stockCase.target_price && <div>
                      <p className="text-sm text-muted-foreground">Målpris</p>
                      <p className="font-semibold text-lg text-green-600">{stockCase.target_price} SEK</p>
                    </div>}
                  {stockCase.stop_loss && <div>
                      <p className="text-sm text-muted-foreground">Stop Loss</p>
                      <p className="font-semibold text-lg text-red-600">{stockCase.stop_loss} SEK</p>
                    </div>}
                  
                  {/* Company Information */}
                  {stockCase.sector && <div>
                      <p className="text-sm text-muted-foreground">Sektor</p>
                      <p className="font-semibold">{stockCase.sector}</p>
                    </div>}
                  {stockCase.market_cap && <div>
                      <p className="text-sm text-muted-foreground">Börsvärde</p>
                      <p className="font-semibold">{stockCase.market_cap}</p>
                    </div>}
                  {stockCase.pe_ratio && <div>
                      <p className="text-sm text-muted-foreground">P/E-tal</p>
                      <p className="font-semibold">{stockCase.pe_ratio}</p>
                    </div>}
                  {stockCase.dividend_yield && <div>
                      <p className="text-sm text-muted-foreground">Utdelning</p>
                      <p className="font-semibold">{stockCase.dividend_yield}</p>
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {displayData.description && <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Analys & Beskrivning</CardTitle>
                    {selectedVersion && !selectedVersion.isOriginal && <Badge variant="outline" className="text-xs">
                        Uppdaterad version
                      </Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className={showFullDescription ? '' : 'line-clamp-4'}>
                      {displayData.description}
                    </p>
                    {displayData.description.length > 300 && <Button variant="link" onClick={() => setShowFullDescription(!showFullDescription)} className="p-0 h-auto mt-3">
                        {showFullDescription ? 'Visa mindre' : 'Läs mer'}
                      </Button>}
                  </div>
                </CardContent>
              </Card>}

            {/* Admin Comment */}
            {stockCase.admin_comment && <Card className="border-blue-600/20 bg-blue-600/10 dark:bg-blue-950/30">
                <CardHeader>
                  <CardTitle className="text-blue-600 dark:text-blue-400">
                    Expertkommentar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-600 dark:text-blue-300">
                    {stockCase.admin_comment}
                  </p>
                </CardContent>
              </Card>}

            {/* AI Chat Integration */}
            <StockCaseAIChat stockCase={stockCase} />

            {/* Comments Section */}
            <div id="comments-section">
              <StockCaseComments stockCaseId={stockCase.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Card */}
            {stockCase.profiles && <Card>
                <CardHeader>
                  <CardTitle>Skapad av</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {stockCase.profiles.display_name?.charAt(0) || stockCase.profiles.username.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">
                          {stockCase.profiles.display_name || stockCase.profiles.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{stockCase.profiles.username}
                        </p>
                      </div>
                    </div>
                    {user && user.id !== stockCase.user_id && <Button variant="outline" size="sm" onClick={handleFollowClick}>
                        {isFollowing(stockCase.user_id) ? 'Sluta följa' : 'Följ'}
                      </Button>}
                  </div>
                </CardContent>
              </Card>}

            {/* Case Details */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Skapad {formatDistanceToNow(new Date(stockCase.created_at), {
                    addSuffix: true,
                    locale: sv
                  })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={stockCase.status === 'winner' ? 'default' : stockCase.status === 'loser' ? 'destructive' : 'secondary'}>
                    {stockCase.status === 'active' ? 'Aktiv' : stockCase.status === 'winner' ? 'Vinnare' : 'Förlorare'}
                  </Badge>
                </div>

                {stockCase.case_categories && <div>
                    <span className="text-sm text-muted-foreground">Kategori:</span>
                    <Badge variant="outline" className="ml-2" style={{
                  borderColor: stockCase.case_categories.color,
                  color: stockCase.case_categories.color
                }}>
                      {stockCase.case_categories.name}
                    </Badge>
                  </div>}
              </CardContent>
            </Card>

            {/* Risk Warning */}
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">⚠️ Riskvarning</p>
                  <p>
                    Detta är inte finansiell rådgivning. Alla investeringar innebär risk.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Login Prompt for non-users */}
            {!user && <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Logga in för att interagera
                    </p>
                    <Button size="sm" onClick={() => navigate('/auth')}>
                      Logga in
                    </Button>
                  </div>
                </CardContent>
              </Card>}
          </div>
        </div>
      </div>

      {/* Update Dialog */}
      <AddStockCaseUpdateDialog isOpen={showUpdateDialog} onClose={() => setShowUpdateDialog(false)} stockCaseId={stockCase.id} onSuccess={() => {
      setShowUpdateDialog(false);
      toast({
        title: "Uppdatering skapad!",
        description: "Din uppdatering har lagts till framgångsrikt"
      });
    }} />
    </Layout>;
};
export default StockCaseDetail;