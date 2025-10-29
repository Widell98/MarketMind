import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { ToastAction } from '@/components/ui/toast';
import { ArrowLeft, Heart, Share2, TrendingUp, TrendingDown, Building, BarChart3, Users, AlertTriangle, Target, StopCircle, Brain, ShoppingCart, Plus, UserPlus, PlusCircle, History, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Trash2, MessageSquare, LineChart, Coins, Percent, User, Clock, Tag, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import MarketSentimentAnalysis from '@/components/MarketSentimentAnalysis';
import SaveOpportunityButton from '@/components/SaveOpportunityButton';
import { highlightNumbersSafely } from '@/utils/sanitizer';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';
import AddStockCaseUpdateDialog from '@/components/AddStockCaseUpdateDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import type { StockCase } from '@/types/stockCase';
import { fetchSheetTickerMetrics, type SheetTickerMetrics } from '@/utils/sheetMetrics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const parseNumericFromString = (value: string): number | null => {
  if (!value) {
    return null;
  }

  const condensed = value.replace(/\s+/g, '');
  const digitsAndSeparators = condensed.replace(/[^0-9,.-]/g, '');

  const hasComma = digitsAndSeparators.includes(',');
  const hasDot = digitsAndSeparators.includes('.');

  const attemptParse = (candidate: string): number | null => {
    if (!candidate) {
      return null;
    }

    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  };

  if (hasComma && hasDot) {
    const noCommas = digitsAndSeparators.replace(/,/g, '');
    const parsedNoCommas = attemptParse(noCommas);
    if (parsedNoCommas !== null) {
      return parsedNoCommas;
    }

    const swapped = digitsAndSeparators.replace(/\./g, '').replace(/,/g, '.');
    const parsedSwapped = attemptParse(swapped);
    if (parsedSwapped !== null) {
      return parsedSwapped;
    }
  } else if (hasComma) {
    const commaAsDecimal = digitsAndSeparators.replace(/\./g, '').replace(/,/g, '.');
    const parsedCommaDecimal = attemptParse(commaAsDecimal);
    if (parsedCommaDecimal !== null) {
      return parsedCommaDecimal;
    }

    const noComma = digitsAndSeparators.replace(/,/g, '');
    const parsedNoComma = attemptParse(noComma);
    if (parsedNoComma !== null) {
      return parsedNoComma;
    }
  } else if (hasDot) {
    const dotAsDecimal = attemptParse(digitsAndSeparators);
    if (dotAsDecimal !== null) {
      return dotAsDecimal;
    }

    const noDot = digitsAndSeparators.replace(/\./g, '');
    const parsedNoDot = attemptParse(noDot);
    if (parsedNoDot !== null) {
      return parsedNoDot;
    }
  } else {
    const parsed = attemptParse(digitsAndSeparators);
    if (parsed !== null) {
      return parsed;
    }
  }

  const fallback = attemptParse(digitsAndSeparators.replace(/,/g, '.'));
  return fallback;
};

const formatRoundedUpNumber = (value: number, decimals: number): number => {
  if (!Number.isFinite(value)) {
    return value;
  }

  if (decimals <= 0) {
    return Math.ceil(value);
  }

  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
};

const formatApproximateMarketCap = (
  rawValue: string | number | null | undefined,
  currencyHint: string | null | undefined,
): string | null => {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  const stringValue = typeof rawValue === 'number'
    ? rawValue.toString()
    : typeof rawValue === 'string'
      ? rawValue.trim()
      : '';

  if (!stringValue) {
    return null;
  }

  const detectedCurrencyMatch = stringValue.toUpperCase().match(/\b[A-Z]{3}\b/);
  const resolvedCurrency = (currencyHint || detectedCurrencyMatch?.[0] || '').toUpperCase();

  const numericValue = typeof rawValue === 'number'
    ? rawValue
    : parseNumericFromString(stringValue);

  if (numericValue !== null && Number.isFinite(numericValue)) {
    const absolute = Math.abs(numericValue);

    let divisor = 1;
    let unitLabel: string | null = null;

    if (absolute >= 1_000_000_000_000) {
      divisor = 1_000_000_000_000;
      unitLabel = 'biljoner';
    } else if (absolute >= 1_000_000_000) {
      divisor = 1_000_000_000;
      unitLabel = 'miljarder';
    } else if (absolute >= 1_000_000) {
      divisor = 1_000_000;
      unitLabel = 'miljoner';
    }

    const normalized = numericValue / divisor;
    const decimals = unitLabel ? 1 : 0;
    const rounded = formatRoundedUpNumber(normalized, decimals);

    const formattedNumber = new Intl.NumberFormat('sv-SE', {
      minimumFractionDigits: unitLabel && !Number.isInteger(rounded) ? 1 : 0,
      maximumFractionDigits: unitLabel ? 1 : 0,
    }).format(rounded);

    const parts = [
      'Cirka',
      formattedNumber,
    ];

    if (unitLabel) {
      parts.push(unitLabel);
    }

    if (resolvedCurrency) {
      parts.push(resolvedCurrency);
    }

    return parts.join(' ');
  }

  if (resolvedCurrency && !stringValue.toUpperCase().includes(resolvedCurrency)) {
    return `${stringValue} ${resolvedCurrency}`;
  }

  return stringValue;
};

