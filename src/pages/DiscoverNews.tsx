import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import Layout from '@/components/Layout';
import GeneratedReportsSection from '@/components/GeneratedReportsSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDiscoverReportSummaries } from '@/hooks/useDiscoverReportSummaries';
import { useMarketData } from '@/hooks/useMarketData';
import { useNewsData } from '@/hooks/useNewsData';
import { useMarketOverviewInsights, type MarketOverviewInsight } from '@/hooks/useMarketOverviewInsights';
import ReportHighlightCard from '@/components/ReportHighlightCard';
import FlashBriefs from '@/components/FlashBriefs';
import MarketMomentum from '@/components/MarketMomentum';
import FinancialCalendar from '@/components/FinancialCalendar';
import MarketPulse from '@/components/MarketPulse';

type Sentiment = 'bullish' | 'bearish' | 'neutral';

const SENTIMENT_META: Record<Sentiment, { label: string; badgeClass: string }> = {
  bullish: { label: 'Positivt sentiment', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  bearish: { label: 'Försiktigt sentiment', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  neutral: { label: 'Neutral ton', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const deriveSentimentFromInsight = (insight?: MarketOverviewInsight): Sentiment => {
  if (!insight) return 'neutral';
  if (insight.sentiment) return insight.sentiment;
  const text = `${insight.title ?? ''} ${insight.content ?? ''}`.toLowerCase();
  if (/(stiger|uppgång|rekord|positiv|expansion|tillväxt)/.test(text)) return 'bullish';
  if (/(faller|nedgång|oro|risk|press|svag)/.test(text)) return 'bearish';
  return 'neutral';
};

type IndexTile = {
  symbol: string;
  displayLabel: string;
  price?: number;
  changePercent?: number;
};

const INDEX_LABELS: Record<string, string> = {
  SPY: 'OMXS30',
  QQQ: 'DAX',
  DIA: 'S&P 500',
  NDX: 'Nasdaq 100',
};

const PRIORITY_INDEX_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'NDX'];
const MAX_INDEX_TILES = 4;

const DiscoverNews = () => {
  const navigate = useNavigate();
  const { reports, loading } = useDiscoverReportSummaries(24);
  const {
    marketData,
    loading: marketLoading,
    error: marketError,
    refetch: refetchMarketData,
  } = useMarketData();
  const { newsData, loading: newsLoading, error: newsError, refetch: refetchNews } = useNewsData();
  const { data: overviewInsights = [], isLoading: insightsLoading } = useMarketOverviewInsights();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPulse, setShowPulse] = useState(false);

  const companyCount = useMemo(
    () => new Set(reports.map((report) => report.companyName?.trim())).size,
    [reports]
  );

  const sourceCount = useMemo(
    () => new Set(reports.map((report) => report.sourceType ?? report.sourceDocumentName ?? 'Okänd källa')).size,
    [reports]
  );

  const highlightedTopics = useMemo(() => {
    const metrics = reports.flatMap((report) => report.keyMetrics ?? []);
    const topics = metrics
      .map((metric) => metric.label)
      .filter((label, index, arr) => label && arr.indexOf(label) === index)
      .slice(0, 6);

    return topics;
  }, [reports]);

  const latestReport = reports[0];
  const highlightReports = useMemo(() => reports.slice(0, 3), [reports]);
  const heroInsight = overviewInsights[0];
  const heroSentiment = deriveSentimentFromInsight(heroInsight);
  const heroIndices = marketData?.marketIndices ?? [];
  const lastUpdated = marketData?.lastUpdated ? new Date(marketData.lastUpdated) : null;

  const normalizedIndices = useMemo<IndexTile[]>(() => {
    return heroIndices.map((index) => ({
      symbol: index.symbol,
      price: index.price,
      changePercent: index.changePercent,
      displayLabel: INDEX_LABELS[index.symbol] ?? index.name ?? index.symbol,
    }));
  }, [heroIndices]);

  const prioritizedIndices = useMemo<IndexTile[]>(() => {
    if (!normalizedIndices.length) return [];

    const prioritized: IndexTile[] = [];

    PRIORITY_INDEX_SYMBOLS.forEach((symbol) => {
      const match = normalizedIndices.find((idx) => idx.symbol === symbol);
      if (match) {
        prioritized.push(match);
      }
    });

    normalizedIndices.forEach((idx) => {
      if (!prioritized.find((item) => item.symbol === idx.symbol)) {
        prioritized.push(idx);
      }
    });

    return prioritized.slice(0, MAX_INDEX_TILES);
  }, [normalizedIndices]);

  const indexTiles = useMemo<(IndexTile | null)[]>(() => {
    const tiles = prioritizedIndices.length > 0 ? prioritizedIndices : normalizedIndices;
    const padded = [...tiles];

    while (padded.length < MAX_INDEX_TILES) {
      padded.push(null);
    }

    return padded.slice(0, MAX_INDEX_TILES);
  }, [normalizedIndices, prioritizedIndices]);

  const trendingCategories = useMemo(() => {
    if (!newsData?.length) return [] as { category: string; count: number }[];

    const counts = newsData.reduce<Record<string, number>>((acc, item) => {
      const category = item.category?.trim() || 'Övrigt';
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => ({ category, count }));
  }, [newsData]);

  const filteredNewsItems = useMemo(() => {
    if (!selectedCategory) return newsData;
    return newsData.filter((item) => (item.category?.trim() || 'Övrigt') === selectedCategory);
  }, [newsData, selectedCategory]);

  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  }, []);

  const handleScrollToReports = useCallback(() => {
    const target = document.getElementById('rapporter');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handlePulseToggle = useCallback(() => {
    setShowPulse((prev) => !prev);
  }, []);

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-1 sm:px-4 lg:px-0">
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background/95 to-background p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur-xl sm:p-10">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary/5 to-transparent lg:block" />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI-genererad insikt
                  </Badge>
                  {lastUpdated && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Uppdaterad {lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {heroInsight?.title ?? 'Senaste AI-genererade rapporterna'}
                  </h1>
                  {insightsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>AI sammanfattar marknadsläget…</span>
                    </div>
                  ) : (
                    <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                      {heroInsight?.content ??
                        'Utforska färska bolagsanalyser, viktiga händelser och korta sammanfattningar producerade av Market Minds AI.'}
                    </p>
                  )}
                  {lastUpdated && (
                    <p className="text-xs text-muted-foreground">Senast uppdaterad {lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {heroInsight?.key_factors?.slice(0, 3).map((factor) => (
                    <Badge key={factor} variant="outline" className="rounded-full border-border/60 text-xs">
                      {factor}
                    </Badge>
                  ))}
                  {!heroInsight && (
                    <Badge variant="outline" className="rounded-full border-border/60 text-xs">
                      Marknadssvep
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {newsLoading ? (
                    <Badge variant="outline" className="rounded-full border-border/60 text-xs">
                      Laddar nyckelteman…
                    </Badge>
                  ) : (
                    trendingCategories.map((category) => (
                      <Badge key={category.category} variant="secondary" className="rounded-full bg-muted/50 text-xs text-muted-foreground">
                        #{category.category} · {category.count}
                      </Badge>
                    ))
                  )}
                  {newsError && (
                    <Badge variant="destructive" className="rounded-full text-xs">
                      Kunde inte hämta nyheter
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="rounded-xl" onClick={() => navigate('/discover')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tillbaka till upptäck
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-border/70"
                    onClick={() => navigate('/ai-chatt')}
                  >
                    Prata med AI om nyheterna
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Card className="border-border/70 bg-card/80">
                <CardContent className="flex h-full flex-col gap-4 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Rapporter</span>
                    <Badge variant="outline" className="rounded-full text-xs">
                      Live
                    </Badge>
                  </div>
                  <div className="text-4xl font-semibold text-foreground">{reports.length}</div>
                  <p className="text-sm text-muted-foreground">Sammanfattningar uppdateras automatiskt när nya källor publiceras.</p>
                  <Separator className="bg-border/60" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Bolag</p>
                      <p className="text-lg font-semibold text-foreground">{companyCount}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Källor</p>
                      <p className="text-lg font-semibold text-foreground">{sourceCount}</p>
                    </div>
                  </div>
                  <div className={`rounded-2xl border px-3 py-2 text-sm font-medium ${SENTIMENT_META[heroSentiment].badgeClass}`}>
                    {SENTIMENT_META[heroSentiment].label}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {marketLoading
                ? Array.from({ length: MAX_INDEX_TILES }).map((_, index) => (
                    <div key={index} className="h-20 rounded-2xl border border-dashed border-border/60 bg-muted/20" />
                  ))
                : indexTiles.map((indexData, idx) => {
                    if (!indexData) {
                      return (
                        <div
                          key={`placeholder-${idx}`}
                          className="flex h-20 flex-col justify-center rounded-2xl border border-dashed border-border/60 bg-muted/5 p-4 text-sm text-muted-foreground"
                        >
                          Marknadsdata saknas
                        </div>
                      );
                    }

                    const change = indexData.changePercent ?? 0;
                    const isPositive = change >= 0;

                    return (
                      <div key={indexData.symbol} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 p-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{indexData.displayLabel}</p>
                          <p className="text-2xl font-semibold text-foreground">
                            {indexData.price ? indexData.price.toFixed(2) : '—'}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                          {indexData.changePercent != null ? `${isPositive ? '+' : ''}${change.toFixed(2)}%` : '—'}
                        </div>
                      </div>
                    );
                  })}
            </div>
          </section>

          {highlightReports.length > 0 && (
            <section className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Utvalda sammanfattningar
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">Senaste AI-genererade rapporterna</h2>
                </div>
                <Button variant="ghost" className="justify-start rounded-xl sm:justify-end" onClick={handleScrollToReports}>
                  Läs alla rapporter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {highlightReports.map((report) => (
                  <ReportHighlightCard
                    key={report.id}
                    report={report}
                    ctaHref="#rapporter"
                    onCTAClick={handleScrollToReports}
                  />
                ))}
              </div>
            </section>
          )}

          {latestReport && (
            <section className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/80">
                    <Sparkles className="h-4 w-4" />
                    Aktuellt just nu
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{latestReport.reportTitle}</h2>
                  <p className="text-sm text-muted-foreground sm:text-base">{latestReport.summary}</p>
                  {highlightedTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {highlightedTopics.map((topic) => (
                        <Badge key={topic} variant="outline" className="rounded-full border-border/60 text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Baserad på</span>
                    <Badge variant="secondary" className="rounded-full">
                      {latestReport.companyName}
                    </Badge>
                  </div>
                  {latestReport.sourceDocumentName && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Källa</span>
                      <span className="font-medium text-foreground">{latestReport.sourceDocumentName}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border"
                    onClick={() => navigate('#rapporter')}
                  >
                    Läs rapporterna
                  </Button>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)_minmax(260px,0.6fr)]">
            <Card id="rapporter" className="border-border/60 bg-card/80">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sammanställningar</p>
                  <CardTitle className="text-2xl">Rapportspaning</CardTitle>
                </div>
                <Button variant="ghost" className="rounded-xl" onClick={() => navigate('/discover')}>
                  Utforska aktiecase
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading && reports.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
                    Laddar rapporter...
                  </div>
                ) : (
                  <GeneratedReportsSection reports={reports} />
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/60 bg-card/80">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nyhetsläge</p>
                        <CardTitle className="text-2xl">Senaste marknadsnyheterna</CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-border/70"
                        onClick={refetchNews}
                        disabled={newsLoading}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${newsLoading ? 'animate-spin' : ''}`} />
                        Uppdatera
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Utforska trender genom att filtrera nyhetsflödet på de hetaste kategorierna just nu.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingCategories.map((category) => {
                      const isActive = selectedCategory === category.category;
                      return (
                        <button
                          key={category.category}
                          type="button"
                          onClick={() => handleCategoryToggle(category.category)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            isActive
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-border'
                          }`}
                        >
                          #{category.category} · {category.count}
                        </button>
                      );
                    })}
                    {!trendingCategories.length && !newsLoading && (
                      <span className="text-xs text-muted-foreground">Inga trender tillgängliga</span>
                    )}
                    {newsLoading && (
                      <Badge variant="outline" className="rounded-full border-dashed border-border/70 text-xs">
                        Laddar kategorier…
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <FlashBriefs
                    manual
                    newsItems={filteredNewsItems}
                    loading={newsLoading}
                    error={newsError}
                    refetch={refetchNews}
                    showHeader={false}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:col-span-2 xl:col-span-1">
              <MarketMomentum />
              <FinancialCalendar />
              <Card className="border-border/60 bg-card/80">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live-data</p>
                      <CardTitle className="text-xl">Market Pulse</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={handlePulseToggle}
                    >
                      {showPulse ? 'Dölj' : 'Visa'}
                      <ChevronDown className={`ml-2 h-4 w-4 transition ${showPulse ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Se realtidsindex, vinnare och förlorare med samma data som driver hjältesektionen.
                  </p>
                  {marketError && !marketLoading && (
                    <Badge variant="destructive" className="w-fit text-xs">
                      Kunde inte ladda marknadsdata just nu
                    </Badge>
                  )}
                </CardHeader>
                {showPulse && (
                  <CardContent>
                    <MarketPulse
                      useExternalData
                      marketData={marketData}
                      loading={marketLoading}
                      error={marketError}
                      refetch={refetchMarketData}
                    />
                  </CardContent>
                )}
                {!showPulse && (
                  <CardContent className="text-sm text-muted-foreground">
                    Håll dig uppdaterad på indexrörelser genom att expandera Market Pulse.
                  </CardContent>
                )}
              </Card>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default DiscoverNews;
