import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStockCase } from '@/hooks/useStockCases';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useStockCaseUpdates } from '@/hooks/useStockCaseUpdates';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToastAction } from '@/components/ui/toast';
import { ArrowLeft, Heart, Share2, TrendingUp, TrendingDown, Calendar, Building, BarChart3, Eye, Users, AlertTriangle, Target, StopCircle, Brain, ShoppingCart, Plus, UserPlus, PlusCircle, History, ChevronLeft, ChevronRight, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import MarketSentimentAnalysis from '@/components/MarketSentimentAnalysis';
import SaveOpportunityButton from '@/components/SaveOpportunityButton';
import { highlightNumbersSafely } from '@/utils/sanitizer';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';
import { getOptimizedCaseImage, handleCaseImageError } from '@/utils/imageUtils';
import AddStockCaseUpdateDialog from '@/components/AddStockCaseUpdateDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import type { StockCase } from '@/types/stockCase';

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { stockCase, loading, error } = useStockCase(id || '');
  const { likeCount, isLiked, toggleLike, loading: likesLoading } = useStockCaseLikes(id || '');
  const { followUser, unfollowUser, isFollowing } = useUserFollows();
  const { updates, isLoading: updatesLoading, deleteUpdate } = useStockCaseUpdates(id || '');

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
          <Button onClick={() => navigate('/discover')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till Discover
          </Button>
        </div>
      </Layout>
    );
  }

  const performance = stockCase.performance_percentage;
  const isPositivePerformance = performance && performance >= 0;
  const isOwner = user && stockCase.user_id === user.id;
  const caseCurrency = stockCase.currency?.toUpperCase() || 'SEK';
  const formatCasePrice = (value?: number | null) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return formatCurrency(value, caseCurrency);
  };

  // Create timeline of all versions (original + updates)
  const timeline = [
    {
      id: 'original',
      title: stockCase?.title || '',
      description: stockCase?.description || '',
      image_url: stockCase?.image_url || '',
      created_at: stockCase?.created_at || '',
      user_id: stockCase?.user_id || '',
      isOriginal: true,
      update_type: 'original' as const,
    },
    ...(updates || []).map(update => ({
      ...update,
      isOriginal: false
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Get current version based on carousel index
  const currentVersion = timeline[currentImageIndex];
  const hasMultipleVersions = timeline.length > 1;

  const isAiGeneratedCase = Boolean(stockCase.ai_generated);
  const isAiGeneratedImage = currentVersion?.isOriginal
    ? isAiGeneratedCase
    : currentVersion?.update_type === 'ai_generated_update';

  const hasRealImage = Boolean(currentVersion?.image_url);
  const optimizedImageSources = getOptimizedCaseImage(currentVersion?.image_url);
  const displayImageSrc = optimizedImageSources?.src ?? currentVersion?.image_url ?? null;
  const displayImageSrcSet = optimizedImageSources?.srcSet;

  const imageWrapperClasses = cn(
    'relative group mx-auto w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300',
    isAiGeneratedImage ? 'max-w-xl' : 'max-w-4xl'
  );

  const imageDisplayWrapperClasses = cn(
    'overflow-hidden rounded-lg transition-all duration-300',
    isAiGeneratedImage ? 'bg-muted/70 p-4' : ''
  );

  const imageElementClasses = cn(
    'w-full h-auto transition-all duration-300',
    hasRealImage ? 'cursor-pointer' : 'cursor-default',
    isAiGeneratedImage
      ? 'max-h-[280px] object-contain'
      : 'max-h-[560px] object-cover'
  );

  const normalizedCaseTitle = normalizeStockCaseTitle(stockCase.title, stockCase.company_name);
  const displayTitle = normalizeStockCaseTitle(currentVersion?.title, normalizedCaseTitle) || normalizedCaseTitle;

  const handleShare = async () => {
    const shareTitle = displayTitle;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Kolla in detta stock case: ${shareTitle}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Sharing failed:', error);
        toast({
          title: "Delning misslyckades",
          description: "Kunde inte dela stock caset just nu. Försök igen senare.",
          variant: "destructive",
        });
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

  const handleDiscussWithAI = () => {
    const companyName = stockCase.company_name || displayTitle || 'Aktiecase';
    const ticker = stockCase.ticker ? ` (${stockCase.ticker})` : '';
    navigate('/ai-chatt', {
      state: {
        createNewSession: true,
        sessionName: `${companyName}${ticker}`,
        initialMessage: `Kan vi diskutera ${companyName}${ticker} vidare? Jag vill få fler investeringsinsikter om aktien.`
      }
    });
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

  // Carousel navigation
  const goToPrevious = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : timeline.length - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex(prev => (prev < timeline.length - 1 ? prev + 1 : 0));
  };

  const goToVersion = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Delete handler
  const handleDeleteUpdate = async () => {
    if (updateToDelete && !timeline.find(v => v.id === updateToDelete)?.isOriginal) {
      try {
        await deleteUpdate(updateToDelete);
        // If we deleted the current version, go to latest
        if (currentVersion && currentVersion.id === updateToDelete) {
          setCurrentImageIndex(0);
        }
        setUpdateToDelete(null);
        toast({
          title: "Uppdatering borttagen",
          description: "Uppdateringen har tagits bort framgångsrikt"
        });
      } catch (error) {
        console.error('Error deleting update:', error);
        toast({
          title: "Fel",
          description: "Kunde inte ta bort uppdateringen",
          variant: "destructive"
        });
      }
    }
  };

  const canDeleteCurrent = user && currentVersion && !currentVersion.isOriginal && currentVersion.user_id === user.id;

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
      
      return (
        <p 
          key={index} 
          className="text-foreground leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(section) }}
        />
      );
    });
  };

  const rawAnalysisDescription = stockCase.long_description
    ?? currentVersion?.description
    ?? stockCase.description
    ?? null;

  let fiftyTwoWeekSummary: string | null = null;
  let cleanedAnalysisDescription: string | null = rawAnalysisDescription;

  if (typeof rawAnalysisDescription === 'string') {
    const summaryMatch = rawAnalysisDescription.match(/52-veckors\s+högsta:\s*[0-9.,-]+\s*\|\s*52-veckors\s+lägsta:\s*[0-9.,-]+/i);

    if (summaryMatch) {
      const normalizedSummary = summaryMatch[0]
        .replace(/\s*\|\s*/g, ' | ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      fiftyTwoWeekSummary = normalizedSummary;

      const withoutSummary = rawAnalysisDescription
        .replace(summaryMatch[0], '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      cleanedAnalysisDescription = withoutSummary.length > 0 ? withoutSummary : null;
    }
  }

  let fiftyTwoWeekHighText: string | null = null;
  let fiftyTwoWeekLowText: string | null = null;

  if (fiftyTwoWeekSummary) {
    const highMatch = fiftyTwoWeekSummary.match(/52-veckors\s+högsta:\s*([0-9.,-]+)/i);
    const lowMatch = fiftyTwoWeekSummary.match(/52-veckors\s+lägsta:\s*([0-9.,-]+)/i);

    fiftyTwoWeekHighText = highMatch?.[1]?.trim()
      ? `52-veckors högsta: ${highMatch[1].trim()}`
      : null;
    fiftyTwoWeekLowText = lowMatch?.[1]?.trim()
      ? `52-veckors lägsta: ${lowMatch[1].trim()}`
      : null;
  }

  const displayedAnalysisDescription = typeof cleanedAnalysisDescription === 'string'
    ? (cleanedAnalysisDescription.trim().length > 0 ? cleanedAnalysisDescription.trim() : null)
    : null;

  const hasPricingMetrics = Boolean(
    formatCasePrice(stockCase.entry_price)
    || formatCasePrice(stockCase.current_price)
    || (!isAiGeneratedCase && formatCasePrice(stockCase.target_price))
    || (!isAiGeneratedCase && formatCasePrice(stockCase.stop_loss))
  );

  const hasCompanyDetails = Boolean(stockCase.sector);

  const hasSheetFundamentals = Boolean(
    stockCase.market_cap
    || stockCase.pe_ratio
    || stockCase.dividend_yield
    || fiftyTwoWeekHighText
    || fiftyTwoWeekLowText
  );

  const shouldShowFinancialOverview = hasPricingMetrics || hasCompanyDetails || hasSheetFundamentals;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/discover')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Hero Section with Improved Hierarchy */}
        <div className="space-y-6">
          {/* Title and Metadata */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-5xl font-bold tracking-tight text-center">{displayTitle}</h1>
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

          {/* Graph Section with Carousel */}
          {displayImageSrc && (
            <div className="space-y-4">
              {/* Version info and controls */}
              <div className="flex items-center justify-between min-h-[1.5rem]">
                <div className="flex items-center gap-2 flex-1" aria-hidden="true" />
                
                {canDeleteCurrent && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setUpdateToDelete(currentVersion.id)} 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Ta bort version
                  </Button>
                )}
              </div>

              <div className={imageWrapperClasses}>
                <div className={imageDisplayWrapperClasses}>
                  <img
                    src={displayImageSrc}
                    srcSet={displayImageSrcSet}
                    alt={displayTitle}
                    loading="lazy"
                    decoding="async"
                    className={imageElementClasses}
                    onError={handleCaseImageError}
                    data-original-src={currentVersion?.image_url || undefined}
                    onClick={() => {
                      if (currentVersion.image_url) {
                        window.open(currentVersion.image_url, '_blank');
                      }
                    }}
                  />
                </div>

                {/* Navigation arrows */}
                {hasMultipleVersions && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={goToPrevious}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-0 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={goToNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-0 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                {/* Expand button */}
                <div className="absolute top-4 right-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(currentVersion.image_url, '_blank')}
                    className="bg-black/70 hover:bg-black/80 text-white border-0"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Expandera
                  </Button>
                </div>

                {/* Version indicator */}
                {currentImageIndex > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                      <History className="w-3 h-3 mr-1" />
                      Historisk
                    </Badge>
                  </div>
                )}

                {isAiGeneratedImage && (
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                      <Brain className="w-3 h-3 mr-1" />
                      AI-genererad bild
                    </Badge>
                  </div>
                )}
              </div>

              {hasMultipleVersions && (
                <div className="flex justify-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    {currentImageIndex + 1} av {timeline.length}
                  </Badge>
                </div>
              )}

              {/* Dots indicator */}
              {hasMultipleVersions && (
                <div className="flex justify-center gap-2">
                  {timeline.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToVersion(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        currentImageIndex === index 
                          ? 'bg-primary scale-125' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Quick version selector */}
              {hasMultipleVersions && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {timeline.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => goToVersion(index)}
                      className={`flex-shrink-0 px-3 py-2 rounded-md text-xs transition-colors ${
                        currentImageIndex === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {index === 0 ? 'Nuvarande' : `Historik ${index}`}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Graph Caption */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground italic">
                  Teknisk analys: {stockCase.company_name} – Timeframe: {stockCase.timeframe || 'Ej specificerad'}
                  {stockCase.sector && ` • Sektor: ${stockCase.sector}`}
                </p>
              </div>
            </div>
          )}

          {/* CTA Buttons repositioned under the visual */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 text-lg px-6 py-3">
              <Share2 className="w-5 h-5" />
              Dela
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscussWithAI}
              className="flex items-center gap-2 text-lg px-6 py-3"
            >
              <MessageSquare className="w-5 h-5" />
              Diskutera i AI-chatten
            </Button>
            <Button
              variant="outline"
              onClick={handleLikeClick}
              disabled={likesLoading}
              className="flex items-center gap-2 text-lg px-6 py-3"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
              {likeCount} Gilla
            </Button>
            {user && (
              <SaveOpportunityButton
                itemType="stock_case"
                itemId={stockCase.id}
                itemTitle={displayTitle}
                onSaveSuccess={handleSaveSuccess}
                size="lg"
                className="text-lg px-6 py-3"
              />
            )}
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
            {/* Combined Overview Card - only show if there are financial metrics */}
            {shouldShowFinancialOverview && (
              <Card>
                <CardHeader>
                  <CardTitle>Finansiell Översikt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {hasPricingMetrics && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prisdata</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {formatCasePrice(stockCase.entry_price) && (
                          <div>
                            <p className="text-sm text-muted-foreground">Inköpspris</p>
                            <p className="font-bold text-lg text-primary">{formatCasePrice(stockCase.entry_price)}</p>
                          </div>
                        )}
                        {formatCasePrice(stockCase.current_price) && (
                          <div>
                            <p className="text-sm text-muted-foreground">Nuvarande pris</p>
                            <p className="font-bold text-lg text-primary">{formatCasePrice(stockCase.current_price)}</p>
                          </div>
                        )}
                        {!isAiGeneratedCase && formatCasePrice(stockCase.target_price) && (
                          <div>
                            <p className="text-sm text-muted-foreground">Målpris</p>
                            <p className="font-bold text-lg text-green-600">{formatCasePrice(stockCase.target_price)}</p>
                          </div>
                        )}
                        {!isAiGeneratedCase && formatCasePrice(stockCase.stop_loss) && (
                          <div>
                            <p className="text-sm text-muted-foreground">Stop Loss</p>
                            <p className="font-bold text-lg text-red-600">{formatCasePrice(stockCase.stop_loss)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {hasCompanyDetails && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bolagsinformation</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {stockCase.sector && (
                          <div>
                            <p className="text-sm text-muted-foreground">Sektor</p>
                            <p className="font-semibold">{stockCase.sector}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {hasSheetFundamentals && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nyckeltal (Google Sheets)</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {stockCase.market_cap && (
                          <div>
                            <p className="text-sm text-muted-foreground">Börsvärde</p>
                            <p className="font-semibold">
                              <span dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(stockCase.market_cap) }} />
                            </p>
                          </div>
                        )}
                        {stockCase.pe_ratio && (
                          <div>
                            <p className="text-sm text-muted-foreground">P/E-tal</p>
                            <p className="font-semibold">
                              <span dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(stockCase.pe_ratio) }} />
                            </p>
                          </div>
                        )}
                      </div>

                      {(stockCase.dividend_yield || fiftyTwoWeekHighText || fiftyTwoWeekLowText) && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {stockCase.dividend_yield && (
                            <div>
                              <p className="text-sm text-muted-foreground">Utdelning</p>
                              <p className="font-semibold">
                                <span dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(stockCase.dividend_yield) }} />
                              </p>
                            </div>
                          )}
                          {(fiftyTwoWeekHighText || fiftyTwoWeekLowText) && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">52-veckors spann</p>
                              <div className="font-semibold space-y-1">
                                {fiftyTwoWeekHighText && (
                                  <div
                                    dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(fiftyTwoWeekHighText) }}
                                  />
                                )}
                                {fiftyTwoWeekLowText && (
                                  <div
                                    dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(fiftyTwoWeekLowText) }}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Case Description with Structured Sections */}
            {displayedAnalysisDescription && (
              <Card>
                <CardHeader>
                  <CardTitle>Analys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formatCaseDescription(displayedAnalysisDescription)}
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

            {/* AI Chat Integration - temporarily disabled per request */}
            {/* <StockCaseAIChat stockCase={stockCase} /> */}

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!updateToDelete} onOpenChange={() => setUpdateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort uppdatering</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort denna uppdatering? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUpdate} className="bg-red-600 hover:bg-red-700">
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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