type FinancialStat = {
  key: string;
  label: string;
  icon?: LucideIcon;
  value?: React.ReactNode;
  valueHtml?: string | null;
  valueClassName?: string;
  description?: React.ReactNode;
};

type NavigationCase = Pick<StockCase, 'id' | 'title' | 'company_name' | 'ai_generated' | 'created_at'>;

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const analysisSectionRef = useRef<HTMLDivElement | null>(null);
  const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);
  const [showFullFinancialDetails, setShowFullFinancialDetails] = useState(false);
  const [sheetMetrics, setSheetMetrics] = useState<SheetTickerMetrics | null>(null);
  const [isHeroLogoError, setIsHeroLogoError] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);

  const {
    data: navigationCases = [],
    isLoading: navigationLoading,
    error: navigationError,
  } = useQuery<NavigationCase[]>({
    queryKey: ['stock-case-navigation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_cases')
        .select('id, title, company_name, ai_generated, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch stock case navigation list', error);
        throw error;
      }

      return (data || []) as NavigationCase[];
    },
  });

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { stockCase, loading, error } = useStockCase(id || '');
  const { likeCount, isLiked, toggleLike, loading: likesLoading } = useStockCaseLikes(id || '');
  const { followUser, unfollowUser, isFollowing } = useUserFollows();
  const { updates, isLoading: updatesLoading, deleteUpdate } = useStockCaseUpdates(id || '');

  const { previousCase, nextCase } = useMemo(() => {
    if (!stockCase?.id) {
      return { previousCase: null as NavigationCase | null, nextCase: null as NavigationCase | null };
    }

    const currentIndex = navigationCases.findIndex((navigationCase) => navigationCase.id === stockCase.id);

    if (currentIndex === -1) {
      return { previousCase: null as NavigationCase | null, nextCase: null as NavigationCase | null };
    }

    const prev = currentIndex > 0 ? navigationCases[currentIndex - 1] : null;
    const next = currentIndex < navigationCases.length - 1 ? navigationCases[currentIndex + 1] : null;

    return { previousCase: prev, nextCase: next };
  }, [navigationCases, stockCase?.id]);

  const previousCaseTitle = previousCase
    ? normalizeStockCaseTitle(previousCase.title, previousCase.company_name)
    : null;
  const nextCaseTitle = nextCase ? normalizeStockCaseTitle(nextCase.title, nextCase.company_name) : null;

  const handleNavigateToNeighbor = (caseId?: string | null) => {
    if (!caseId) {
      return;
    }

    navigate(`/stock-cases/${caseId}`);
  };

  useEffect(() => {
    const ticker = stockCase?.ticker ?? null;

    if (!ticker) {
      setSheetMetrics(null);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setSheetMetrics(null);

    fetchSheetTickerMetrics(ticker, { signal: controller.signal })
      .then((metrics) => {
        if (!isActive) {
          return;
        }
        setSheetMetrics(metrics);
      })
      .catch((fetchError) => {
        const errorObject = fetchError as Error;
        if (errorObject?.name === 'AbortError') {
          return;
        }
        console.error('Failed to load Google Sheet metrics', fetchError);
        if (!isActive) {
          return;
        }
        setSheetMetrics(null);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [stockCase?.ticker]);

  useEffect(() => {
    if (!stockCase?.id) {
      return;
    }

    setCurrentImageIndex(0);
    setShowFullFinancialDetails(false);
    setShowUpdateDialog(false);
    setIsHeroLogoError(false);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stockCase?.id]);

  const navigationButtonBaseClasses = 'rounded-full border border-border/40 bg-background/70 text-muted-foreground shadow-sm backdrop-blur hover:bg-background/90 hover:text-foreground';

  const CaseNavigationControls = () => {
    if (navigationError) {
      return null;
    }

    if (navigationLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full border border-border/30 bg-muted/40" />
          <div className="h-9 w-9 animate-pulse rounded-full border border-border/30 bg-muted/40" />
        </div>
      );
    }

    if (!previousCase && !nextCase) {
      return null;
    }

    return (
      <TooltipProvider delayDuration={150}>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn('h-9 w-9', navigationButtonBaseClasses)}
                  disabled={!previousCase}
                  onClick={() => handleNavigateToNeighbor(previousCase?.id)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Föregående case</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>
              {previousCaseTitle ? `Föregående: ${previousCaseTitle}` : 'Föregående case'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn('h-9 w-9', navigationButtonBaseClasses)}
                  disabled={!nextCase}
                  onClick={() => handleNavigateToNeighbor(nextCase?.id)}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Nästa case</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>
              {nextCaseTitle ? `Nästa: ${nextCaseTitle}` : 'Nästa case'}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  };

  // NOW we can have conditional logic and early returns
  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8">
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

  const formatPriceValue = (value: number | null | undefined, currencyCode: string): string | null => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    try {
      return formatCurrency(value, currencyCode);
    } catch (_error) {
      const formatted = new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
      return currencyCode ? `${formatted} ${currencyCode}` : formatted;
    }
  };

  const resolvedSheetCurrency = sheetMetrics?.currency?.toUpperCase() || caseCurrency;

  const formatCasePrice = (value?: number | null) => formatPriceValue(value, caseCurrency);
  const formatSheetPrice = (value?: number | null) => formatPriceValue(value, resolvedSheetCurrency);

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
  const displayImageSrc = currentVersion?.image_url ?? null;
  const shouldShowHeroImage = Boolean(displayImageSrc && !isAiGeneratedCase);

  const imageWrapperClasses = cn(
    'relative mx-auto w-full overflow-hidden rounded-[32px] bg-background/90 ring-1 ring-border/40 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur supports-[backdrop-filter]:bg-background/70 transition-all duration-300 hover:shadow-[0_28px_80px_-50px_rgba(15,23,42,0.5)]',
    isAiGeneratedImage ? 'max-w-xl' : 'max-w-4xl'
  );

  const imageDisplayWrapperClasses = cn(
    'overflow-hidden rounded-[28px] transition-all duration-300',
    isAiGeneratedImage ? 'bg-muted/60 p-4' : 'bg-black/5'
  );

  const imageElementClasses = cn(
    'w-full h-auto transition-all duration-300',
    hasRealImage ? 'cursor-pointer' : 'cursor-default',
    isAiGeneratedImage
      ? 'max-h-[320px] object-contain'
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
  const formatCaseDescription = (description: string | null): React.ReactNode[] | null => {
    if (!description) return null;

    const normalizedDescription = description.replace(/\r\n/g, '\n').trim();
    if (!normalizedDescription) {
      return null;
    }

    let sections = normalizedDescription
      .split(/\n{2,}/)
      .map((section) => section.trim())
      .filter((section) => section.length > 0);

    if (sections.length <= 1) {
      const fallbackSections = normalizedDescription
        .split(/\n+/)
        .map((section) => section.trim())
        .filter((section) => section.length > 0);

      if (fallbackSections.length > 1) {
        sections = fallbackSections;
      }
    }

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
          dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(section.replace(/\n/g, '<br />')) }}
        />
      );
    });
  };

  const rawAnalysisDescription = stockCase.long_description
    ?? currentVersion?.description
    ?? stockCase.description
    ?? null;

  let extractedFiftyTwoWeekSummary: string | null = null;
  let cleanedAnalysisDescription: string | null = rawAnalysisDescription;

  if (typeof rawAnalysisDescription === 'string') {
    const summaryMatch = rawAnalysisDescription.match(/52-veckors\s+högsta:\s*[0-9.,-]+\s*\|\s*52-veckors\s+lägsta:\s*[0-9.,-]+/i);

    if (summaryMatch) {
      const normalizedSummary = summaryMatch[0]
        .replace(/\s*\|\s*/g, ' | ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      extractedFiftyTwoWeekSummary = normalizedSummary;

      const withoutSummary = rawAnalysisDescription
        .replace(summaryMatch[0], '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      cleanedAnalysisDescription = withoutSummary.length > 0 ? withoutSummary : null;
    }
  }

  let extractedFiftyTwoWeekHighText: string | null = null;
  let extractedFiftyTwoWeekLowText: string | null = null;

  if (extractedFiftyTwoWeekSummary) {
    const highMatch = extractedFiftyTwoWeekSummary.match(/52-veckors\s+högsta:\s*([0-9.,-]+)/i);
    const lowMatch = extractedFiftyTwoWeekSummary.match(/52-veckors\s+lägsta:\s*([0-9.,-]+)/i);

    extractedFiftyTwoWeekHighText = highMatch?.[1]?.trim()
      ? `52-veckors högsta: ${highMatch[1].trim()}`
      : null;
    extractedFiftyTwoWeekLowText = lowMatch?.[1]?.trim()
      ? `52-veckors lägsta: ${lowMatch[1].trim()}`
      : null;
  }

  const formatSheetRangeValue = (value: number | null | undefined): string | null => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    try {
      const formatted = formatPriceValue(value, resolvedSheetCurrency);
      if (formatted) {
        return formatted;
      }
      return null;
    } catch (_error) {
      return new Intl.NumberFormat('sv-SE', {
        maximumFractionDigits: 2,
      }).format(value);
    }
  };

  const sheetHighValue = formatSheetRangeValue(sheetMetrics?.fiftyTwoWeekHigh ?? null);
  const sheetLowValue = formatSheetRangeValue(sheetMetrics?.fiftyTwoWeekLow ?? null);

  const sheetFiftyTwoWeekHighText = sheetHighValue ? `52-veckors högsta: ${sheetHighValue}` : null;
  const sheetFiftyTwoWeekLowText = sheetLowValue ? `52-veckors lägsta: ${sheetLowValue}` : null;

  const finalFiftyTwoWeekHighText = sheetFiftyTwoWeekHighText ?? extractedFiftyTwoWeekHighText;
  const finalFiftyTwoWeekLowText = sheetFiftyTwoWeekLowText ?? extractedFiftyTwoWeekLowText;

  const displayedAnalysisDescription = typeof cleanedAnalysisDescription === 'string'
    ? (cleanedAnalysisDescription.trim().length > 0 ? cleanedAnalysisDescription.trim() : null)
    : null;

  const formattedAnalysisContent = formatCaseDescription(displayedAnalysisDescription);
  const hasAnalysisContent = Boolean(formattedAnalysisContent?.length);

  const resolvedMarketCap = formatApproximateMarketCap(
    sheetMetrics?.marketCap ?? stockCase.market_cap ?? null,
    sheetMetrics?.currency ?? stockCase.currency ?? null,
  );
  const resolvedPeRatio = sheetMetrics?.peRatio ?? stockCase.pe_ratio;
  const resolvedDividendYield = sheetMetrics?.dividendYield ?? stockCase.dividend_yield;

  const renderStatValue = (stat: FinancialStat) => {
    if (stat.valueHtml) {
      return (
        <span dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(stat.valueHtml) }} />
      );
    }

    if (stat.value !== null && stat.value !== undefined) {
      return stat.value;
    }

    return <span className="text-muted-foreground">—</span>;
  };

  const renderStatsList = (stats: FinancialStat[]) => {
    if (!stats.length) {
      return null;
    }

    return (
      <dl className="mt-3 divide-y divide-border/30 overflow-hidden rounded-2xl border border-border/30 bg-background/80">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          const valueClassName = stat.valueClassName
            ? cn('text-base font-semibold text-foreground', stat.valueClassName)
            : 'text-base font-semibold text-foreground';

          return (
            <div
              key={stat.key}
              className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-4 px-5 py-4 first:pt-5 last:pb-5"
            >
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {IconComponent ? <IconComponent className="h-4 w-4 text-muted-foreground/70" /> : null}
                <span>{stat.label}</span>
              </dt>
              <dd className={cn('text-right sm:text-left', valueClassName)}>{renderStatValue(stat)}</dd>
              {stat.description ? (
                <dd className="col-span-2 pt-2 text-xs leading-snug text-muted-foreground">{stat.description}</dd>
              ) : null}
            </div>
          );
        })}
      </dl>
    );
  };

  const currentPriceDisplay = formatCasePrice(stockCase.current_price);
  const sheetPriceDisplay = formatSheetPrice(sheetMetrics?.price ?? null);
  const targetPriceDisplay = !isAiGeneratedCase ? formatCasePrice(stockCase.target_price) : null;
  const stopLossDisplay = !isAiGeneratedCase ? formatCasePrice(stockCase.stop_loss) : null;

  const pricingStats: FinancialStat[] = [];

  if (currentPriceDisplay) {
    pricingStats.push({
      key: 'current-price',
      label: 'Nuvarande pris',
      icon: LineChart,
      value: currentPriceDisplay,
    });
  }

  if (sheetPriceDisplay && sheetPriceDisplay !== currentPriceDisplay) {
    pricingStats.push({
      key: 'sheet-price',
      label: 'Senaste pris',
      icon: LineChart,
      value: sheetPriceDisplay,
      valueClassName: 'text-lg text-muted-foreground',
    });
  }

  if (targetPriceDisplay) {
    pricingStats.push({
      key: 'target-price',
      label: 'Målpris',
      icon: Target,
      value: targetPriceDisplay,
      valueClassName: 'text-emerald-600',
    });
  }

  if (stopLossDisplay) {
    pricingStats.push({
      key: 'stop-loss',
      label: 'Stop loss',
      icon: StopCircle,
      value: stopLossDisplay,
      valueClassName: 'text-rose-600',
    });
  }

  const companyStats: FinancialStat[] = [];

  if (stockCase.sector) {
    companyStats.push({
      key: 'sector',
      label: 'Sektor',
      icon: Building,
      value: stockCase.sector,
      valueClassName: 'text-lg',
    });
  }

  const fundamentalsStats: FinancialStat[] = [];

  if (resolvedMarketCap) {
    fundamentalsStats.push({
      key: 'market-cap',
      label: 'Börsvärde',
      icon: Coins,
      valueHtml: resolvedMarketCap,
    });
  }

  if (resolvedPeRatio) {
    fundamentalsStats.push({
      key: 'pe-ratio',
      label: 'P/E-tal',
      icon: BarChart3,
      valueHtml: resolvedPeRatio,
    });
  }

  if (resolvedDividendYield) {
    fundamentalsStats.push({
      key: 'dividend-yield',
      label: 'Utdelning',
      icon: Percent,
      valueHtml: resolvedDividendYield,
    });
  }

  if (finalFiftyTwoWeekHighText || finalFiftyTwoWeekLowText) {
    fundamentalsStats.push({
      key: 'fifty-two-week-range',
      label: '52-veckors spann',
      icon: History,
      value: (
        <>
          {finalFiftyTwoWeekHighText && (
            <span dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(finalFiftyTwoWeekHighText) }} />
          )}
          {finalFiftyTwoWeekLowText && (
            <span dangerouslySetInnerHTML={{ __html: highlightNumbersSafely(finalFiftyTwoWeekLowText) }} />
          )}
        </>
      ),
      valueClassName: 'mt-3 flex flex-col gap-1 text-sm font-semibold leading-snug text-foreground',
    });
  }

  const findStatByKey = (key: string): FinancialStat | undefined =>
    pricingStats.find((stat) => stat.key === key)
    || companyStats.find((stat) => stat.key === key)
    || fundamentalsStats.find((stat) => stat.key === key);

  const summaryCandidateKeys: string[] = [
    'current-price',
    'target-price',
    'market-cap',
    'pe-ratio',
    'dividend-yield',
    'sector',
    'sheet-price',
    'stop-loss',
    'fifty-two-week-range',
  ];

  let summaryStats = summaryCandidateKeys
    .map((key) => findStatByKey(key))
    .filter((stat): stat is FinancialStat => Boolean(stat));

  if (summaryStats.length < 4) {
    const fallbackStats = [...pricingStats, ...companyStats, ...fundamentalsStats].filter(
      (stat) => !summaryStats.some((existing) => existing.key === stat.key),
    );

    summaryStats = [...summaryStats, ...fallbackStats].slice(0, 4);
  } else {
    summaryStats = summaryStats.slice(0, 4);
  }

  const summaryStatKeys = new Set(summaryStats.map((stat) => stat.key));

  const detailPricingStats = pricingStats.filter((stat) => !summaryStatKeys.has(stat.key));
  const detailCompanyStats = companyStats.filter((stat) => !summaryStatKeys.has(stat.key));
  const detailFundamentalsStats = fundamentalsStats.filter((stat) => !summaryStatKeys.has(stat.key));

  const hasSummaryStats = summaryStats.length > 0;
  const hasDetailedFinancialStats =
    detailPricingStats.length > 0
    || detailCompanyStats.length > 0
    || detailFundamentalsStats.length > 0;

  const shouldShowFinancialOverview = !isAiGeneratedCase && (hasSummaryStats || hasDetailedFinancialStats);

  const overviewLogoSrc =
    (!isHeroLogoError && (stockCase.image_url || currentVersion?.image_url || null)) || null;
  const overviewCompanyName = stockCase.company_name || displayTitle;
  const overviewTicker = stockCase.ticker ? stockCase.ticker.toUpperCase() : null;
  const showCreatorCard = Boolean(stockCase.profiles);
  const showLoginPromptCard = !user;
  const hasSidebarContent = showCreatorCard || showLoginPromptCard;

  const renderPrimaryActionContent = () => (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
      <p className="text-center text-sm font-medium text-muted-foreground sm:text-left">
        Välj hur du vill agera på detta case
      </p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        {user && (
          <SaveOpportunityButton
            itemType="stock_case"
            itemId={stockCase.id}
            itemTitle={displayTitle}
            onSaveSuccess={handleSaveSuccess}
            variant="default"
            size="lg"
            className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm hover:bg-primary/90"
          />
        )}

        <TooltipProvider delayDuration={150}>
          <div className="flex items-center gap-2 rounded-full bg-muted/30 px-2 py-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Dela"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dela</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDiscussWithAI}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Diskutera i AI-chatten"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Diskutera i AI-chatten</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLikeClick}
                  disabled={likesLoading}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={isLiked ? 'Ta bort gilla-markering' : 'Gilla case'}
                >
                  <Heart className={cn('h-4 w-4', isLiked ? 'fill-current text-red-500' : '')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isLiked ? 'Ta bort gilla-markering' : 'Gilla case'}</TooltipContent>
            </Tooltip>
            <span className="min-w-[2rem] text-center text-xs font-semibold text-muted-foreground">
              {likeCount}
            </span>

            {user && user.id !== stockCase.user_id && stockCase.user_id ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFollowClick}
                    className="rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={isFollowing(stockCase.user_id) ? 'Sluta följ författare' : 'Följ författare'}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFollowing(stockCase.user_id) ? 'Sluta följ' : 'Följ författare'}
                </TooltipContent>
              </Tooltip>
            ) : null}

            {isOwner ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowUpdateDialog(true)}
                    className="rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Lägg till uppdatering"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Lägg till uppdatering</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );

  const fallbackAiIntro = displayedAnalysisDescription
    ? displayedAnalysisDescription.split(/\n{2,}/)[0]?.trim() ?? null
    : null;
  const aiHeroIntroText = stockCase.ai_generated
    ? (stockCase.ai_intro?.trim() || stockCase.description?.trim() || fallbackAiIntro)
    : null;
  const aiHeroIntroHtml = aiHeroIntroText
    ? highlightNumbersSafely(aiHeroIntroText.replace(/\n+/g, ' '))
    : null;

  const aiBadge = stockCase.ai_generated === true ? (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1.5 rounded-full border-border/50 bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      <Brain className="h-3.5 w-3.5" />
      AI pitch
    </Badge>
  ) : null;

  const performanceBadge = performance !== null ? (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border-0 px-4 py-1.5 text-sm font-semibold shadow-sm backdrop-blur',
        isPositivePerformance
          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
      )}
    >
      {isPositivePerformance ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
    </Badge>
  ) : null;

  const authorName = stockCase.profiles?.display_name
    || stockCase.profiles?.username
    || (stockCase.ai_generated ? 'MarketMind-AI' : 'Okänd');

  const heroMetadataItems: React.ReactNode[] = [];

  if (authorName) {
    heroMetadataItems.push(
      <span
        key="author"
        className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        <User className="h-3.5 w-3.5 text-muted-foreground/80" />
        {authorName}
      </span>
    );
  }

  if (stockCase.created_at) {
    heroMetadataItems.push(
      <span
        key="published"
        className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
        {formatDistanceToNow(new Date(stockCase.created_at), {
          addSuffix: true,
          locale: sv,
        })}
      </span>
    );
  }

  if (overviewTicker) {
    heroMetadataItems.push(
      <span
        key="ticker"
        className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground/80" />
        {overviewTicker}
      </span>
    );
  }

  if (stockCase.case_categories) {
    const categoryColor = stockCase.case_categories.color || '#6366f1';
    const categoryTint = stockCase.case_categories.color ? `${stockCase.case_categories.color}1a` : 'rgba(99,102,241,0.12)';
    heroMetadataItems.push(
      <span
        key="category"
        className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-xs font-medium"
        style={{
          backgroundColor: categoryTint,
          color: categoryColor,
        }}
      >
        <Tag className="h-3.5 w-3.5" />
        {stockCase.case_categories.name}
      </span>
    );
  }

  const heroSubtitle = [stockCase.company_name, overviewTicker ? `(${overviewTicker})` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        {isAiGeneratedCase ? (
          <div className="relative overflow-hidden rounded-[36px] border border-border/30 bg-background/95 p-8 sm:p-12 shadow-[0_32px_80px_-60px_rgba(15,23,42,0.55)]">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/15 via-transparent to-muted/5 dark:from-muted/20 dark:via-transparent dark:to-muted/10" />

            <div className="relative z-10 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/discover')}
                    className="h-9 rounded-full border border-border/40 bg-background/70 px-4 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur hover:bg-background/90 hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tillbaka
                  </Button>
                  <CaseNavigationControls />
                </div>

                {performanceBadge ? (
                  <div className="flex items-center justify-end gap-2">
                    {performanceBadge}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    {aiBadge}
                  </div>

                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{displayTitle}</h1>

                  {heroSubtitle ? (
                    <p className="text-base text-muted-foreground sm:text-lg">
                      {heroSubtitle}
                    </p>
                  ) : null}

                  {heroMetadataItems.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                      {heroMetadataItems.map((item) => item)}
                    </div>
                  ) : null}

                  {aiHeroIntroHtml ? (
                    <div className="space-y-2">
                      <p
                        className="text-base leading-relaxed text-foreground sm:text-lg"
                        dangerouslySetInnerHTML={{ __html: aiHeroIntroHtml }}
                      />
                      {hasAnalysisContent ? (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-2 h-auto px-0 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
                            >
                              Visa full analys
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-[min(90vw,640px)] max-h-[70vh] overflow-y-auto border border-border/40 bg-background/95 p-0 shadow-lg"
                          >
                            <div className="space-y-4 px-4 py-4 text-left">
                              {formattedAnalysisContent}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {overviewLogoSrc ? (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border/30 bg-background/80 shadow-sm sm:mx-0 sm:ml-auto sm:flex-none">
                      <img
                        src={overviewLogoSrc}
                        alt={`${overviewCompanyName} logotyp`}
                        className="h-full w-full object-cover"
                        onError={() => setIsHeroLogoError(true)}
                      />
                    </div>
                  ) : null}

                  {summaryStats.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {summaryStats.map((stat) => (
                        <div
                          key={stat.key}
                          className="rounded-2xl border border-border/40 bg-background/80 p-4 shadow-sm"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                            {stat.label}
                          </p>
                          <div className="mt-2 text-lg font-semibold text-foreground">
                            {renderStatValue(stat)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[28px] border border-border/30 bg-muted/20 px-6 py-6 shadow-[0_24px_60px_-60px_rgba(15,23,42,0.45)]">
                {renderPrimaryActionContent()}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[36px] border border-border/30 bg-background/95 p-8 sm:p-12 shadow-[0_32px_80px_-60px_rgba(15,23,42,0.65)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/15 dark:via-transparent dark:to-transparent" />

            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/discover')}
                    className="h-9 rounded-full border border-border/40 bg-background/70 px-4 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur hover:bg-background/90 hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tillbaka
                  </Button>
                  <CaseNavigationControls />
                </div>

                {performanceBadge ? (
                  <div className="flex items-center justify-end gap-2">
                    {performanceBadge}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:text-left">
                <div className="space-y-3 sm:max-w-2xl">
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{displayTitle}</h1>
                    {aiBadge}
                  </div>

                  {heroSubtitle ? (
                    <p className="text-base text-muted-foreground sm:text-lg">
                      {heroSubtitle}
                    </p>
                  ) : null}

                  {heroMetadataItems.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      {heroMetadataItems.map((item) => item)}
                    </div>
                  ) : null}
                </div>

                {overviewLogoSrc ? (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border/30 bg-background/80 shadow-sm sm:mx-0 sm:ml-6 sm:flex-none sm:self-start">
                    <img
                      src={overviewLogoSrc}
                      alt={`${overviewCompanyName} logotyp`}
                      className="h-full w-full object-cover"
                      onError={() => setIsHeroLogoError(true)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Hero Content */}
        <div className="space-y-6">
          {/* Graph Section with Carousel */}
          {shouldShowHeroImage && (
            <div className="space-y-4">
              {/* Version info and controls */}
              <div className="flex items-center justify-between min-h-[1.5rem]">
                <div className="flex items-center gap-2 flex-1" aria-hidden="true" />

                {canDeleteCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUpdateToDelete(currentVersion.id)}
                    className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
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
                    alt={displayTitle}
                    className={imageElementClasses}
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
                      variant="ghost"
                      size="icon"
                      onClick={goToPrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-border/40 transition-transform hover:-translate-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-border/40 transition-transform hover:translate-x-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                {/* Version indicator */}
                {currentImageIndex > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="rounded-full bg-black/60 text-white backdrop-blur">
                      <History className="w-3 h-3 mr-1" />
                      Historisk
                    </Badge>
                  </div>
                )}

                {isAiGeneratedImage && (
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="secondary" className="rounded-full bg-black/60 text-white backdrop-blur">
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

              {hasMultipleVersions && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-4 text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setIsVersionDialogOpen(true)}
                  >
                    <History className="mr-2 h-3.5 w-3.5" />
                    Visa versionshistorik
                  </Button>
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

          {/* CTA Buttons */}
          {!isAiGeneratedCase && (
            <div className="rounded-[32px] border border-border/40 bg-background/90 px-6 py-6 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.55)]">
              {renderPrimaryActionContent()}
            </div>
          )}

          {/* Login prompt for non-users */}
          {!user && (
            <div className="rounded-[28px] border border-dashed border-primary/40 bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-6 text-center shadow-none">
              <div className="space-y-3">
                <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-primary dark:border-primary/20 dark:text-primary-foreground">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Bli medlem
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Logga in för att gilla, spara och kommentera
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  className="mx-auto rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Logga in
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div
          className={cn(
            'grid gap-8 items-start',
            hasSidebarContent
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'
              : ''
          )}
        >
          {/* Main Content */}
          <div
            className={cn(
              'space-y-6',
              hasSidebarContent ? '' : 'lg:max-w-4xl lg:mx-auto'
            )}
          >
            {/* Combined Overview Card - only show if there are financial metrics */}
            {shouldShowFinancialOverview && (
              <section className="rounded-[32px] border border-border/40 bg-background/95 p-6 sm:p-8 shadow-[0_24px_60px_-60px_rgba(15,23,42,0.6)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Finansiell översikt</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Snabb överblick av pris, bolagsinformation och nyckeltal.
                    </p>
                  </div>
                  {overviewLogoSrc ? (
                    <div className="flex items-center gap-3 rounded-full border border-border/30 bg-background/80 px-4 py-2 shadow-sm">
                      <img
                        src={overviewLogoSrc}
                        alt={`${overviewCompanyName} logotyp`}
                        loading="lazy"
                        className="h-10 w-10 rounded-full border border-border/20 bg-white object-cover"
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-foreground">{overviewCompanyName}</span>
                        {overviewTicker ? (
                          <span className="text-xs text-muted-foreground">{overviewTicker}</span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                {hasSummaryStats ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryStats.map((stat) => {
                      const IconComponent = stat.icon;
                      const summaryValueClassName = stat.valueClassName
                        ? cn('text-lg font-semibold tracking-tight text-foreground', stat.valueClassName)
                        : 'text-lg font-semibold tracking-tight text-foreground';

                      return (
                        <div
                          key={stat.key}
                          className="flex flex-col gap-2 rounded-2xl border border-border/30 bg-background/80 px-4 py-4 shadow-sm"
                        >
                          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                            {IconComponent ? <IconComponent className="h-3.5 w-3.5" /> : null}
                            {stat.label}
                          </span>
                          <div className={summaryValueClassName}>{renderStatValue(stat)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {hasDetailedFinancialStats ? (
                  <div className="mt-6 border-t border-border/20 pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="group inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-background"
                      onClick={() => setShowFullFinancialDetails((prev) => !prev)}
                    >
                      {showFullFinancialDetails ? 'Dölj detaljer' : 'Visa detaljer'}
                      {showFullFinancialDetails ? (
                        <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                      ) : (
                        <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                      )}
                    </Button>

                    {showFullFinancialDetails ? (
                      <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {detailPricingStats.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Pris och kursinformation</p>
                            {renderStatsList(detailPricingStats)}
                          </div>
                        ) : null}

                        {detailCompanyStats.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Bolagsinformation</p>
                            {renderStatsList(detailCompanyStats)}
                          </div>
                        ) : null}

                        {detailFundamentalsStats.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Nyckeltal</p>
                            {renderStatsList(detailFundamentalsStats)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            )}

            {/* Case Description with Structured Sections */}
            {hasAnalysisContent && !isAiGeneratedCase ? (
              <div ref={analysisSectionRef}>
                <Card>
                  <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">Analys</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {formattedAnalysisContent}
                  </CardContent>
                </Card>
              </div>
            ) : null}

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
          {hasSidebarContent ? (
            <div className="space-y-6 lg:mx-auto lg:max-w-xl xl:sticky xl:top-24 xl:mx-0 xl:max-w-none">
              {/* Creator Card - Enhanced */}
              {showCreatorCard && stockCase.profiles && (
                <div className="rounded-[28px] border border-border/40 bg-background/95 p-6 shadow-[0_24px_60px_-60px_rgba(15,23,42,0.55)]">
                  <p className="text-sm font-medium text-muted-foreground">Skapad av</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${stockCase.user_id}`)}
                    className="mt-4 flex w-full items-center gap-4 rounded-2xl bg-muted/20 px-4 py-3 text-left transition hover:bg-muted/30"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-xl font-semibold shadow-sm">
                      {stockCase.profiles.display_name?.charAt(0) || stockCase.profiles.username.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-foreground">
                        {stockCase.profiles.display_name || stockCase.profiles.username}
                      </p>
                      <p className="text-sm text-muted-foreground">@{stockCase.profiles.username}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Publicerade case: 12</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {user && user.id !== stockCase.user_id ? (
                    <Button
                      variant="ghost"
                      className="mt-4 w-full rounded-full text-sm font-semibold"
                      onClick={handleFollowClick}
                    >
                      {isFollowing(stockCase.user_id) ? 'Sluta följ' : 'Följ användare'}
                    </Button>
                  ) : null}
                </div>
              )}

              {/* Login Prompt for non-users */}
              {showLoginPromptCard && (
                <div className="rounded-[28px] border border-border/30 bg-gradient-to-br from-muted/40 via-background to-background px-5 py-5 text-center shadow-none">
                  <p className="text-sm text-muted-foreground">Logga in för att interagera</p>
                  <Button size="sm" onClick={() => navigate('/auth')} className="mt-3 rounded-full px-4 text-sm font-semibold">
                    Logga in
                  </Button>
                </div>
              )}
            </div>
          ) : null}
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

      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Versionshistorik</DialogTitle>
            <DialogDescription>
              Utforska tidigare iterationer av detta case och växla mellan dem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {timeline.map((version, index) => {
              const isActive = currentImageIndex === index;
              const isOriginal = version.isOriginal;

              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => {
                    goToVersion(index);
                    setIsVersionDialogOpen(false);
                  }}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-left transition-colors',
                    isActive
                      ? 'border-primary/40 bg-primary/10 text-foreground'
                      : 'border-border/40 bg-background hover:border-primary/30 hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{version.title || displayTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true, locale: sv })}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full text-xs">
                      {isOriginal ? 'Original' : 'Uppdatering'}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

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