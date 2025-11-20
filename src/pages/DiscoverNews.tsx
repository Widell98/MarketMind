import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

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
import { useMarketOverviewInsights } from '@/hooks/useMarketOverviewInsights';
import { useMorningBrief } from '@/hooks/useMorningBrief';

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
  const { newsData } = useNewsData();
  const { data: overviewInsights = [], isLoading: insightsLoading } = useMarketOverviewInsights();
  const { brief: morningBrief, loading: morningBriefLoading, error: morningBriefError } = useMorningBrief();

  const heroInsight = overviewInsights[0];
  const heroIndices = marketData?.marketIndices ?? [];
  const lastUpdated = marketData?.lastUpdated ? new Date(marketData.lastUpdated) : null;
  const reportHighlights = useMemo(() => reports.slice(0, 3), [reports]);

  const morningBriefHighlights = useMemo(
    () =>
      (morningBrief?.highlights ?? []).map((item, index) => ({
        id: item.id ?? `brief-${index}`,
        title: item.headline ?? item.title ?? 'Höjdpunkt',
        summary: item.summary,
        source: item.source ?? 'AI morning brief',
        publishedAt: item.publishedAt,
      })),
    [morningBrief?.highlights]
  );
  
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

  const highlightItems = useMemo(() => {
    if (morningBriefHighlights.length) {
      return morningBriefHighlights;
    }

    return topNewsHighlights.map((item) => ({
      id: item.id,
      title: item.headline,
      summary: item.summary,
      source: item.source,
      publishedAt: item.publishedAt,
    }));
  }, [morningBriefHighlights, topNewsHighlights]);

  const focusAreas = useMemo(() => {
    if (morningBrief?.focusAreas?.length) {
      return morningBrief.focusAreas.slice(0, 3);
    }

    if (heroInsight?.key_factors?.length) {
      return heroInsight.key_factors.slice(0, 3);
    }

    if (trendingCategories.length) {
      return trendingCategories.map((item) => item.category).slice(0, 3);
    }

    return ['Marknadspuls', 'Rapporter', 'Nyheter'];
  }, [heroInsight, morningBrief?.focusAreas, trendingCategories]);

  const formatPublishedLabel = (isoString?: string) => {
    if (!isoString) return 'Okänd tid';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Okänd tid';
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const formattedGeneratedAt = useMemo(() => {
    if (!morningBrief?.generatedAt) return 'Genererad kl 07:00';
    const parsed = new Date(morningBrief.generatedAt);
    if (Number.isNaN(parsed.getTime())) {
      return `Genererad ${morningBrief.generatedAt}`;
    }

    return `Genererad ${parsed.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
  }, [morningBrief?.generatedAt]);

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-1 sm:px-4 lg:px-0">
          
          {(reportHighlights.length > 0 || reportsLoading) && (
            <section className="space-y-4 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/10 to-background p-6 shadow-lg shadow-primary/10 backdrop-blur sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                      Senaste AI-genererade rapporterna
                    </p>
                    <h2 className="text-2xl font-semibold text-foreground">Viktiga höjdpunkter</h2>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
                  onClick={() => navigate('/discover')}
                >
                  Visa alla rapporter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {reportsLoading && reportHighlights.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/10 px-6 py-10 text-center text-sm text-primary">
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              id="morgonrapport"
              className="border border-primary/25 bg-gradient-to-br from-primary/12 via-primary/8 to-background shadow-md shadow-primary/10"
            >
              <CardContent className="space-y-5 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                        AI-genererat nyhetsbrev
                      </p>
                      <h3 className="text-2xl font-semibold text-foreground">Morgonrapporten</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-xs text-primary">
                      {formattedGeneratedAt}
                    </Badge>
                    <Badge variant="outline" className="hidden items-center gap-1 rounded-full border-primary/50 text-[11px] font-semibold text-primary sm:inline-flex">
                      <Sparkles className="h-3 w-3" /> ai-morning-brief
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {morningBrief?.intro ??
                    heroInsight?.content ??
                    'AI sammanfattar gårdagens marknadsrörelser och vad som väntar i dag. Följ höjdpunkterna och få ett par snabba fokusområden innan börsen öppnar.'}
                </p>
                {morningBriefError && (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-700">
                    Kunde inte hämta dagens ai-morning-brief just nu. Vi visar senaste nyheterna istället.
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gårdagens höjdpunkter
                    </p>
                    {morningBriefLoading && !highlightItems.length ? (
                      <div className="mt-3 rounded-2xl border border-dashed border-primary/40 bg-primary/10 p-4 text-sm text-primary">
                        Laddar morgonrapporten…
                      </div>
                    ) : highlightItems.length ? (
                      <ul className="mt-2 space-y-3">
                        {highlightItems.map((item) => (
                          <li key={item.id} className="rounded-2xl border border-primary/30 bg-primary/5 p-3 shadow-sm shadow-primary/10">
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.source} · {formatPublishedLabel(item.publishedAt)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.summary ?? 'Ingen sammanfattning tillgänglig ännu.'}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
                        Nyhetsflödet är lugnt just nu. Vi uppdaterar morgonrapporten när nya artiklar finns tillgängliga.
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fokus idag</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {focusAreas.map((area) => (
                        <Badge key={area} variant="outline" className="rounded-full border-primary/60 text-xs text-primary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Händelser att bevaka
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {morningBrief?.events
                        ? morningBrief.events
                        : lastUpdated
                            ? `Marknadspulsen uppdaterades ${lastUpdated.toLocaleTimeString('sv-SE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}. Håll ett extra öga på indexrörelserna och dagens rapportflöde.`
                            : 'Håll koll på viktiga makrobesked och kommande rapportsläpp under dagen.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
                    variant="default"
                    onClick={() => navigate('/news#morgonrapport')}
                  >
                    Läs hela morgonrapporten
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-primary/60 text-primary shadow-inner shadow-primary/10 transition hover:bg-primary/10"
                  >
                    Prenumerera på utskick
                  </Button>
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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DiscoverNews;
