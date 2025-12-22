import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Filter,
  LineChart,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';

import Layout from '@/components/Layout';
import ReportHighlightCard from '@/components/ReportHighlightCard';
import NewsModal from '@/components/ui/NewsModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDiscoverReportSummaries } from '@/hooks/useDiscoverReportSummaries';
import { useNewsData } from '@/hooks/useNewsData';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import ReportDetailDialogContent from '@/components/ReportDetailDialogContent';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { extractEpsBeatStatus, extractRevenueBeatStatus, extractGuidanceStatus } from '@/utils/reportDataExtractor';

const formatCategoryLabel = (category?: string) => {
  if (!category) return 'Marknad';
  const normalized = category.toLowerCase().trim();
  switch (normalized) {
    case 'macro':
      return 'Makro';
    case 'tech':
    case 'technology':
      return 'Teknik';
    case 'earnings':
    case 'earnings report':
      return 'Rapporter';
    case 'commodities':
    case 'commodity':
      return 'Råvaror';
    case 'sweden':
    case 'swedish':
      return 'Sverige';
    case 'global':
    case 'globalt':
      return 'Globalt';
    default:
      // Capitalize first letter of each word
      return normalized
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
};

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
}

const DiscoverNews = () => {
const [searchParams] = useSearchParams(); // Hämta searchParams
  const { reports } = useDiscoverReportSummaries(24);
  const { newsData, morningBrief, loading: newsLoading, error: newsError } = useNewsData();

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
const [activeTab, setActiveTab] = useState<'news' | 'reports'>(
    searchParams.get('tab') === 'reports' ? 'reports' : 'news'
  );
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'reports' || tab === 'news') {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [reportSort, setReportSort] = useState<'latest' | 'name'>('latest');
  const [reportSearch, setReportSearch] = useState('');
  const [isBriefExpanded, setIsBriefExpanded] = useState(false);
  const [isHeroExpanded, setIsHeroExpanded] = useState(false);

  const filteredReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];

    let nextReports = [...reports];

    if (reportSearch.trim()) {
      const query = reportSearch.toLowerCase().trim();
      nextReports = nextReports.filter((report) => {
        const companyMatch = report.companyName?.toLowerCase().includes(query);
        const titleMatch = report.reportTitle?.toLowerCase().includes(query);
        const summaryMatch = report.summary?.toLowerCase().includes(query);
        const sourceMatch = report.sourceDocumentName?.toLowerCase().includes(query);

        return companyMatch || titleMatch || summaryMatch || sourceMatch;
      });
    }

    nextReports.sort((a, b) => {
      if (reportSort === 'name') {
        return (a.companyName || '').localeCompare(b.companyName || '', 'sv', { sensitivity: 'base' });
      }

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
      return dateB - dateA;
    });

    return nextReports;
  }, [reports, reportSort, reportSearch]);

  const reportHighlights = useMemo(() => filteredReports.slice(0, 3), [filteredReports]);
  const latestReport = reportHighlights[0];
  const totalReports = filteredReports.length;

  const [reportPage, setReportPage] = useState(1);
  const REPORTS_PER_PAGE = 12;

  const totalReportPages = Math.max(1, Math.ceil(totalReports / REPORTS_PER_PAGE));

  useEffect(() => {
    if (reportPage > totalReportPages) {
      setReportPage(totalReportPages);
    }
  }, [reportPage, totalReportPages]);

  useEffect(() => {
    setReportPage(1);
  }, [reportSort, reportSearch]);

  const paginatedReports = useMemo(() => {
    const start = (reportPage - 1) * REPORTS_PER_PAGE;
    return filteredReports.slice(start, start + REPORTS_PER_PAGE);
  }, [reportPage, filteredReports]);

  const filteredNews = useMemo(() => {
    if (!newsData || newsData.length === 0) {
      return [];
    }
    
    return newsData;
  }, [newsData]);
  
  const heroNews = useMemo(() => {
    if (!newsData || newsData.length === 0) {
      return null;
    }
    return newsData[0];
  }, [newsData]);


  const formatPublishedLabel = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const todayDate = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isWeekend = () => {
    const today = new Date();
    const day = today.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const isWeeklySummary = isWeekend() || morningBrief?.headline?.toLowerCase().includes('veckosammanfattning');

  return (
    <Layout>
      <div className="w-full pb-20 bg-background/50 min-h-screen">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab((value as 'news' | 'reports') || 'news')}
            className="space-y-8"
          >

            {/* Header Area */}
            <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold tracking-tight text-foreground mb-1">
                  {activeTab === 'news'
                    ? isWeeklySummary
                      ? 'Veckosammanfattning'
                      : 'Dagens Nyheter'
                    : 'Rapporter'}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">{todayDate}</p>
              </div>

              <TabsList className="bg-muted/60 p-1 rounded-full border border-border/50 self-start md:self-end">
                <TabsTrigger
                  value="news"
                  className="rounded-full px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Nyheter
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="rounded-full px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Rapporter
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="news" className="space-y-8 animate-fade-in mt-0">
              
              {/* Loading State */}
              {newsLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Laddar nyheter...</p>
                </div>
              )}

              {/* Error State */}
              {newsError && (
                <div className="text-center py-12">
                  <p className="text-destructive">Fel vid laddning av nyheter: {newsError}</p>
                </div>
              )}

              {/* Header Section */}
              {!newsLoading && !newsError && (
              <>

              {/* Morning Brief Hero Section */}
              {morningBrief && (() => {
                const overviewLines = morningBrief.overview.split('\n\n');
                // Show more text by default - truncate only if very long (over 500 chars)
                const shouldTruncate = !isWeeklySummary && morningBrief.overview.length > 500;
                const displayOverview = shouldTruncate && !isBriefExpanded
                  ? morningBrief.overview.substring(0, 500) + '...'
                  : morningBrief.overview;
                const condensedOverview = shouldTruncate && !isBriefExpanded
                  ? displayOverview.split('\n\n')
                  : overviewLines;
                
                const getSentimentIcon = () => {
                  const sentiment = morningBrief.sentiment?.toLowerCase();
                  if (sentiment === 'bullish') return <TrendingUp className="w-4 h-4" />;
                  if (sentiment === 'bearish') return <TrendingDown className="w-4 h-4" />;
                  return <Minus className="w-4 h-4" />;
                };
                
                const getSentimentColor = () => {
                  const sentiment = morningBrief.sentiment?.toLowerCase();
                  if (sentiment === 'bullish') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30';
                  if (sentiment === 'bearish') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30';
                  return 'text-muted-foreground bg-muted';
                };

                const publishedLabel = heroNews ? formatPublishedLabel(heroNews.publishedAt) : todayDate;

                return (
                  <Card className="rounded-[2rem] border-border/50 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                    <div className="relative bg-gradient-to-br from-primary/5 via-background to-background p-5 md:p-6 xl:p-8">
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                            {isWeeklySummary ? 'Veckosammanfattning' : 'Morgonrapport'}
                          </Badge>
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                            {todayDate.split(' ')[0]}
                          </Badge>
                          {morningBrief.sentiment && (
                            <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5 ${getSentimentColor()}`}>
                              {getSentimentIcon()}
                              <span className="capitalize">{morningBrief.sentiment}</span>
                            </Badge>
                          )}
                        </div>
                        <div className="hidden md:inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>Uppdaterad {publishedLabel}</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4 max-w-5xl">
                          <h2 className="text-3xl md:text-4xl xl:text-[2.6rem] font-bold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
                            {morningBrief.headline}
                          </h2>

                          <div className={`${isWeeklySummary ? 'prose prose-slate dark:prose-invert max-w-none' : ''}`}>
                            {isWeeklySummary ? (
                              <div className="text-sm md:text-base text-muted-foreground leading-relaxed space-y-3 max-w-5xl">
                                {morningBrief.overview.split('\n\n').map((paragraph, idx) => (
                                  paragraph.trim() && (
                                    <p key={idx} className="mb-3">
                                      {paragraph.trim()}
                                    </p>
                                  )
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {condensedOverview.map((paragraph, idx) => (
                                  <p
                                    key={idx}
                                    className={`text-sm md:text-base text-muted-foreground leading-relaxed max-w-4xl ${shouldTruncate && !isBriefExpanded ? 'line-clamp-2 lg:line-clamp-3' : ''}`}
                                  >
                                    {paragraph.trim()}
                                  </p>
                                ))}
                                {shouldTruncate && (
                                  <button
                                    onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                                    className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                                  >
                                    {isBriefExpanded ? (
                                      <>
                                        Visa mindre
                                        <ChevronUp className="w-4 h-4" />
                                      </>
                                    ) : (
                                      <>
                                        Läs mer
                                        <ChevronDown className="w-4 h-4" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              className="rounded-full"
                              size="sm"
                              onClick={() => heroNews && setSelectedNews(heroNews)}
                              disabled={!heroNews}
                            >
                              Läs mer
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                            {publishedLabel && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {publishedLabel}
                              </div>
                            )}
                          </div>
                        </div>
                      
                        {morningBrief.keyHighlights && morningBrief.keyHighlights.length > 0 && (
                          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 md:p-5 flex flex-col gap-3 shadow-inner">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                <Sparkles className="h-4 w-4" />
                                {isWeeklySummary ? 'Veckans Höjdpunkter' : 'Snabbkollen'}
                              </div>
                              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] bg-background/80 border-border/60">
                                {morningBrief.keyHighlights.length} punkter
                              </Badge>
                            </div>
                            <div className="space-y-2.5">
                              {morningBrief.keyHighlights.slice(0, isWeeklySummary ? 7 : 5).map((highlight, idx) => (
                                <div
                                  key={idx}
                                  className="flex gap-3 items-start rounded-xl bg-background/80 border border-border/60 px-3 py-2.5"
                                >
                                  <div className="mt-0.5 text-primary">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <p className="text-sm text-foreground/90 leading-relaxed">
                                    {highlight}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })()}

              {/* Hero News Section - Only show on weekdays */}
              {!isWeeklySummary && heroNews && (() => {
                const shouldTruncate = heroNews.summary.length > 150;
                const displaySummary = shouldTruncate && !isHeroExpanded
                  ? heroNews.summary.substring(0, 150) + '...'
                  : heroNews.summary;

                return (
                  <Card className="rounded-[2rem] border-border/50 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                    <div className="relative overflow-hidden">
                      <div className="absolute right-12 top-6 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
                      <div className="absolute left-2 bottom-0 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />

                      <div className="relative p-5 md:p-6 xl:p-8 bg-gradient-to-r from-primary/5 via-primary/5 to-background">
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                              Huvudnyhet
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-medium">
                              {formatCategoryLabel(heroNews.category)}
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px] text-muted-foreground">
                              {formatPublishedLabel(heroNews.publishedAt)}
                            </Badge>
                          </div>
                          <a
                            href={heroNews.url && heroNews.url !== '#' ? heroNews.url : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {heroNews.source}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                          <div className="flex-shrink-0">
                            <div className="h-14 w-14 rounded-2xl bg-background/60 border border-border/60 grid place-items-center">
                              <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                            <h2 className="text-xl md:text-2xl xl:text-[1.6rem] font-bold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
                              {heroNews.headline}
                            </h2>
                            <p
                              className={`text-sm md:text-base text-muted-foreground leading-relaxed max-w-4xl ${shouldTruncate && !isHeroExpanded ? 'line-clamp-3' : ''}`}
                            >
                              {displaySummary}
                            </p>
                            {shouldTruncate && (
                              <button
                                onClick={() => setIsHeroExpanded(!isHeroExpanded)}
                                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                              >
                                {isHeroExpanded ? (
                                  <>
                                    Visa mindre
                                    <ChevronUp className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    Läs mer
                                    <ChevronDown className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <Button
                                className="rounded-full"
                                size="sm"
                                onClick={() => setSelectedNews(heroNews)}
                              >
                                Läs mer
                                <ArrowRight className="ml-2 w-4 h-4" />
                              </Button>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {formatPublishedLabel(heroNews.publishedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })()}

              {/* News Grid - Only show on weekdays */}
              {!isWeeklySummary && (() => {
                if (filteredNews.length > 0) {
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg xl:text-xl font-bold tracking-tight">
                          Alla Nyheter
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {filteredNews.length} {filteredNews.length === 1 ? 'artikel' : 'artiklar'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 xl:gap-4">
                        {filteredNews.map((item) => (
                          <Card
                            key={item.id}
                            className="rounded-[1.5rem] border-border/50 bg-card/80 hover:bg-muted/30 hover:border-primary/40 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
                            onClick={() => setSelectedNews(item)}
                          >
                            <CardContent className="p-4 xl:p-5 flex flex-col h-full gap-3">
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] bg-muted text-foreground/90 border border-border/60">
                                  {formatCategoryLabel(item.category)}
                                </Badge>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatPublishedLabel(item.publishedAt)}
                                </div>
                              </div>

                              <h4 className="font-bold text-sm xl:text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
                                {item.headline}
                              </h4>

                              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                {item.summary}
                              </p>

                              <div className="flex items-center justify-between pt-2 mt-auto border-t border-border/50">
                                <a
                                  href={item.url && item.url !== '#' ? item.url : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="truncate max-w-[120px] font-semibold">{item.source}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ArrowUpRight className="w-4 h-4 text-primary" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                // Show more helpful message
                if (newsData && newsData.length === 0) {
                      return (
                        <div className="text-center py-12 space-y-4">
                          <p className="text-muted-foreground">Inga nyheter tillgängliga just nu.</p>
                          <p className="text-sm text-muted-foreground">
                        Backend returnerade {newsData.length} nyheter. Försök igen senare för att hämta nya nyheter.
                          </p>
                        </div>
                      );
                }
                
                return (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Inga nyheter tillgängliga.</p>
                  </div>
                );
              })()}

              {/* Footer Note */}
              <div className="pt-6 border-t border-border/50 text-center">
                <p className="text-xs text-muted-foreground">
                  Alla nyheter från externa källor. Sammanfattningar genererade av AI.
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground/70">{todayDate}</p>
              </div>
              </>
              )}

            </TabsContent>

            <TabsContent value="reports" className="space-y-8 animate-fade-in mt-0">
              <div className="relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg">
                <div className="absolute right-12 top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute left-6 bottom-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

                <div className="relative grid items-center gap-8 p-6 sm:p-8 xl:p-10 lg:grid-cols-[1.05fr,0.95fr]">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">AI-rapporter</Badge>
                      <Badge variant="outline" className="rounded-full border-dashed">Daglig översikt</Badge>
                      <Badge variant="outline" className="rounded-full border-border/70 text-muted-foreground">
                        {totalReports ? `${totalReports} rapporter` : 'Samlar rapporter...'}
                      </Badge>
                    </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Rapportsektionen</p>
                    <div className="space-y-1">
                      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                        Rapporter
                      </h2>
                        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">{todayDate}</p>
                    </div>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                      Marknadens rapporter, analyserade och sammanfattade av AI på sekunder. Allt presenterat med samma visuella språk som nyheterna.
                    </p>
                  </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Aktuella rapporter</p>
                        <p className="text-2xl font-bold text-foreground">{totalReports || '—'}</p>
                        <p className="text-xs text-muted-foreground">Uppdateras automatiskt</p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Senaste insikt</p>
                        <p className="text-lg font-semibold text-foreground leading-tight line-clamp-1">
                          {latestReport?.companyName || 'Ingen data ännu'}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {latestReport?.reportTitle || 'Fånga marknadsrörelser i realtid.'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">AI-sammanfattningar</p>
                        <div className="mt-1 flex items-center gap-2 text-emerald-500">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-sm font-semibold">Sekunder</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Automatiska highlights för teamet.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-lg sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <LineChart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rapportöversikt</p>
                          <p className="text-sm text-foreground">Senaste AI-sammanfattningar</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full">Live</Badge>
                    </div>

                    <div className="space-y-3">
                      {reportHighlights.length > 0 ? (
                        reportHighlights.map((report) => {
                          const epsBeat = extractEpsBeatStatus(report);
                          const revenueBeat = extractRevenueBeatStatus(report);
                          const guidanceStatus = extractGuidanceStatus(report);

                          const getBeatStatusText = (status: typeof epsBeat.status, percent?: number) => {
                            if (!status) return null;
                            const percentText = percent !== undefined ? ` (${percent > 0 ? '+' : ''}${percent}%)` : '';
                            return status === 'beat' ? `BEAT${percentText}` : status === 'miss' ? `MISS${percentText}` : 'IN LINE';
                          };

                          const getBeatStatusClass = (status: typeof epsBeat.status) => {
                            if (status === 'beat') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                            if (status === 'miss') return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
                            return 'text-muted-foreground bg-muted border-border/60';
                          };

                          const getGuidanceText = (status: typeof guidanceStatus) => {
                            if (!status) return null;
                            return status === 'raised' ? 'RAISED' : status === 'lowered' ? 'LOWERED' : 'MAINTAINED';
                          };

                          const getGuidanceClass = (status: typeof guidanceStatus) => {
                            if (status === 'raised') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                            if (status === 'lowered') return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
                            return 'text-muted-foreground bg-muted border-border/60';
                          };

                          return (
                            <Dialog key={report.id}>
                              <DialogTrigger asChild>
                                <button
                                  type="button"
                                  className="group flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                >
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{report.companyName}</p>
                                      {epsBeat.status && (
                                        <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getBeatStatusClass(epsBeat.status)}`}>
                                          EPS: {getBeatStatusText(epsBeat.status, epsBeat.percent)}
                                        </Badge>
                                      )}
                                      {revenueBeat.status && (
                                        <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getBeatStatusClass(revenueBeat.status)}`}>
                                          Revenue: {getBeatStatusText(revenueBeat.status, revenueBeat.percent)}
                                        </Badge>
                                      )}
                                      {guidanceStatus && (
                                        <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getGuidanceClass(guidanceStatus)}`}>
                                          Guidance: {getGuidanceText(guidanceStatus)}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{report.reportTitle}</p>
                                  </div>
                                  <ArrowUpRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:text-primary shrink-0" />
                                </button>
                              </DialogTrigger>
                              <ReportDetailDialogContent report={report} />
                            </Dialog>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                          Samlar in rapporter...
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">AI-summerade rapporter med samma visuella språk som nyhetsflödet.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Senaste rapporterna</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">Djupdyk i AI-sammanfattningarna</h3>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Filter className="w-4 h-4" />
                      <span>Sortera rapporter</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={reportSort === 'latest' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setReportSort('latest')}
                      >
                        Senaste
                      </Button>
                      <Button
                        variant={reportSort === 'name' ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setReportSort('name')}
                      >
                        Namn
                      </Button>
                    </div>
                  </div>

                  <div className="w-full lg:w-80">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={reportSearch}
                        onChange={(event) => setReportSearch(event.target.value)}
                        placeholder="Sök efter bolag eller titel"
                        className="w-full rounded-full pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {paginatedReports.map((report) => (
                    <ReportHighlightCard key={report.id} report={report} />
                  ))}
                </div>

                {totalReportPages > 1 && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Visar {paginatedReports.length} av {totalReports} rapporter
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={reportPage === 1}
                        onClick={() => setReportPage((page) => Math.max(1, page - 1))}
                      >
                        Föregående
                      </Button>
                      <div className="text-sm font-medium text-muted-foreground">
                        Sida {reportPage} av {totalReportPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={reportPage === totalReportPages}
                        onClick={() => setReportPage((page) => Math.min(totalReportPages, page + 1))}
                      >
                        Nästa
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-dashed border-border/60 bg-card/60 p-6 text-center shadow-inner">
                <p className="text-sm text-muted-foreground">
                  Marknadens rapporter, analyserade och sammanfattade av AI på sekunder.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">{todayDate}</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <NewsModal 
          news={selectedNews} 
          isOpen={!!selectedNews} 
          onClose={() => setSelectedNews(null)} 
        />
      </div>
    </Layout>
  );
};

export default DiscoverNews;
