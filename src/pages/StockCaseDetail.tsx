import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Building,
  BarChart3,
  Eye,
  Users,
  AlertTriangle,
  Target,
  StopCircle,
  Brain,
  ShoppingCart,
  Plus,
  UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import StockCaseAIChat from '@/components/StockCaseAIChat';
import MarketSentimentAnalysis from '@/components/MarketSentimentAnalysis';
import SaveOpportunityButton from '@/components/SaveOpportunityButton';
import type { StockCase } from '@/types/stockCase';

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { stockCase, loading, error } = useStockCase(id || '');
  const { 
    likeCount, 
    isLiked, 
    toggleLike, 
    loading: likesLoading 
  } = useStockCaseLikes(id || '');
  
  const { followUser, unfollowUser, isFollowing } = useUserFollows();
  const isOwner = user && stockCase?.user_id === user.id;

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: stockCase.title,
          text: `Kolla in detta stock case: ${stockCase.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Sharing failed:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Länk kopierad",
        description: "Stock case-länken har kopierats till urklipp",
      });
    }
  };

  const handleLikeClick = () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att gilla stock cases",
        variant: "destructive",
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
        variant: "destructive",
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
      action: (
        <ToastAction altText="Gå till portfölj" onClick={() => navigate('/portfolio-implementation')}>
          Gå till portfölj
        </ToastAction>
      ),
    });

    // Refresh the community recommendations if the function is available
    if (typeof (window as any).refreshCommunityRecommendations === 'function') {
      (window as any).refreshCommunityRecommendations();
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/stock-cases')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Page Title - Large and Prominent */}
        <div className="text-center py-6 border-b">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {stockCase.title}
            </h1>
            {stockCase.ai_generated === true && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Brain className="w-4 h-4 mr-1" />
                AI
              </Badge>
            )}
          </div>
          <h2 className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
            {stockCase.company_name}
          </h2>
          
          {/* Performance Badge - Prominent */}
          {performance !== null && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mt-3 ${
              isPositivePerformance 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {isPositivePerformance ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="font-bold text-xl">
                {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Key Information Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
              {stockCase.sector && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{stockCase.sector}</span>
                </div>
              )}
              {stockCase.market_cap && (
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{stockCase.market_cap}</span>
                </div>
              )}
              {stockCase.pe_ratio && (
                <div className="text-sm">
                  <span className="text-muted-foreground">P/E: </span>
                  <span className="font-medium">{stockCase.pe_ratio}</span>
                </div>
              )}
              {stockCase.dividend_yield && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Utdelning: </span>
                  <span className="font-medium">{stockCase.dividend_yield}</span>
                </div>
              )}
            </div>

            {/* Stock Image */}
            {stockCase.image_url && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={stockCase.image_url}
                  alt={stockCase.company_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
              <Button
                variant={isLiked ? "default" : "outline"}
                onClick={handleLikeClick}
                disabled={likesLoading}
                className="flex items-center gap-2"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                Gilla ({likeCount})
              </Button>

              {user && (
                <SaveOpportunityButton
                  itemType="stock_case"
                  itemId={stockCase.id}
                  itemTitle={stockCase.company_name}
                  variant="outline"
                  showText={true}
                  onSaveSuccess={handleSaveSuccess}
                  className="flex items-center gap-2"
                />
              )}

              {user && !isOwner && stockCase.user_id && (
                <Button
                  variant={isFollowing(stockCase.user_id) ? "default" : "outline"}
                  onClick={handleFollowClick}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {isFollowing(stockCase.user_id) ? 'Följer användare' : 'Följ användare'}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Dela
              </Button>

              {user && (
                <Button
                  onClick={() => navigate('/portfolio-implementation')}
                  variant="outline"
                  className="flex items-center gap-2 ml-auto"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Till Portfölj
                </Button>
              )}
            </div>

            {/* Login prompt for non-authenticated users */}
            {!user && (
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Plus className="w-4 h-4" />
                  <p>
                    <strong>Logga in</strong> för att gilla, spara och följa användare
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {stockCase.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Analys & Beskrivning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className={showFullDescription ? '' : 'line-clamp-4'}>
                      {stockCase.description}
                    </p>
                    {stockCase.description.length > 300 && (
                      <Button
                        variant="link"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="p-0 h-auto mt-3"
                      >
                        {showFullDescription ? 'Visa mindre' : 'Läs mer'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Comment */}
            {stockCase.admin_comment && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="text-blue-800 dark:text-blue-200">
                    Expertkommentar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-700 dark:text-blue-300">
                    {stockCase.admin_comment}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* AI Chat Integration */}
            <StockCaseAIChat stockCase={stockCase} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Price Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5" />
                  Prisinformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stockCase.entry_price && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Ingångspris</span>
                    <span className="font-semibold">{stockCase.entry_price} SEK</span>
                  </div>
                )}
                
                {stockCase.current_price && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Nuvarande pris</span>
                    <span className="font-semibold">{stockCase.current_price} SEK</span>
                  </div>
                )}

                {stockCase.target_price && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Målkurs</span>
                    <span className="font-semibold text-green-600">{stockCase.target_price} SEK</span>
                  </div>
                )}

                {stockCase.stop_loss && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Stop loss</span>
                    <span className="font-semibold text-red-600">{stockCase.stop_loss} SEK</span>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={
                      stockCase.status === 'winner' ? 'default' :
                      stockCase.status === 'loser' ? 'destructive' : 'secondary'
                    }>
                      {stockCase.status === 'active' ? 'Aktiv' : 
                       stockCase.status === 'winner' ? 'Vinnare' : 'Förlorare'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5" />
                  Case Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Skapad {formatDistanceToNow(new Date(stockCase.created_at), { 
                      addSuffix: true, 
                      locale: sv 
                    })}
                  </span>
                </div>

                {stockCase.profiles && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>Av </span>
                        <button
                          onClick={() => navigate(`/profile/${stockCase.user_id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {stockCase.profiles.display_name || stockCase.profiles.username}
                        </button>
                      </div>
                    </div>
                    
                    {/* Follow Button for Profile - Only show if not own case and user is logged in */}
                    {user && stockCase.user_id !== user.id && (
                      <Button
                        onClick={handleFollowClick}
                        variant={isFollowing(stockCase.user_id) ? "default" : "outline"}
                        size="sm"
                        className="w-full flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>
                          {isFollowing(stockCase.user_id) ? 'Följer användare' : 'Följ användare'}
                        </span>
                      </Button>
                    )}
                  </div>
                )}

                {stockCase.case_categories && (
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: stockCase.case_categories.color,
                        color: stockCase.case_categories.color 
                      }}
                    >
                      {stockCase.case_categories.name}
                    </Badge>
                  </div>
                )}

                {stockCase.closed_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <StopCircle className="w-4 h-4" />
                    <span>
                      Stängd {formatDistanceToNow(new Date(stockCase.closed_at), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Warning */}
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Investeringsvarning
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Detta är inte investeringsrådgivning. Alla investeringar medför risk för förlust. 
                      Gör alltid din egen analys innan du investerar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StockCaseDetail;
