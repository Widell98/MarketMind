import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Loader2, Sparkles } from 'lucide-react';

import Layout from '@/components/Layout';
import ReportHighlightCard from '@/components/ReportHighlightCard';
import MarketPulse from '@/components/MarketPulse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDiscoverReportSummaries } from '@/hooks/useDiscoverReportSummaries';
import { useMarketData } from '@/hooks/useMarketData';
import { useNewsData } from '@/hooks/useNewsData';
import { useMarketOverviewInsights, type MarketOverviewInsight } from '@/hooks/useMarketOverviewInsights';

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
  const { newsData, loading: newsLoading, error: newsError } = useNewsData();
  const { data: overviewInsights = [], isLoading: insightsLoading } = useMarketOverviewInsights();

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
  const lastUpdated = marketData?.lastUpdated ? new Date(marketData.lastUpdated) : null;
  const reportHighlights = useMemo(() => reports.slice(0, 3), [reports]);
  
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

  const topNewsHighlights = useMemo(() => (newsData ?? []).slice(0, 3), [newsData]);

  const focusAreas = useMemo(() => {
    if (heroInsight?.key_factors?.length) {
      return heroInsight.key_factors.slice(0, 3);
    }

    if (trendingCategories.length) {
      return trendingCategories.map((item) => item.category).slice(0, 3);
    }

    return ['Marknadspuls', 'Rapporter', 'Nyheter'];
  }, [heroInsight, trendingCategories]);

  const formatPublishedLabel = (isoString?: string) => {
    if (!isoString) return 'Okänd tid';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Okänd tid';
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-1 sm:px-4 lg:px-6">
          {/* Hero Section */}
          <div className="space-y-4 pt-4 sm:pt-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                Nyheter & Marknadspuls
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                Håll dig uppdaterad med de senaste marknadsnyheterna, AI-genererade analyser och realtidsmarknadsdata
              </p>
            </div>
          </div>

          {/* Reports Section */}
          {(reportHighlights.length > 0 || reportsLoading) && (
            <section className="space-y-6 rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm p-6 shadow-lg sm:p-8 lg:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Senaste AI-genererade rapporterna
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Viktiga höjdpunkter</h2>
                </div>
                <Button 
                  variant="ghost" 
                  className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" 
                  onClick={() => navigate('/discover')}
                >
                  Visa alla rapporter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {reportsLoading && reportHighlights.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-16 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Laddar rapporter…</p>
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

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Morning Report Card */}
            <Card id="morgonrapport" className="border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="space-y-6 p-5 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        AI-genererat nyhetsbrev
                      </p>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground">Morgonrapporten</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-primary/10 text-xs font-medium text-primary border-primary/20">
                    Genererad kl 07:00
                  </Badge>
                </div>
                
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {heroInsight?.content ??
                    'AI sammanfattar gårdagens marknadsrörelser och vad som väntar i dag. Följ höjdpunkterna och få ett par snabba fokusområden innan börsen öppnar.'}
                </p>
                
                <Separator className="bg-border/60" />
                
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Gårdagens höjdpunkter
                      </p>
                    </div>
                    {topNewsHighlights.length ? (
                      <ul className="space-y-3">
                        {topNewsHighlights.map((item) => (
                          <li 
                            key={item.id} 
                            className="group rounded-2xl border border-border/60 bg-muted/30 p-4 hover:bg-muted/50 hover:border-primary/30 transition-all"
                          >
                            <p className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                              {item.headline}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {item.source} · {formatPublishedLabel(item.publishedAt)}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.summary}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          Nyhetsflödet är lugnt just nu. Vi uppdaterar morgonrapporten när nya artiklar finns tillgängliga.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Fokus idag
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {focusAreas.map((area) => (
                        <Badge 
                          key={area} 
                          variant="outline" 
                          className="rounded-full border-border/60 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Händelser att bevaka
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {lastUpdated
                        ? `Marknadspulsen uppdaterades ${lastUpdated.toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}. Håll ett extra öga på indexrörelserna och dagens rapportflöde.`
                        : 'Håll koll på viktiga makrobesked och kommande rapportsläpp under dagen.'}
                    </p>
                  </div>
                </div>
                
                <Separator className="bg-border/60" />
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    className="rounded-xl flex-1 sm:flex-none" 
                    variant="default" 
                    onClick={() => navigate('/news#morgonrapport')}
                  >
                    Läs hela morgonrapporten
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-border/70 hover:bg-primary/5 hover:border-primary/40 transition-colors"
                  >
                    Prenumerera på utskick
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Market Pulse Card */}
            <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-5 sm:p-6 lg:p-8">
                <MarketPulse
                  useExternalData
                  marketData={marketData}
                  loading={marketLoading}
                  error={marketError}
                  refetch={refetchMarketData}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DiscoverNews;
