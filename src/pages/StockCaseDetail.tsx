import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, Heart, Share2, TrendingUp, TrendingDown, Building, BarChart3, Eye, Users, AlertTriangle, Target, StopCircle, Brain, ShoppingCart, Plus, UserPlus, PlusCircle, History, ChevronLeft, ChevronRight, Trash2, MessageSquare, LineChart, Coins, Percent } from 'lucide-react';
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
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import type { StockCase } from '@/types/stockCase';
import { fetchSheetTickerMetrics, type SheetTickerMetrics } from '@/utils/sheetMetrics';

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

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);
  const [sheetMetrics, setSheetMetrics] = useState<SheetTickerMetrics | null>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { stockCase, loading, error } = useStockCase(id || '');
  const { likeCount, isLiked, toggleLike, loading: likesLoading } = useStockCaseLikes(id || '');
  const { followUser, unfollowUser, isFollowing } = useUserFollows();
  const { updates, isLoading: updatesLoading, deleteUpdate } = useStockCaseUpdates(id || '');

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

  const logoImageClasses = cn(
    'block h-24 w-24 rounded-full border border-border/60 shadow-sm transition-transform duration-300',
    hasRealImage ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-default',
    isAiGeneratedImage ? 'object-contain bg-muted/60 p-2' : 'object-cover'
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
      <dl className="space-y-2.5">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          const valueClassName = stat.valueClassName
            ? cn('font-semibold text-foreground', stat.valueClassName)
            : 'text-base font-semibold text-foreground';

          return (
            <div key={stat.key} className="flex flex-col gap-1.5">
              <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {IconComponent ? <IconComponent className="h-3.5 w-3.5" /> : null}
                <span>{stat.label}</span>
              </dt>
              <dd className={cn('leading-tight', valueClassName)}>{renderStatValue(stat)}</dd>
              {stat.description ? (
                <dd className="text-xs leading-snug text-muted-foreground">{stat.description}</dd>
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
      label: 'Senaste pris (Google Sheet)',
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

  const hasPricingMetrics = pricingStats.length > 0;
  const hasCompanyDetails = companyStats.length > 0;
  const hasSheetFundamentals = fundamentalsStats.length > 0;

  const shouldShowFinancialOverview = hasPricingMetrics || hasCompanyDetails || hasSheetFundamentals;

  const overviewLogoSrc = stockCase.image_url || currentVersion?.image_url || null;
  const overviewCompanyName = stockCase.company_name || displayTitle;
  const overviewTicker = stockCase.ticker ? stockCase.ticker.toUpperCase() : null;
  const showCreatorCard = Boolean(stockCase.profiles);
  const showLoginPromptCard = !user;
  const hasSidebarContent = showCreatorCard || showLoginPromptCard;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
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
                  {stockCase.profiles?.display_name
                    || stockCase.profiles?.username
                    || (stockCase.ai_generated ? 'MarketMind-AI' : 'Okänd')}
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

          {/* Company logo & version controls */}
          {displayImageSrc && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center justify-center gap-3">
                {hasMultipleVersions && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPrevious}
                    className="h-9 w-9 rounded-full border border-border/60"
                    aria-label="Visa föregående version"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}

                <div className="relative flex flex-col items-center">
                  <img
                    src={displayImageSrc}
                    alt={displayTitle}
                    className={logoImageClasses}
                    onClick={() => {
                      if (currentVersion.image_url) {
                        window.open(currentVersion.image_url, '_blank');
                      }
                    }}
                  />

                  {currentImageIndex > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -left-2 text-[10px]">
                      <History className="mr-1 h-3 w-3" />
                      Historik
                    </Badge>
                  )}

                  {isAiGeneratedImage && (
                    <Badge variant="secondary" className="absolute -bottom-2 -left-2 text-[10px]">
                      <Brain className="mr-1 h-3 w-3" />
                      AI
                    </Badge>
                  )}
                </div>

                {hasMultipleVersions && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNext}
                    className="h-9 w-9 rounded-full border border-border/60"
                    aria-label="Visa nästa version"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[11px]">
                  Uppdaterad {formatDistanceToNow(new Date(currentVersion.created_at), {
                    addSuffix: true,
                    locale: sv
                  })}
                </Badge>

                {hasMultipleVersions && (
                  <Badge variant="outline" className="text-[11px]">
                    Version {currentImageIndex + 1} av {timeline.length}
                  </Badge>
                )}
              </div>

              {hasMultipleVersions && (
                <div className="flex justify-center gap-2">
                  {timeline.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToVersion(index)}
                      className={`h-2 w-2 rounded-full transition-all duration-200 ${
                        currentImageIndex === index
                          ? 'bg-primary scale-125'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Visa version ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {hasMultipleVersions && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {timeline.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => goToVersion(index)}
                      className={`flex-shrink-0 rounded-md px-3 py-2 text-xs transition-colors ${
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

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                {hasRealImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      if (currentVersion.image_url) {
                        window.open(currentVersion.image_url, '_blank');
                      }
                    }}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Öppna bild
                  </Button>
                )}

                <span>
                  Teknisk analys: {stockCase.company_name} – Timeframe: {stockCase.timeframe || 'Ej specificerad'}
                  {stockCase.sector && ` • Sektor: ${stockCase.sector}`}
                </span>
              </div>

              {canDeleteCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUpdateToDelete(currentVersion.id)}
                  className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Ta bort version
                </Button>
              )}
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
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Finansiell Översikt</CardTitle>
                  {overviewLogoSrc ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-3 py-2">
                      <img
                        src={overviewLogoSrc}
                        alt={`${overviewCompanyName} logotyp`}
                        loading="lazy"
                        className="h-12 w-12 rounded-full border border-border/50 bg-white object-cover"
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Bolag
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {overviewCompanyName}
                        </span>
                        {overviewTicker ? (
                          <span className="text-xs text-muted-foreground">{overviewTicker}</span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {hasPricingMetrics && (
                      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Pris &amp; kursinformation
                        </p>
                        {renderStatsList(pricingStats)}
                      </div>
                    )}

                    {hasCompanyDetails && (
                      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Bolagsinformation
                        </p>
                        {renderStatsList(companyStats)}
                      </div>
                    )}

                    {hasSheetFundamentals && (
                      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Nyckeltal från Google Sheets
                        </p>
                        {renderStatsList(fundamentalsStats)}
                      </div>
                    )}
                  </div>
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
          {hasSidebarContent ? (
            <div className="space-y-6 lg:max-w-xl lg:mx-auto xl:max-w-none xl:mx-0 xl:sticky xl:top-24">
              {/* Creator Card - Enhanced */}
              {showCreatorCard && stockCase.profiles && (
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

              {/* Login Prompt for non-users */}
              {showLoginPromptCard && (
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