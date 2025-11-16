import React, { useMemo, useState } from 'react';
import { Newspaper, Sparkles, Bell, Clock3, Filter, Share2, DownloadCloud, Inbox } from 'lucide-react';

import Layout from '@/components/Layout';
import GeneratedReportsSection from '@/components/GeneratedReportsSection';
import { useDiscoverReportSummaries } from '@/hooks/useDiscoverReportSummaries';

const News = () => {
  const { reports, loading } = useDiscoverReportSummaries(18);

  const [sourceFilter, setSourceFilter] = useState<'all' | NonNullable<(typeof reports)[number]['sourceType']>>('all');
  const [freshOnly, setFreshOnly] = useState(false);

  const oneWeekAgo = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() - 7);
    return now;
  }, []);

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => (sourceFilter === 'all' ? true : report.sourceType === sourceFilter))
      .filter((report) => (freshOnly ? new Date(report.createdAt) >= oneWeekAgo : true));
  }, [reports, sourceFilter, freshOnly, oneWeekAgo]);

  const weeklyCount = useMemo(
    () => reports.filter((report) => new Date(report.createdAt) >= oneWeekAgo).length,
    [reports, oneWeekAgo],
  );

  const sourceBreakdown = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        if (report.sourceType) {
          acc[report.sourceType] = (acc[report.sourceType] || 0) + 1;
        }
        return acc;
      },
      {} as Record<NonNullable<(typeof reports)[number]['sourceType']>, number>,
    );
  }, [reports]);

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-1 sm:px-4 lg:px-0">
          <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:h-14 sm:w-14">
                  <Newspaper className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Nyheter</h1>
                  <p className="mt-2 max-w-2xl text-base text-muted-foreground sm:text-lg">
                    Samlade AI-genererade rapporter och senaste höjdpunkterna från Discover i ett dedikerat nyhetsflöde.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-4 w-4" />
                AI-kuraterat flöde
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nytt senaste veckan</p>
                  <p className="text-2xl font-semibold text-foreground">{weeklyCount}</p>
                </div>
                <Clock3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Totalt i flödet</p>
                  <p className="text-2xl font-semibold text-foreground">{reports.length}</p>
                </div>
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Länkar & dokument</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {(sourceBreakdown.url ?? 0) + (sourceBreakdown.document ?? 0)}
                  </p>
                </div>
                <Share2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Textkällor</p>
                  <p className="text-2xl font-semibold text-foreground">{sourceBreakdown.text ?? 0}</p>
                </div>
                <Inbox className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Filter & flöde</p>
                <h2 className="text-xl font-semibold text-foreground">Forma nyhetsflödet efter behov</h2>
                <p className="text-sm text-muted-foreground">
                  Välj källtyp eller fokusera på de allra senaste rapporterna från Discover.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'text', 'url', 'document'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSourceFilter(type)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      sourceFilter === type
                        ? 'border-primary/70 bg-primary/10 text-primary'
                        : 'border-border/70 bg-background text-foreground'
                    }`}
                  >
                    {type === 'all' ? 'Alla källor' : type === 'text' ? 'Text' : type === 'url' ? 'Länkar' : 'Dokument'}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {type === 'all' ? reports.length : sourceBreakdown[type] ?? 0}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFreshOnly((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    freshOnly ? 'border-primary/70 bg-primary/10 text-primary' : 'border-border/70 bg-background text-foreground'
                  }`}
                >
                  <Clock3 className="h-4 w-4" />
                  Senaste 7 dagarna
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[{ title: 'Bevakningar & alerts', icon: Bell, description: 'Skapa bevakningar för bolag eller källtyper och få avisering när nytt publiceras.' },
                { title: 'Exportera & dela', icon: DownloadCloud, description: 'Exportera rapportlistor till CSV eller dela som länk med kollegor.' },
                { title: 'Nyhetsbrev', icon: Share2, description: 'Sammanfatta veckans AI-insikter i ett automatiskt utskick till teamet.' }].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="flex items-start gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4">
                      <div className="rounded-2xl bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">{card.title}</p>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                        <button className="text-sm font-semibold text-primary hover:underline" type="button">
                          Aktivera
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          <GeneratedReportsSection reports={filteredReports} isLoading={loading} />
        </div>
      </div>
    </Layout>
  );
};

export default News;
