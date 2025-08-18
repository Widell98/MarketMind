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
import { ArrowLeft, Heart, Share2, TrendingUp, TrendingDown, Calendar, Building, BarChart3, Eye, Users, AlertTriangle, Target, StopCircle, Brain, ShoppingCart, Plus, UserPlus, PlusCircle, History, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import StockCaseAIChat from '@/components/StockCaseAIChat';
import MarketSentimentAnalysis from '@/components/MarketSentimentAnalysis';
import SaveOpportunityButton from '@/components/SaveOpportunityButton';
import StockCaseComments from '@/components/StockCaseComments';
import AddStockCaseUpdateDialog from '@/components/AddStockCaseUpdateDialog';
import StockCaseTimelineViewer from '@/components/StockCaseTimelineViewer';
import type { StockCase } from '@/types/stockCase';

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { stockCase, loading, error } = useStockCase(id || '');
  const { likeCount, isLiked, toggleLike, loading: likesLoading } = useStockCaseLikes(id || '');
  const { followUser, unfollowUser, isFollowing } = useUserFollows();

  // Effect to scroll to comments when navigated from "Diskutera" button
  useEffect(() => {
    if (location.state?.scrollToComments) {
      setTimeout(() => {
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // NOW we can have conditional logic and early returns
  if (loading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  if (error || !stockCase) {
    return (
      <Layout>
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
      </Layout>
    );
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

  // Format case description with sections
  const formatCaseDescription = (description: string | null) => {
    if (!description) return null;
    
    const sections = description.split('\n\n');
    return sections.map((section, index) => {
      // Check if section starts with common labels
      if (section.toLowerCase().startsWith('bull case')) {
        return (
          <div key={index} className="space-y-2">
            <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Bull Case
            </h3>
            <p className="text-foreground leading-relaxed">{section.replace(/^bull case:?\s*/i, '')}</p>
          </div>
        );
      }
      
      if (section.toLowerCase().startsWith('bear case')) {
        return (
          <div key={index} className="space-y-2">
            <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Bear Case
            </h3>
            <p className="text-foreground leading-relaxed">{section.replace(/^bear case:?\s*/i, '')}</p>
          </div>
        );
      }
      
      if (section.toLowerCase().includes('risk')) {
        return (
          <div key={index} className="space-y-2">
            <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risknivå
            </h3>
            <p className="text-foreground leading-relaxed">{section}</p>
          </div>
        );
      }
      
      // Highlight numbers in text
      const highlightNumbers = (text: string) => {
        return text.replace(/(\d+[\d\s]*,?\d*\.?\d*)\s?(SEK|%|kr)/gi, '<span class="font-bold text-primary">$1 $2</span>');
      };
      
      return (
        <p 
          key={index} 
          className="text-foreground leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: highlightNumbers(section) }}
        />
      );
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/stock-cases')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Hero Section with Improved Hierarchy */}
        <div className="space-y-6">
          {/* Title and Metadata */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-5xl font-bold tracking-tight text-center">{stockCase.title}</h1>
              {stockCase.ai_generated === true && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <Brain className="w-4 h-4 mr-1" />
                  AI
                </Badge>
              )}
            </div>
            
            {/* Subtitle with author, date, and category */}
            <div className="text-center text-lg text-muted-foreground space-y-2">
              <p>
                Case av{' '}
                <span className="font-semibold text-foreground">
                  {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Okänd'}
                </span>
                {' • '}
                <span>
                  {formatDistanceToNow(new Date(stockCase.created_at), {
                    addSuffix: true,
                    locale: sv
                  })}
                </span>
                {stockCase.case_categories && (
                  <>
                    {' • '}
                    <span 
                      className="font-medium"
                      style={{ color: stockCase.case_categories.color }}
                    >
                      {stockCase.case_categories.name}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* CTA Buttons directly under title */}
            {user && (
              <div className="flex items-center justify-center gap-4 py-4">
                <Button 
                  variant="outline" 
                  onClick={handleLikeClick} 
                  disabled={likesLoading} 
                  className="flex items-center gap-2 text-lg px-6 py-3"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                  {likeCount} Gilla
                </Button>
                <SaveOpportunityButton 
                  itemType="stock_case" 
                  itemId={stockCase.id} 
                  itemTitle={stockCase.title} 
                  onSaveSuccess={handleSaveSuccess} 
                  size="lg"
                  className="text-lg px-6 py-3"
                />
                {user && user.id !== stockCase.user_id && stockCase.user_id && (
                  <Button 
                    variant="outline" 
                    onClick={handleFollowClick}
                    className="flex items-center gap-2 text-lg px-6 py-3"
                  >
                    <UserPlus className="w-5 h-5" />
                    {isFollowing(stockCase.user_id) ? 'Sluta följ' : 'Följ författare'}
                  </Button>
                )}
                <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 text-lg px-6 py-3">
                  <Share2 className="w-5 h-5" />
                  Dela
                </Button>
                {isOwner && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUpdateDialog(true)} 
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Lägg till uppdatering
                  </Button>
                )}
              </div>
            )}

            {/* Performance Badge */}
            {performance !== null && (
              <div className="flex justify-center">
                <Badge 
                  variant={isPositivePerformance ? "default" : "destructive"} 
                  className="text-xl px-6 py-2"
                >
                  {isPositivePerformance ? <TrendingUp className="w-5 h-5 mr-2" /> : <TrendingDown className="w-5 h-5 mr-2" />}
                  {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>

          {/* Graph Section with Caption */}
          {displayData.image_url && (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={displayData.image_url} 
                  alt={stockCase.title}
                  className="w-full h-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => {
                    window.open(displayData.image_url, '_blank');
                  }}
                />
                <div className="absolute top-4 right-4">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => window.open(displayData.image_url, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Expandera
                  </Button>
                </div>
              </div>
              
              {/* Graph Caption */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground italic">
                  Teknisk analys: {stockCase.company_name} – Timeframe: Daily
                  {stockCase.sector && ` • Sektor: ${stockCase.sector}`}
                </p>
              </div>
            </div>
          )}

          {/* Login prompt for non-users */}
          {!user && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-3">
                Logga in för att gilla, spara och kommentera
              </p>
              <Button onClick={() => navigate('/auth')}>
                Logga in
              </Button>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Case Description with Structured Sections */}
            {displayData.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Analys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formatCaseDescription(displayData.description)}
                </CardContent>
              </Card>
            )}

            {/* Combined Overview Card - only show if there are financial metrics */}
            {(stockCase.entry_price || stockCase.current_price || stockCase.target_price || stockCase.stop_loss || stockCase.sector || stockCase.market_cap || stockCase.pe_ratio || stockCase.dividend_yield) && (
              <Card>
                <CardHeader>
                  <CardTitle>Finansiell Översikt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Price Information */}
                    {stockCase.entry_price && (
                      <div>
                        <p className="text-sm text-muted-foreground">Inköpspris</p>
                        <p className="font-bold text-lg text-primary">{stockCase.entry_price} SEK</p>
                      </div>
                    )}
                    {stockCase.current_price && (
                      <div>
                        <p className="text-sm text-muted-foreground">Nuvarande pris</p>
                        <p className="font-bold text-lg text-primary">{stockCase.current_price} SEK</p>
                      </div>
                    )}
                    {stockCase.target_price && (
                      <div>
                        <p className="text-sm text-muted-foreground">Målpris</p>
                        <p className="font-bold text-lg text-green-600">{stockCase.target_price} SEK</p>
                      </div>
                    )}
                    {stockCase.stop_loss && (
                      <div>
                        <p className="text-sm text-muted-foreground">Stop Loss</p>
                        <p className="font-bold text-lg text-red-600">{stockCase.stop_loss} SEK</p>
                      </div>
                    )}
                    
                    {/* Company Information */}
                    {stockCase.sector && (
                      <div>
                        <p className="text-sm text-muted-foreground">Sektor</p>
                        <p className="font-semibold">{stockCase.sector}</p>
                      </div>
                    )}
                    {stockCase.market_cap && (
                      <div>
                        <p className="text-sm text-muted-foreground">Börsvärde</p>
                        <p className="font-semibold">{stockCase.market_cap}</p>
                      </div>
                    )}
                    {stockCase.pe_ratio && (
                      <div>
                        <p className="text-sm text-muted-foreground">P/E-tal</p>
                        <p className="font-semibold">{stockCase.pe_ratio}</p>
                      </div>
                    )}
                    {stockCase.dividend_yield && (
                      <div>
                        <p className="text-sm text-muted-foreground">Utdelning</p>
                        <p className="font-semibold">{stockCase.dividend_yield}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Comment */}
            {stockCase.admin_comment && (
              <Card className="border-blue-600/20 bg-blue-600/10 dark:bg-blue-950/30">
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
              </Card>
            )}

            {/* Version History - moved under case text */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5" />
                Versionshistorik
              </h3>
              <StockCaseTimelineViewer 
                stockCaseId={stockCase.id} 
                originalStockCase={{
                  title: stockCase.title,
                  description: stockCase.description,
                  image_url: stockCase.image_url,
                  created_at: stockCase.created_at,
                  user_id: stockCase.user_id
                }} 
                onVersionSelect={handleVersionSelect} 
              />
            </div>

            {/* AI Chat Integration - moved closer to case text */}
            <StockCaseAIChat stockCase={stockCase} />

            {/* Comments Section with improved placeholder */}
            <div id="comments-section">
              <StockCaseComments stockCaseId={stockCase.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Card - Enhanced */}
            {stockCase.profiles && (
              <Card>
                <CardHeader>
                  <CardTitle>Skapad av</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div 
                      className="flex items-center space-x-4 cursor-pointer hover:bg-accent rounded-lg p-3 -m-3 transition-colors" 
                      onClick={() => navigate(`/profile/${stockCase.user_id}`)}
                    >
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold">
                          {stockCase.profiles.display_name?.charAt(0) || stockCase.profiles.username.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg hover:text-primary transition-colors">
                          {stockCase.profiles.display_name || stockCase.profiles.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{stockCase.profiles.username}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {/* TODO: Fetch user's published cases count */}
                          Publicerade case: 12
                        </p>
                      </div>
                    </div>
                    
                    {user && user.id !== stockCase.user_id && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleFollowClick}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {isFollowing(stockCase.user_id) ? 'Sluta följa' : 'Följ användare'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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

                {stockCase.case_categories && (
                  <div>
                    <span className="text-sm text-muted-foreground">Kategori:</span>
                    <Badge 
                      variant="outline" 
                      className="ml-2" 
                      style={{
                        borderColor: stockCase.case_categories.color,
                        color: stockCase.case_categories.color
                      }}
                    >
                      {stockCase.case_categories.name}
                    </Badge>
                  </div>
                )}

                {/* Social Stats */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      Gillningar
                    </span>
                    <span className="font-semibold">{likeCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      Kommentarer
                    </span>
                    <span className="font-semibold">
                      {/* TODO: Get actual comment count */}
                      --
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login Prompt for non-users */}
            {!user && (
              <Card>
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
              </Card>
            )}
          </div>
        </div>

        {/* Risk Warning - moved to bottom */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium mb-2 flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <AlertTriangle className="w-4 h-4" />
                Riskvarning
              </p>
              <p className="text-orange-600 dark:text-orange-200">
                Detta är inte finansiell rådgivning. Alla investeringar innebär risk. 
                Konsultera alltid en finansiell rådgivare innan du fattar investeringsbeslut.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Dialog */}
      <AddStockCaseUpdateDialog 
        isOpen={showUpdateDialog} 
        onClose={() => setShowUpdateDialog(false)} 
        stockCaseId={stockCase.id} 
        onSuccess={() => {
          setShowUpdateDialog(false);
          toast({
            title: "Uppdatering skapad!",
            description: "Din uppdatering har lagts till framgångsrikt"
          });
        }} 
      />
    </Layout>
  );
};

export default StockCaseDetail;