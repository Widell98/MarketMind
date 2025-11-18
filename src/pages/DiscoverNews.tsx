import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Clock, Loader2, Sparkles } from 'lucide-react';

import Layout from '@/components/Layout';
import ReportHighlightCard from '@/components/ReportHighlightCard';
import MarketPulse from '@/components/MarketPulse';
import MarketMomentum from '@/components/MarketMomentum';
import FinancialCalendar from '@/components/FinancialCalendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDiscoverReportSummaries } from '@/hooks/useDiscoverReportSummaries';
import { useMarketData } from '@/hooks/useMarketData';
import { useNewsData } from '@/hooks/useNewsData';
import { useMarketOverviewInsights, type MarketOverviewInsight } from '@/hooks/useMarketOverviewInsights';
import { useSupabaseNewsFeed } from '@/hooks/useSupabaseNewsFeed';
import { useMorningBrief } from '@/hooks/useMorningBrief';
import { useUserRole } from '@/hooks/useUserRole';

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
  const { reports, loading: reportsLoading } = useDiscoverReportSummaries(24);
  const { marketData, loading: marketLoading, error: marketError, refetch: refetchMarketData } = useMarketData();
  const {
    newsData,
    loading: newsLoading,
    error: newsError,
    refetch: refetchNews,
    lastUpdated: newsLastUpdated,
  } = useNewsData();
  const {
    brief: morningBrief,
    loading: morningBriefLoading,
    error: morningBriefError,
    refetch: refetchMorningBrief,
  } = useMorningBrief();
  const {
    data: momentumData,
    loading: momentumLoading,
    error: momentumError,
    refetch: refetchMomentum,
  } = useSupabaseNewsFeed('momentum');
  const {
    data: calendarEvents,
    loading: calendarLoading,
    error: calendarError,
    refetch: refetchCalendar,
  } = useSupabaseNewsFeed('calendar');
  const { data: overviewInsights = [], isLoading: insightsLoading } = useMarketOverviewInsights();
  const { isAdmin } = useUserRole();
  const momentumSectionId = 'marknadsmomentum';
  const calendarSectionId = 'finansiell-kalender';
  const reportHighlightsSectionId = 'rapport-hojdpunkter';
  const morningReportSectionId = 'morgonrapport';

  const refreshSupportingFeeds = () => {
    refetchNews();
    refetchMomentum();
    refetchCalendar();
    if (isAdmin) {
      refetchMorningBrief({ forceRefresh: true });
    } else {
      refetchMorningBrief();
    }
  };

  const handleAiChatClick = () => {
    refreshSupportingFeeds();
    navigate('/ai-chatt');
  };

  const companyCount = useMemo(
    () => new Set(reports.map((report) => report.companyName?.trim())).size,
    [reports]
  );

  const sourceCount = useMemo(
    () => new Set(reports.map((report) => report.sourceType ?? report.sourceDocumentName ?? 'Okänd källa')).size,
    [reports]
  );

  const heroInsight = overviewInsights[0];
  const heroSentiment = deriveSentimentFromInsight(heroInsight);
  const heroIndices = marketData?.marketIndices ?? [];
  const marketLastUpdatedIso = marketData?.lastUpdated ?? null;
  const newsLastUpdatedIso = newsLastUpdated ?? null;
  const marketLastUpdatedDate = marketLastUpdatedIso ? new Date(marketLastUpdatedIso) : null;
  const reportHighlights = useMemo(() => reports.slice(0, 3), [reports]);
  const combinedLastUpdatedLabel = useMemo(() => {
    if (!marketLastUpdatedIso && !newsLastUpdatedIso) {
      return null;
    }

    const formatTime = (isoString: string) =>
      new Date(isoString).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

    const parts: string[] = [];
    if (marketLastUpdatedIso) {
      parts.push(`Marknad ${formatTime(marketLastUpdatedIso)}`);
    }
    if (newsLastUpdatedIso) {
      parts.push(`Nyheter ${formatTime(newsLastUpdatedIso)}`);
    }

    return `Senast uppdaterad ${parts.join(' · ')}`;
  }, [marketLastUpdatedIso, newsLastUpdatedIso]);
  
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

  const focusAreas = useMemo(() => {
    if (morningBrief?.focusAreas?.length) {
      return morningBrief.focusAreas;
    }

    if (heroInsight?.key_factors?.length) {
      return heroInsight.key_factors.slice(0, 3);
    }

    if (trendingCategories.length) {
      return trendingCategories.map((item) => item.category).slice(0, 3);
    }

    return ['Marknadspuls', 'Rapporter', 'Nyheter'];
  }, [heroInsight, morningBrief, trendingCategories]);

  const formatPublishedLabel = (isoString?: string) => {
    if (!isoString) return 'Okänd tid';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Okänd tid';
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };
  const morningBriefGeneratedTimeLabel = morningBrief?.generatedAt
    ? new Date(morningBrief.generatedAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    : null;

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
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="rounded-xl" onClick={() => navigate('/discover')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Tillbaka till upptäck
                    </Button>
                    <Button size="lg" variant="secondary" className="rounded-xl" asChild>
                      <a href={`#${reportHighlightsSectionId}`}>
                        Visa rapporterna
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-xl border-border/70"
                      onClick={handleAiChatClick}
                    >
                      Prata med AI om nyheterna
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  {combinedLastUpdatedLabel && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {combinedLastUpdatedLabel}
                    </div>
                  )}
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
          {(reportHighlights.length > 0 || reportsLoading) && (
            <section
              id={reportHighlightsSectionId}
              className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Senaste AI-genererade rapporterna
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">Viktiga höjdpunkter</h2>
                </div>
                <Button variant="ghost" className="rounded-xl" onClick={() => navigate('/discover')}>
                  Visa alla rapporter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {reportsLoading && reportHighlights.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
                  Laddar rapporter…
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {reportHighlights.map((report) => (
                    <ReportHighlightCard key={report.id} report={report} />
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card id={morningReportSectionId} className="border-border/60 bg-card/80">
              <CardContent className="space-y-5 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      AI-genererat nyhetsbrev
                    </p>
                    <h3 className="text-2xl font-semibold text-foreground">Morgonrapporten</h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`rounded-full text-xs ${SENTIMENT_META[morningBrief?.sentiment ?? 'neutral'].badgeClass}`}
                  >
                    {morningBriefGeneratedTimeLabel ? `Genererad ${morningBriefGeneratedTimeLabel}` : 'Genereras dagligen'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {morningBrief?.summary ??
                    heroInsight?.content ??
                    'AI sammanfattar gårdagens marknadsrörelser och vad som väntar i dag. Följ höjdpunkterna och få ett par snabba fokusområden innan börsen öppnar.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gårdagens höjdpunkter
                    </p>
                    {morningBriefLoading ? (
                      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Laddar dagens höjdpunkter…
                      </div>
                    ) : morningBriefError ? (
                      <div className="mt-3 space-y-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                        <p>Kunde inte hämta morgonrapporten just nu.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border/60"
                          onClick={() =>
                            isAdmin ? refetchMorningBrief({ forceRefresh: true }) : refetchMorningBrief()
                          }
                        >
                          Försök igen
                        </Button>
                      </div>
                    ) : morningBrief?.highlights?.length ? (
                      <ul className="mt-2 space-y-3">
                        {morningBrief.highlights.map((item, index) => (
                          <li key={`${item.title}-${index}`} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.source ?? 'Källa saknas'} · {formatPublishedLabel(item.publishedAt)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                        Nyhetsflödet är lugnt just nu. Vi uppdaterar morgonrapporten när nya artiklar finns tillgängliga.
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fokus idag</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {focusAreas.map((area) => (
                        <Badge key={area} variant="outline" className="rounded-full border-border/60 text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Händelser att bevaka
                    </p>
                    {morningBrief?.eventsToWatch?.length ? (
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {morningBrief.eventsToWatch.map((event, index) => (
                          <li key={`${event}-${index}`} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{event}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {marketLastUpdatedDate
                          ? `Marknadspulsen uppdaterades ${marketLastUpdatedDate.toLocaleTimeString('sv-SE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}. Håll ett extra öga på indexrörelserna och dagens rapportflöde.`
                          : 'Håll koll på viktiga makrobesked och kommande rapportsläpp under dagen.'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-xl" variant="default" asChild>
                    <a href={`#${morningReportSectionId}`}>
                      Läs hela morgonrapporten
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" className="rounded-xl border-border/70" onClick={refreshSupportingFeeds}>
                    Prenumerera på utskick
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="secondary"
                      className="rounded-xl border border-border/70 bg-secondary/70"
                      onClick={() => refetchMorningBrief({ forceRefresh: true })}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generera dagens rapport
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80">
              <CardContent className="p-4 sm:p-6">
                <MarketPulse
                  useExternalData
                  marketData={marketData}
                  loading={marketLoading}
                  error={marketError}
                  refetch={refetchMarketData}
                />
              </CardContent>
            </Card>
            <div className="space-y-6">
              <MarketMomentum
                sectionId={momentumSectionId}
                items={momentumData}
                loading={momentumLoading}
                error={momentumError}
                onRefetch={refetchMomentum}
              />
              <FinancialCalendar
                sectionId={calendarSectionId}
                events={calendarEvents}
                loading={calendarLoading}
                error={calendarError}
                onRefetch={refetchCalendar}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DiscoverNews;
