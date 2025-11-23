import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowUpRight, Calendar, Clock3, FileText, LineChart, Sparkles } from 'lucide-react';

import { DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { GeneratedReport } from '@/types/generatedReport';

interface ReportDetailDialogContentProps {
  report: GeneratedReport;
}

const ReportDetailDialogContent: React.FC<ReportDetailDialogContentProps> = ({ report }) => {
  const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });

  return (
    <DialogContent className="w-[min(100vw-1.5rem,1400px)] max-w-6xl overflow-hidden rounded-[28px] border border-border/50 bg-slate-50/90 p-0 shadow-2xl dark:bg-slate-950/90">
      <div className="relative overflow-hidden bg-card p-6 pb-5 sm:p-7 sm:pb-6 md:p-8 md:pb-6 dark:bg-slate-950">
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start lg:grid-cols-[1.2fr_auto]">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900">
                {report.companyLogoUrl && (
                  <AvatarImage src={report.companyLogoUrl} alt={report.companyName} className="object-cover" />
                )}
                <AvatarFallback className="bg-muted text-base font-semibold uppercase text-foreground">
                  {report.companyName?.[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-4">
                  <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI-genererad analys
                  </div>
                  {report.sourceDocumentName && (
                    <Badge variant="outline" className="rounded-full border-dashed text-[11px]">
                      {report.sourceDocumentName}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">{report.companyName}</span>
                </div>
                <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-[32px]">{report.reportTitle}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="rounded-full">
                    {report.companyName}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 rounded-full text-[11px] uppercase tracking-wide leading-4"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    {generatedAt}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {report.sourceUrl ? (
              <Button
                variant="outline"
                asChild
                className="w-full rounded-xl border-border/70 text-sm shadow-sm sm:w-auto"
              >
                <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Visa källa
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <div className="w-full rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground sm:w-auto">
                Ingen källa angiven
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-[75vh]">
        <div className="grid gap-6 bg-card px-4 pb-8 pt-6 sm:px-6 md:px-8 dark:bg-slate-950">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              {report.keyPoints && report.keyPoints.length > 0 && (
                <div className="rounded-2xl border bg-card p-5 shadow-sm dark:bg-slate-900/80">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-4">
                    <Calendar className="h-4 w-4" />
                    Nyckelpunkter
                  </div>
                  <ul className="mt-3 space-y-3 text-sm text-foreground/90">
                    {report.keyPoints.map((point, keyIndex) => (
                      <li key={`${report.id}-dialog-point-${keyIndex}`} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.ceoCommentary && (
                <div className="rounded-2xl border bg-card p-5 shadow-sm dark:border-primary/40">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">VD:s ord</h3>
                  <blockquote className="mt-2 text-base italic text-foreground/90">{report.ceoCommentary}</blockquote>
                </div>
              )}

              {report.sourceUrl && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Separator className="flex-1 bg-border/60" />
                  <span>Källa:</span>
                  <a
                    href={report.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {report.sourceUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border bg-card p-5 shadow-sm dark:bg-slate-900">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-4">Översikt</h3>
                <p className="mt-3 text-base leading-relaxed text-foreground/90">{report.summary}</p>
              </div>

              {report.keyMetrics && report.keyMetrics.length > 0 && (
                <div className="rounded-2xl border bg-card p-5 shadow-sm dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-4">
                    <span>Viktiga siffror</span>
                    <LineChart className="h-4 w-4" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {report.keyMetrics.map((metric, metricIndex) => (
                      <div
                        key={`${report.id}-dialog-metric-${metricIndex}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-xl border bg-card px-4 py-3 text-left"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-4 break-words">{metric.label}</div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground sm:text-xl">{metric.value}</p>
                          {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

export default ReportDetailDialogContent;
