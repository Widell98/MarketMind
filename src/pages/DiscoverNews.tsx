import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Flame, Newspaper, Radar, Sparkles } from 'lucide-react';

import Layout from '@/components/Layout';
import GeneratedReportsSection from '@/components/GeneratedReportsSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDiscoverReportSummaries } from '@/hooks/useDiscoverReportSummaries';

const DiscoverNews = () => {
  const navigate = useNavigate();
  const { reports, loading } = useDiscoverReportSummaries(24);

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

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-1 sm:px-4 lg:px-0">
          <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Nyhetssvep
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Senaste AI-genererade rapporterna
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    Utforska färska bolagsanalyser, viktiga händelser och korta sammanfattningar producerade av Market Minds AI.
                  </p>
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
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 sm:max-w-xs">
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
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60 bg-card/80">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Newspaper className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Snabböversikt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Hitta AI-kurerade nedslag i bolagsrapporter utan att läsa hela årsredovisningen.</p>
                <p>Få en snabb bild av vad som händer via nyckelmetrik och höjdpunkter.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                  <Flame className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Färska signaler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Identifiera var AI ser momentum, risker och nya tendenser.</p>
                <p>Perfekt för dig som vill agera snabbt på senaste siffrorna.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  <Radar className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Fördjupning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Öppna en rapport för att se VD-kommentarer, nyckelpunkter och källhänvisningar.</p>
                <p>Allt i ett gränssnitt optimerat för fokus.</p>
              </CardContent>
            </Card>
          </section>

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

          <div id="rapporter" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sammanställningar</p>
                <h3 className="text-xl font-semibold text-foreground">AI-genererade rapporter</h3>
              </div>
              <Button variant="ghost" className="rounded-xl" onClick={() => navigate('/discover')}>
                Utforska aktiecase
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {loading && reports.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
                Laddar rapporter...
              </div>
            ) : (
              <GeneratedReportsSection reports={reports} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DiscoverNews;
