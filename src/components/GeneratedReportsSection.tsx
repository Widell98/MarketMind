import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowUpRight, Calendar, LineChart, Sparkles, Link2, UploadCloud } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

import { GeneratedReport } from '@/types/generatedReport';

interface GeneratedReportsSectionProps {
  reports: GeneratedReport[];
  isLoading?: boolean;
}

type SourceTypeMeta = {
  label: string;
  icon: React.ElementType;
  accentClassName: string;
};

const sourceTypeMeta: Record<NonNullable<GeneratedReport['sourceType']>, SourceTypeMeta> = {
  text: {
    label: 'Textkälla',
    icon: FileText,
    accentClassName: 'border-amber-200/60 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  },
  url: {
    label: 'Länk',
    icon: Link2,
    accentClassName: 'border-sky-200/60 bg-sky-500/10 text-sky-900 dark:text-sky-100',
  },
  document: {
    label: 'Dokument',
    icon: UploadCloud,
    accentClassName: 'border-emerald-200/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
  },
};

const getSourceMeta = (sourceType?: GeneratedReport['sourceType']) => {
  if (!sourceType) return null;
  return sourceTypeMeta[sourceType];
};

const ReportSkeleton = () => (
  <Card className="h-full border-border/60 bg-background/70 shadow-sm">
    <CardHeader className="space-y-3 pb-0">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
    </CardHeader>
    <CardContent className="space-y-3 pt-4">
      <Skeleton className="h-4 w-24" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-10 rounded-2xl" />
    </CardContent>
  </Card>
);

const GeneratedReportsSection: React.FC<GeneratedReportsSectionProps> = ({ reports, isLoading = false }) => {
  const hasReports = reports.length > 0;
  const latestReportTime = hasReports
    ? formatDistanceToNow(
        new Date(
          reports.reduce((latest, current) => {
            const currentTime = new Date(current.createdAt).getTime();
            return currentTime > latest ? currentTime : latest;
          }, 0),
        ),
        { addSuffix: true, locale: sv },
      )
    : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.07),transparent_26%),radial-gradient(circle_at_20%_80%,rgba(52,211,153,0.06),transparent_26%)]" />
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
      </div>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shadow-sm sm:h-12 sm:w-12">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-insikter
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Rapportspaning</h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Senaste AI-genererade rapporterna med viktiga höjdpunkter.
            </p>
          </div>
        </div>

        {hasReports && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            {latestReportTime && (
              <div className="flex h-9 items-center rounded-full border border-border/70 bg-background/70 px-3 font-medium shadow-sm">
                Senast uppdaterad {latestReportTime}
              </div>
            )}
            <div className="flex h-9 items-center rounded-full border border-border/70 bg-background/70 px-3 font-semibold text-foreground shadow-sm">
              {reports.length} rapporter
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-5 grid gap-4 sm:mt-6 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => <ReportSkeleton key={`report-skeleton-${index}`} />)}

        {!isLoading &&
          hasReports &&
          reports.map((report) => {
            const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });
            const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 3);
            const previewKeyPoints = (report.keyPoints ?? []).slice(0, 2);
            const sourceMeta = getSourceMeta(report.sourceType);
            const SourceIcon = sourceMeta?.icon;

            return (
              <Dialog key={report.id}>
                <DialogTrigger asChild>
                  <Card className="group relative h-full cursor-pointer overflow-hidden border border-border/60 bg-background/80 shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition group-hover:opacity-100" />
                    <CardHeader className="relative z-10 space-y-3 pb-1">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle
                          className="line-clamp-2 text-base font-semibold leading-tight text-foreground sm:text-lg"
                          title={report.reportTitle}
                        >
                          {report.reportTitle}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide"
                        >
                          <Calendar className="h-3 w-3" />
                          {generatedAt}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                          {report.companyName}
                        </Badge>
                        {report.sourceDocumentName && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-dashed text-xs text-muted-foreground"
                            title={report.sourceDocumentName}
                          >
                            <span className="line-clamp-1">{report.sourceDocumentName}</span>
                          </Badge>
                        )}
                      </div>
                      {(sourceMeta || report.sourceType) && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          {sourceMeta && (
                            <Badge
                              variant="outline"
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold uppercase tracking-wide shadow-sm ${sourceMeta.accentClassName}`}
                            >
                              {SourceIcon && <SourceIcon className="h-3.5 w-3.5" />}
                              {sourceMeta.label}
                            </Badge>
                          )}
                          {!sourceMeta && report.sourceType && (
                            <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-1 text-[11px]">
                              {report.sourceType}
                            </Badge>
                          )}
                        </div>
                      )}
                      <p
                        className="line-clamp-3 text-sm leading-relaxed text-foreground/90"
                        title={report.summary}
                      >
                        {report.summary}
                      </p>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4 pt-3">
                      {highlightedMetrics.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <LineChart className="h-3.5 w-3.5" />
                            Nyckeltal i fokus
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {highlightedMetrics.map((metric, metricIndex) => (
                              <div
                                key={`${report.id}-preview-metric-${metricIndex}`}
                                className="rounded-2xl border border-border/60 bg-card/70 p-3 transition group-hover:border-primary/40"
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {metric.label}
                                </p>
                                <p className="text-base font-semibold text-foreground">{metric.value}</p>
                                {metric.trend && (
                                  <p className="line-clamp-2 text-xs text-muted-foreground" title={metric.trend}>
                                    {metric.trend}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {previewKeyPoints.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Snabbt summerat</p>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            {previewKeyPoints.map((point, keyIndex) => (
                              <li
                                key={`${report.id}-preview-point-${keyIndex}`}
                                className="rounded-xl bg-muted/30 px-3 py-2 text-foreground/80"
                              >
                                <span className="line-clamp-2" title={point}>
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-xs font-medium text-primary">
                        <span>Läs hela analysen</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border border-border/50 bg-card/95 p-0 shadow-2xl">
                  <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          AI-genererad analys
                        </div>
                        <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{report.reportTitle}</h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                            {report.companyName}
                          </Badge>
                          {report.sourceDocumentName && (
                            <Badge variant="outline" className="rounded-full border-dashed text-xs text-muted-foreground">
                              {report.sourceDocumentName}
                            </Badge>
                          )}
                          <Badge variant="outline" className="flex items-center gap-1 text-[11px] uppercase tracking-wide">
                            <Calendar className="h-3 w-3" />
                            {generatedAt}
                          </Badge>
                        </div>
                      </div>
                      {report.sourceUrl ? (
                        <Button variant="outline" asChild className="rounded-xl border-border/70 text-xs">
                          <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            Visa källa
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
                          Ingen källa angiven
                        </div>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="max-h-[70vh]">
                    <div className="space-y-8 px-6 pb-8 pt-6 text-sm leading-relaxed text-muted-foreground">
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Översikt</h3>
                        <p className="text-base text-foreground/90">{report.summary}</p>
                      </div>

                      {report.keyMetrics && report.keyMetrics.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <LineChart className="h-4 w-4" />
                            Viktiga siffror
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {report.keyMetrics.map((metric, metricIndex) => (
                              <div
                                key={`${report.id}-dialog-metric-${metricIndex}`}
                                className="rounded-2xl border border-border/60 bg-card/70 p-4"
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {metric.label}
                                </p>
                                <p className="text-xl font-semibold text-foreground">{metric.value}</p>
                                {metric.trend && (
                                  <p className="text-xs text-muted-foreground">{metric.trend}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {report.keyPoints && report.keyPoints.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Nyckelpunkter</h3>
                          <ul className="space-y-2 rounded-2xl bg-muted/20 p-4 text-foreground/90">
                            {report.keyPoints.map((point, keyIndex) => (
                              <li key={`${report.id}-dialog-point-${keyIndex}`} className="flex gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.ceoCommentary && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">VD:s ord</h3>
                          <blockquote className="rounded-3xl border border-primary/30 bg-primary/10 p-4 text-base italic text-foreground/90">
                            {report.ceoCommentary}
                          </blockquote>
                        </div>
                      )}

                      {report.sourceUrl && (
                        <div className="space-y-2">
                          <Separator className="bg-border/60" />
                          <p className="text-xs text-muted-foreground">
                            Källa:{' '}
                            <a
                              href={report.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              {report.sourceUrl}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            );
          })}

        {!isLoading && !hasReports && (
          <div className="md:col-span-2 xl:col-span-3">
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center shadow-inner">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Inga AI-rapporter ännu</h3>
                <p className="text-sm text-muted-foreground">
                  När nya analyser genereras dyker de upp här automatiskt.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GeneratedReportsSection;
