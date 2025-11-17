import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Flame, Newspaper, Radar, Sparkles } from 'lucide-react';

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
          <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-[#0b1b3a]/70 via-background to-background p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.12),transparent_30%)]" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <Badge variant="secondary" className="border-none bg-white/10 text-primary backdrop-blur">
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
                  <Button size="lg" className="rounded-xl bg-white text-foreground shadow-sm hover:bg-muted" onClick={() => navigate('/discover')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tillbaka till upptäck
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-white/40 bg-white/10 text-white backdrop-blur hover:border-white/60 hover:bg-white/20"
                    onClick={() => navigate('/ai-chatt')}
                  >
                    Prata med AI om nyheterna
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative flex w-full flex-col gap-4 rounded-2xl border border-white/30 bg-white/10 p-4 shadow-lg backdrop-blur sm:max-w-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Rapporter</span>
                  <Badge variant="outline" className="rounded-full border-white/40 text-[11px] text-foreground">
                    Live
                  </Badge>
                </div>
                <div className="text-4xl font-semibold text-foreground">{reports.length}</div>
                <p className="text-sm text-muted-foreground">Sammanfattningar uppdateras automatiskt när nya källor publiceras.</p>
                <Separator className="bg-border/40" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/40 bg-white/10 p-3 backdrop-blur">
                    <p className="text-xs text-muted-foreground">Bolag</p>
                    <p className="text-lg font-semibold text-foreground">{companyCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/40 bg-white/10 p-3 backdrop-blur">
                    <p className="text-xs text-muted-foreground">Källor</p>
                    <p className="text-lg font-semibold text-foreground">{sourceCount}</p>
                  </div>
                </div>
              </div>
            </div>
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
                        <Badge
                          key={topic}
                          variant="outline"
                          className="rounded-full border-border/60 bg-muted/40 text-xs text-foreground"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-gradient-to-br from-white/70 via-white/50 to-white/30 p-4 text-sm text-muted-foreground shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Baserad på</span>
                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                      {latestReport.companyName}
                    </Badge>
                  </div>
                  {latestReport.sourceDocumentName && (
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-muted-foreground">Källa</span>
                      <span className="font-medium text-foreground">{latestReport.sourceDocumentName}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-between rounded-xl bg-white text-foreground shadow-sm hover:bg-muted"
                    onClick={() => navigate('#rapporter')}
                  >
                    Läs rapporterna
                    <ArrowRight className="h-4 w-4" />
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
