import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ArrowUpRight, Calendar, LineChart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

import { GeneratedReport } from '@/types/generatedReport';

interface GeneratedReportsSectionProps {
  reports: GeneratedReport[];
}

const truncateText = (text: string, limit = 240) => {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}…`;
};

const GeneratedReportsSection: React.FC<GeneratedReportsSectionProps> = ({ reports }) => {
  if (!reports.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Rapportspaning</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Senaste AI-genererade rapporterna med viktiga höjdpunkter.
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((report) => {
          const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });
          const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 3);
          const previewKeyPoints = (report.keyPoints ?? []).slice(0, 2);

          return (
            <Dialog key={report.id}>
              <DialogTrigger asChild>
                <Card className="group relative h-full cursor-pointer overflow-hidden border border-border/50 bg-background/70 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition group-hover:opacity-100" />
                  <CardHeader className="relative z-10 space-y-4 pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold leading-tight sm:text-lg">
                        {report.reportTitle}
                      </CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide">
                        <Calendar className="h-3 w-3" />
                        {generatedAt}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                        {report.companyName}
                      </Badge>
                      {report.sourceDocumentName && (
                        <Badge variant="outline" className="rounded-full border-dashed text-xs text-muted-foreground">
                          {report.sourceDocumentName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {truncateText(report.summary)}
                    </p>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4 pt-4">
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
                                <p className="text-xs text-muted-foreground">{metric.trend}</p>
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
                              {point}
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
                      <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{report.reportTitle}</h2>
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
                          Källa: <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{report.sourceUrl}</a>
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </section>
  );
};

export default GeneratedReportsSection;
