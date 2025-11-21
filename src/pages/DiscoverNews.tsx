import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Filter, Search } from 'lucide-react';

import Layout from '@/components/Layout';
import ReportHighlightCard from '@/components/ReportHighlightCard';
import MarketPulse from '@/components/MarketPulse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alla');
  const [selectedSource, setSelectedSource] = useState('Alla');

  const companyCount = useMemo(
    () => new Set(reports.map((report) => report.companyName?.trim())).size,
    [reports]
  );

  const sourceCount = useMemo(
    () => new Set(reports.map((report) => report.sourceType ?? report.sourceDocumentName ?? 'Okänd källa')).size,
    [reports]
  );

  type BrowsableNewsItem = {
    id: string;
    headline: string;
    summary: string;
    category?: string;
    source?: string;
    publishedAt?: string;
    url?: string;
  };

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

  const reportHighlightsAsNews = useMemo<BrowsableNewsItem[]>(
    () =>
      reportHighlights.map((report) => ({
        id: `report-${report.id}`,
        headline: report.reportTitle || report.companyName || 'Kuraterad rapport',
        summary: report.summary || 'Sammanfattning saknas just nu.',
        category: report.companyName || 'Kuraterad rapport',
        source: report.sourceDocumentName || report.sourceType || 'MarketMind-teamet',
        publishedAt: report.createdAt,
        url: report.sourceUrl,
      })),
    [reportHighlights]
  );

  const combinedNewsItems = useMemo<BrowsableNewsItem[]>(
    () => [...(newsData ?? []), ...reportHighlightsAsNews],
    [newsData, reportHighlightsAsNews]
  );

  const trendingCategories = useMemo(() => {
    if (!combinedNewsItems.length) return [] as { category: string; count: number }[];

    const counts = combinedNewsItems.reduce<Record<string, number>>((acc, item) => {
      const category = item.category?.trim() || 'Övrigt';
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => ({ category, count }));
  }, [combinedNewsItems]);

  const topNewsHighlights = useMemo(() => combinedNewsItems.slice(0, 3), [combinedNewsItems]);

  const focusAreas = useMemo(() => {
    if (heroInsight?.key_factors?.length) {
      return heroInsight.key_factors.slice(0, 3);
    }

    if (trendingCategories.length) {
      return trendingCategories.map((item) => item.category).slice(0, 3);
    }

    return ['Marknadspuls', 'Rapporter', 'Nyheter'];
  }, [heroInsight, trendingCategories]);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    combinedNewsItems.forEach((item) => categories.add(item.category?.trim() || 'Övrigt'));
    return ['Alla', ...Array.from(categories).sort()];
  }, [combinedNewsItems]);

  const sourceOptions = useMemo(() => {
    const sources = new Set<string>();
    combinedNewsItems.forEach((item) => sources.add(item.source?.trim() || 'Okänd källa'));
    return ['Alla', ...Array.from(sources).sort()];
  }, [combinedNewsItems]);

  const filteredNews = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return combinedNewsItems.filter((item) => {
      const categoryMatch = selectedCategory === 'Alla' || (item.category?.trim() || 'Övrigt') === selectedCategory;
      const sourceMatch = selectedSource === 'Alla' || (item.source?.trim() || 'Okänd källa') === selectedSource;
      const matchesSearch =
        !search ||
        item.headline?.toLowerCase().includes(search) ||
        item.summary?.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search) ||
        item.source?.toLowerCase().includes(search);

      return categoryMatch && sourceMatch && matchesSearch;
    });
  }, [combinedNewsItems, searchTerm, selectedCategory, selectedSource]);

  const visibleNews = useMemo(() => filteredNews.slice(0, 9), [filteredNews]);

  const formatPublishedLabel = (isoString?: string) => {
    if (!isoString) return 'Okänd tid';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Okänd tid';
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-1 sm:px-4 lg:px-0">
          
          {(reportHighlights.length > 0 || reportsLoading) && (
            <section className="space-y-4 rounded-3xl border border-border/60 bg-gradient-to-br from-finance-navy/6 via-card/90 to-background p-6 shadow-[0_18px_48px_-30px_rgba(10,38,71,0.5)] sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Senaste kuraterade rapporterna
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">Viktiga höjdpunkter</h2>
                </div>
                <Button variant="ghost" className="rounded-xl text-finance-navy hover:bg-finance-navy/10" onClick={() => navigate('/discover')}>
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

          <section className="space-y-4 rounded-3xl border border-border/60 bg-gradient-to-br from-finance-navy/6 via-card/90 to-background p-6 shadow-[0_18px_48px_-30px_rgba(10,38,71,0.5)] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bläddra rapporter</p>
                <h2 className="text-2xl font-semibold text-foreground">Nyhets- och rapportsök</h2>
                <p className="text-sm text-muted-foreground">
                  Filtrera på bolag/källa och kategori eller sök efter relevanta rubriker. Vi visar de senaste kuraterade
                  rapporterna att läsa direkt.
                </p>
              </div>
              <Badge variant="outline" className="rounded-full border-finance-navy/30 bg-finance-navy/10 text-xs text-finance-navy">
                {visibleNews.length} av {filteredNews.length || 0} träffar
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-finance-navy/80" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Sök rubriker, bolag eller källa"
                  className="rounded-xl border-border/60 bg-background/70 pl-9 focus:border-finance-navy/60 focus:ring-finance-navy/20"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-xl border-border/70 bg-background/70 focus:border-finance-navy/60 focus:ring-finance-navy/20">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-finance-navy/80" />
                    <SelectValue placeholder="Kategori" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="rounded-xl border-border/70 bg-background/70 focus:border-finance-navy/60 focus:ring-finance-navy/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-finance-navy/80" />
                    <SelectValue placeholder="Bolag/källa" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newsError && !newsLoading && (
              <div className="rounded-2xl border border-dashed border-finance-navy/30 bg-finance-navy/5 p-4 text-sm text-finance-navy">
                Kunde inte ladda nyheterna just nu. Försök igen senare.
              </div>
            )}

            {newsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={`news-skeleton-${index}`} className="border-border/60 bg-finance-navy/5">
                    <CardContent className="space-y-3 p-4">
                      <div className="h-4 w-24 animate-pulse rounded-full bg-finance-navy/10" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-finance-navy/15" />
                      <div className="h-14 w-full animate-pulse rounded bg-finance-navy/10" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-finance-navy/15" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : visibleNews.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleNews.map((item) => (
                  <Dialog key={item.id}>
                    <DialogTrigger asChild>
                      <Card className="group h-full cursor-pointer border-border/60 bg-gradient-to-b from-card/90 via-background to-finance-navy/8 shadow-[0_12px_42px_-30px_rgba(10,38,71,0.55)] transition hover:-translate-y-1 hover:border-finance-navy/50 hover:shadow-lg">
                        <CardContent className="flex h-full flex-col gap-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <Badge variant="secondary" className="rounded-full border border-finance-navy/15 bg-finance-navy/10 text-[11px] text-finance-navy">
                                {item.category || 'Övrigt'}
                              </Badge>
                              <h3 className="text-lg font-semibold text-foreground">{item.headline}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-3">{item.summary}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.source || 'Okänd källa'}</span>
                            <span>{formatPublishedLabel(item.publishedAt)}</span>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-1 text-sm font-semibold text-finance-navy">
                            <span className="inline-flex items-center gap-1">
                              Läs mer
                              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                            </span>
                            <Badge variant="outline" className="rounded-full border-finance-navy/25 text-[11px] text-finance-navy">
                              {item.source || 'Okänd källa'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl border-finance-navy/30 bg-gradient-to-b from-finance-navy/6 via-card to-background shadow-[0_18px_48px_-30px_rgba(10,38,71,0.5)]">
                      <DialogHeader>
                        <DialogTitle>{item.headline}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="rounded-full border-finance-navy/40 bg-finance-navy/10 text-[11px] text-finance-navy">
                            {item.category || 'Övrigt'}
                          </Badge>
                          <span>•</span>
                          <span>{item.source || 'Okänd källa'}</span>
                          <span>•</span>
                          <span>{formatPublishedLabel(item.publishedAt)}</span>
                        </div>
                        <p className="text-base leading-relaxed text-foreground">{item.summary}</p>
                        {item.url && (
                          <Button asChild variant="outline" className="rounded-xl border-finance-navy/40 text-finance-navy hover:bg-finance-navy/10">
                            <a href={item.url} target="_blank" rel="noreferrer">
                              Öppna källan
                            </a>
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-finance-navy/35 bg-finance-navy/6 p-6 text-sm text-muted-foreground">
                Inga rapporter matchar dina filter just nu. Justera sökning eller kategorier för att hitta fler artiklar.
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card id="morgonrapport" className="border-border/60 bg-gradient-to-br from-finance-navy/6 via-card/90 to-background shadow-[0_18px_48px_-30px_rgba(10,38,71,0.5)]">
              <CardContent className="space-y-5 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Kuraterad morgonuppdatering
                    </p>
                    <h3 className="text-2xl font-semibold text-foreground">Morgonrapporten</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full border border-finance-navy/15 bg-finance-navy/10 text-xs text-finance-navy shadow-sm">
                    Skapad av MarketMind-teamet
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {heroInsight?.content ??
                    'Vårt redaktionella team sammanfattar gårdagens marknadsrörelser och vad som väntar i dag. Följ höjdpunkterna och få ett par snabba fokusområden innan börsen öppnar.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gårdagens höjdpunkter
                    </p>
                    {topNewsHighlights.length ? (
                      <ul className="mt-2 space-y-3">
                        {topNewsHighlights.map((item) => (
                          <li key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                            <p className="text-sm font-semibold text-foreground">{item.headline}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.source} · {formatPublishedLabel(item.publishedAt)}
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
                    <p className="mt-2 text-sm text-muted-foreground">
                      {lastUpdated
                        ? `Marknadspulsen uppdaterades ${lastUpdated.toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}. Håll ett extra öga på indexrörelserna och dagens rapportflöde.`
                        : 'Håll koll på viktiga makrobesked och kommande rapportsläpp under dagen.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-xl" variant="default" onClick={() => navigate('/news#morgonrapport')}>
                    Läs hela morgonrapporten
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="rounded-xl border-border/70">
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
