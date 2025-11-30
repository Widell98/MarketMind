import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Loader2, Sparkles } from 'lucide-react';

import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useNewsData } from '@/hooks/useNewsData';
import { useMarketOverviewInsights } from '@/hooks/useMarketOverviewInsights';

const formatCategoryLabel = (category?: string) => {
  if (!category) return 'Marknad';
  const normalized = category.toLowerCase();
  switch (normalized) {
    case 'macro':
      return 'Makro';
    case 'tech':
      return 'Teknik';
    case 'earnings':
      return 'Rapporter';
    case 'commodities':
      return 'Råvaror';
    case 'sweden':
      return 'Sverige';
    case 'global':
      return 'Globalt';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
};

const DiscoverNews = () => {
  const { newsData, morningBrief } = useNewsData();
  const { data: overviewInsights = [], isLoading: insightsLoading } = useMarketOverviewInsights();

  const heroInsight = overviewInsights[0];

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

  const digestHighlights = useMemo(() => {
    if (morningBrief?.keyHighlights?.length) {
      return morningBrief.keyHighlights;
    }
    return [];
  }, [morningBrief]);

  const briefSections = useMemo(() => {
    if (morningBrief?.sections?.length) {
      return morningBrief.sections;
    }
    return [];
  }, [morningBrief]);

  const focusAreas = useMemo(() => {
    if (morningBrief?.focusToday?.length) {
      return morningBrief.focusToday.slice(0, 3);
    }

    if (heroInsight?.key_factors?.length) {
      return heroInsight.key_factors.slice(0, 3);
    }

    if (trendingCategories.length) {
      return trendingCategories.map((item) => formatCategoryLabel(item.category)).slice(0, 3);
    }

    return ['Morgonrapport', 'Rapporter', 'Nyheter'];
  }, [morningBrief, heroInsight, trendingCategories]);

  const newsByCategory = useMemo<Record<string, typeof newsData>>(() => {
    const grouped: Record<string, typeof newsData> = {};
    (newsData ?? []).forEach((item) => {
      const label = formatCategoryLabel(item.category);
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(item);
    });
    return grouped;
  }, [newsData]);

  const categorySections = useMemo(() => {
    const prioritizedLabels = trendingCategories
      .map(({ category }) => formatCategoryLabel(category))
      .filter((label, index, arr) => arr.indexOf(label) === index);

    const additionalLabels = Object.keys(newsByCategory).filter(
      (label) => !prioritizedLabels.includes(label),
    );

    const combined = [...prioritizedLabels, ...additionalLabels];
    return combined.slice(0, 4);
  }, [trendingCategories, newsByCategory]);

  const formatPublishedLabel = (isoString?: string) => {
    if (!isoString) return 'Okänd tid';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Okänd tid';
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatGeneratedLabel = (isoString?: string) => {
    if (!isoString) return 'Genererad kl 07:00';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Genererad kl 07:00';
    return `Genererad ${date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const heroHeadline = morningBrief?.headline ?? 'Morgonrapporten';
  const heroDescription =
    morningBrief?.overview ??
    heroInsight?.content ??
    'AI sammanfattar gårdagens marknadsrörelser och vad som väntar i dag. Följ höjdpunkterna och få ett par snabba fokusområden innan börsen öppnar.';

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-1 sm:px-4 lg:px-6">
          {/* Hero Section */}
          <div className="space-y-4 pt-4 sm:pt-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                AI-nyheter & Morgonrapport
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                Daglig AI-sammanfattning av gårdagens marknad med tematiska nyhetssvep för svenska investerare.
              </p>
            </div>
          </div>

          <div className="space-y-6">
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
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{heroHeadline}</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-primary/10 text-xs font-medium text-primary border-primary/20">
                    {formatGeneratedLabel(morningBrief?.generatedAt)}
                  </Badge>
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {heroDescription}
                </p>

                <Separator className="bg-border/60" />

                <div className="space-y-5">
                  {digestHighlights.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          AI-sammanfattning
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {digestHighlights.map((highlight, index) => (
                          <li
                            key={`digest-highlight-${index}`}
                            className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground leading-relaxed"
                          >
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

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

                  {briefSections.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Morgonbriefens sektioner
                      </p>
                      <div className="space-y-3">
                        {briefSections.map((section, index) => (
                          <div
                            key={`brief-section-${index}`}
                            className="rounded-2xl border border-border/60 bg-background/60 p-4"
                          >
                            <p className="text-sm font-semibold text-foreground mb-1.5">{section.title}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                </div>
              </CardContent>
            </Card>

            {categorySections.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tematiska nyheter</p>
                    <h3 className="text-2xl font-bold text-foreground">Nyheter per fokusområde</h3>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-3xl">
                    AI grupperar gårdagens viktigaste rubriker per tema så att du snabbt ser vad som händer inom varje område.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {categorySections.map((label) => {
                    const items = newsByCategory[label] ?? [];
                    return (
                      <Card key={label} className="border-border/70 bg-card/90">
                        <CardContent className="space-y-4 p-5 sm:p-6">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                              <p className="text-sm text-muted-foreground">Senaste 24 timmarna</p>
                            </div>
                            <Badge variant="secondary" className="rounded-full bg-muted/60 text-xs font-semibold text-muted-foreground">
                              {items.length} nyheter
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {items.slice(0, 3).map((item) => (
                              <div
                                key={`${label}-${item.id}`}
                                className="rounded-2xl border border-border/60 bg-background/60 p-3 space-y-1.5 hover:border-primary/30 transition-colors"
                              >
                                <p className="text-sm font-semibold text-foreground">{item.headline}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.source} · {formatPublishedLabel(item.publishedAt)}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DiscoverNews;
