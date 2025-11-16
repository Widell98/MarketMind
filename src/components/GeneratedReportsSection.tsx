import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
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
    <section className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-950/85 via-slate-950/70 to-sky-900/80 p-4 shadow-lg supports-[backdrop-filter]:backdrop-blur-lg sm:p-6">
      <div className="mb-4 flex items-center gap-2 text-sky-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15">
          <FileText className="h-5 w-5 text-sky-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Rapportspaning</h2>
          <p className="text-xs text-sky-100/80 sm:text-sm">
            Senaste AI-genererade rapporterna med viktiga höjdpunkter.
          </p>
        </div>
      </div>

      <Carousel opts={{ align: 'start', dragFree: true, slidesToScroll: 1 }}>
        <CarouselContent className="-ml-3 sm:-ml-4">
          {reports.map((report) => {
            const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });
            const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 3);
            const previewKeyPoints = (report.keyPoints ?? []).slice(0, 2);

            return (
              <CarouselItem key={report.id} className="basis-full pl-3 sm:basis-1/2 sm:pl-4 xl:basis-1/3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="group relative h-full cursor-pointer overflow-hidden border border-sky-400/30 bg-slate-950/70 shadow-md transition hover:-translate-y-1 hover:border-sky-300/60 hover:shadow-xl">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-400/15 via-transparent to-sky-500/20 opacity-0 transition group-hover:opacity-100" />
                      <CardHeader className="relative z-10 space-y-3 pb-0 text-sky-50">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-semibold leading-tight sm:text-lg">
                            {report.reportTitle}
                          </CardTitle>
                          <Badge variant="outline" className="flex items-center gap-1 border-sky-400/40 bg-sky-400/10 text-[11px] font-medium uppercase tracking-wide text-sky-100">
                            <Calendar className="h-3 w-3" />
                            {generatedAt}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="secondary" className="rounded-full border-0 bg-sky-500/25 text-sky-50">
                            {report.companyName}
                          </Badge>
                          {report.sourceDocumentName && (
                            <Badge variant="outline" className="rounded-full border-sky-400/40 text-xs text-sky-100/80">
                              {report.sourceDocumentName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-sky-100/85">
                          {truncateText(report.summary)}
                        </p>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-4 pt-4 text-sky-100/80">
                        {highlightedMetrics.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-sky-200/70">
                              <LineChart className="h-3.5 w-3.5 text-sky-300" />
                              Nyckeltal i fokus
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {highlightedMetrics.map((metric, metricIndex) => (
                                <div
                                  key={`${report.id}-preview-metric-${metricIndex}`}
                                  className="rounded-2xl border border-sky-400/30 bg-slate-900/70 p-3 transition group-hover:border-sky-300/60"
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/70">
                                    {metric.label}
                                  </p>
                                  <p className="text-base font-semibold text-white">{metric.value}</p>
                                  {metric.trend && (
                                    <p className="text-xs text-sky-100/70">{metric.trend}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {previewKeyPoints.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/70">Snabbt summerat</p>
                            <ul className="space-y-1.5 text-sm text-sky-100/85">
                              {previewKeyPoints.map((point, keyIndex) => (
                                <li
                                  key={`${report.id}-preview-point-${keyIndex}`}
                                  className="rounded-xl bg-slate-900/70 px-3 py-2 text-sky-50/90"
                                >
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-between rounded-2xl border border-dashed border-sky-400/40 bg-slate-900/70 px-3 py-2 text-xs font-medium text-sky-100">
                          <span>Läs hela analysen</span>
                          <ArrowUpRight className="h-4 w-4 text-sky-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border border-sky-500/25 bg-slate-950/95 p-0 shadow-2xl">
                    <div className="relative border-b border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-sky-200/70">
                            <FileText className="h-3.5 w-3.5 text-sky-300" />
                            AI-genererad analys
                          </div>
                          <h2 className="text-2xl font-semibold text-sky-50 sm:text-3xl">{report.reportTitle}</h2>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-sky-100/80">
                            <Badge variant="secondary" className="rounded-full border-0 bg-sky-500/25 text-sky-50">
                              {report.companyName}
                            </Badge>
                            {report.sourceDocumentName && (
                              <Badge variant="outline" className="rounded-full border-sky-400/40 text-xs text-sky-100/80">
                                {report.sourceDocumentName}
                              </Badge>
                            )}
                            <Badge variant="outline" className="flex items-center gap-1 border-sky-400/40 bg-sky-400/10 text-[11px] uppercase tracking-wide text-sky-100">
                              <Calendar className="h-3 w-3" />
                              {generatedAt}
                            </Badge>
                          </div>
                        </div>
                        {report.sourceUrl ? (
                          <Button variant="outline" asChild className="rounded-xl border-sky-400/40 bg-slate-900/70 text-xs text-sky-100">
                            <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              Visa källa
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : (
                          <div className="rounded-xl border border-dashed border-sky-500/30 px-3 py-2 text-xs text-sky-200/70">
                            Ingen källa angiven
                          </div>
                        )}
                      </div>
                    </div>

                    <ScrollArea className="max-h-[70vh]">
                      <div className="space-y-8 px-6 pb-8 pt-6 text-sm leading-relaxed text-sky-100/80">
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-200/70">Översikt</h3>
                          <p className="text-base text-sky-50/90">{report.summary}</p>
                        </div>

                        {report.keyMetrics && report.keyMetrics.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-200/70">
                              <LineChart className="h-4 w-4 text-sky-300" />
                              Viktiga siffror
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {report.keyMetrics.map((metric, metricIndex) => (
                                <div
                                  key={`${report.id}-dialog-metric-${metricIndex}`}
                                  className="rounded-2xl border border-sky-500/30 bg-slate-900/70 p-4"
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/70">
                                    {metric.label}
                                  </p>
                                  <p className="text-xl font-semibold text-white">{metric.value}</p>
                                  {metric.trend && (
                                    <p className="text-xs text-sky-100/70">{metric.trend}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {report.keyPoints && report.keyPoints.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-200/70">Nyckelpunkter</h3>
                            <ul className="space-y-2 rounded-2xl bg-slate-900/70 p-4 text-sky-50/90">
                              {report.keyPoints.map((point, keyIndex) => (
                                <li key={`${report.id}-dialog-point-${keyIndex}`} className="flex gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {report.ceoCommentary && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-200/70">VD:s ord</h3>
                            <blockquote className="rounded-3xl border border-sky-500/30 bg-sky-500/10 p-4 text-base italic text-sky-50/90">
                              {report.ceoCommentary}
                            </blockquote>
                          </div>
                        )}

                        {report.sourceUrl && (
                          <div className="space-y-2">
                            <Separator className="bg-sky-500/30" />
                            <p className="text-xs text-sky-200/70">
                              Källa:{' '}
                              <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-200 hover:text-sky-100 hover:underline">
                                {report.sourceUrl}
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex border border-sky-500/40 bg-slate-900/80 text-sky-100 hover:border-sky-300/60 hover:text-white" />
        <CarouselNext className="hidden md:flex border border-sky-500/40 bg-slate-900/80 text-sky-100 hover:border-sky-300/60 hover:text-white" />
      </Carousel>
    </section>
  );
};

export default GeneratedReportsSection;
