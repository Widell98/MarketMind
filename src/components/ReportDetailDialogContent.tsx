import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowUpRight, Calendar, Clock3, FileText, LineChart, Sparkles } from 'lucide-react';

import { DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { GeneratedReport } from '@/types/generatedReport';

interface ReportDetailDialogContentProps {
  report: GeneratedReport;
}

const ReportDetailDialogContent: React.FC<ReportDetailDialogContentProps> = ({ report }) => {
  const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });

  return (
    <DialogContent className="max-w-5xl overflow-hidden rounded-[28px] border border-border/50 bg-slate-50/90 p-0 shadow-2xl dark:bg-slate-950/90">
      <div className="relative bg-white p-8 pb-6 dark:bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-primary/3 to-transparent dark:from-primary/15 dark:via-primary/10" />
        <div className="relative grid gap-6 md:grid-cols-[1.2fr_auto] md:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI-genererad analys
              </div>
              {report.sourceDocumentName && (
                <Badge variant="outline" className="rounded-full border-dashed text-[11px] text-muted-foreground">
                  {report.sourceDocumentName}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-sm text-primary">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">{report.companyName}</span>
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-[32px]">{report.reportTitle}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  {report.companyName}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 rounded-full text-[11px] uppercase tracking-wide">
                  <Clock3 className="h-3.5 w-3.5" />
                  {generatedAt}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            {report.sourceUrl ? (
              <Button variant="outline" asChild className="rounded-xl border-border/70 text-sm shadow-sm">
                <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Visa källa
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
                Ingen källa angiven
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-[70vh]">
        <div className="grid gap-6 bg-slate-50 px-6 pb-8 pt-6 dark:bg-slate-950">
          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              {report.keyPoints && report.keyPoints.length > 0 && (
                <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 shadow-sm dark:border-primary/40 dark:bg-primary/10">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-primary/90">VD:s ord</h3>
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
              <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-slate-900">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Översikt</h3>
                <p className="mt-3 text-base leading-relaxed text-foreground/90">{report.summary}</p>
              </div>

              {report.keyMetrics && report.keyMetrics.length > 0 && (
                <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:bg-slate-900">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Viktiga siffror</span>
                    <LineChart className="h-4 w-4" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {report.keyMetrics.map((metric, metricIndex) => (
                      <div
                        key={`${report.id}-dialog-metric-${metricIndex}`}
                        className="flex items-start justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-left"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</div>
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
