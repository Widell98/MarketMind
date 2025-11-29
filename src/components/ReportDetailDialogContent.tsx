import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  FileText,
  LineChart,
  ListChecks,
  Sparkles,
  Timer,
} from 'lucide-react';

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
  const sourceLabel =
    report.sourceDocumentName ||
    (report.sourceType === 'url'
      ? 'URL-källa'
      : report.sourceType === 'document'
        ? 'Uppladdat dokument'
        : 'AI-underlag');

  return (
    <DialogContent className="max-w-5xl overflow-hidden rounded-[32px] border border-border/50 bg-card/95 p-0 shadow-2xl">
      <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-transparent px-6 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">
              <span className="flex h-2 w-2 items-center justify-center rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.15)]" />
              AI-genererad analys
              <Badge variant="outline" className="ml-1 rounded-full border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                Analys genererad från tillgängliga källor
              </Badge>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">{report.reportTitle}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700">
                  {report.companyName}
                </Badge>
                {sourceLabel && (
                  <Badge variant="outline" className="rounded-full border-dashed text-[11px] text-muted-foreground">
                    {sourceLabel}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1 text-[11px] uppercase tracking-wide">
                  <Calendar className="h-3 w-3" />
                  {generatedAt}
                </Badge>
              </div>
            </div>
          </div>

          {report.sourceUrl ? (
            <Button variant="outline" asChild className="h-10 rounded-xl border-border/70 text-xs font-semibold">
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

      <ScrollArea className="max-h-[75vh]">
        <div className="grid gap-6 px-6 pb-8 pt-6 text-sm leading-relaxed text-muted-foreground lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <section id="overview" className="space-y-4 rounded-2xl border border-border/70 bg-white/60 p-5 shadow-sm backdrop-blur-sm dark:bg-card/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  Översikt
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                  {generatedAt}
                </div>
              </div>
              <p className="text-base leading-relaxed text-foreground/90">{report.summary}</p>
            </section>

            {report.keyMetrics && report.keyMetrics.length > 0 && (
              <section id="metrics" className="space-y-4 rounded-2xl border border-border/70 bg-white/60 p-5 shadow-sm backdrop-blur-sm dark:bg-card/70">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <LineChart className="h-4 w-4 text-blue-500" />
                    Viktiga siffror
                  </div>
                  <Badge variant="outline" className="rounded-full border-blue-100 bg-blue-50 text-[11px] font-semibold text-blue-700">
                    Nyckeltal
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {report.keyMetrics.map((metric, metricIndex) => (
                    <div
                      key={`${report.id}-dialog-metric-${metricIndex}`}
                      className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">
                        {metric.label}
                      </p>
                      <p className="text-xl font-semibold text-foreground">{metric.value}</p>
                      {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {report.keyPoints && report.keyPoints.length > 0 && (
              <section id="keypoints" className="space-y-4 rounded-2xl border border-border/70 bg-white/60 p-5 shadow-sm backdrop-blur-sm dark:bg-card/70">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Nyckelpunkter
                </div>
                <div className="space-y-3">
                  {report.keyPoints.map((point, keyIndex) => (
                    <div
                      key={`${report.id}-dialog-point-${keyIndex}`}
                      className="flex items-start gap-3 rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-foreground/90">{point}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {report.ceoCommentary && (
              <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm backdrop-blur-sm dark:border-amber-300/60 dark:bg-amber-100/10">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                  <FileText className="h-4 w-4" />
                  VD:s ord
                </div>
                <blockquote className="text-base italic text-foreground/90">{report.ceoCommentary}</blockquote>
              </section>
            )}

            {report.sourceUrl && (
              <section className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-4">
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
              </section>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Översikt</p>
            <div className="space-y-1 text-sm text-foreground/80">
              <a href="#overview" className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-muted/60">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Översikt
              </a>
              {report.keyMetrics && report.keyMetrics.length > 0 && (
                <a href="#metrics" className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-muted/60">
                  <LineChart className="h-4 w-4 text-blue-500" />
                  Viktiga siffror
                </a>
              )}
              {report.keyPoints && report.keyPoints.length > 0 && (
                <a href="#keypoints" className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-muted/60">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Nyckelpunkter
                </a>
              )}
            </div>

            <Separator className="bg-border/70" />

            <div className="space-y-3 rounded-xl bg-white/60 p-3 shadow-sm dark:bg-card/70">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="h-4 w-4" />
                Rapportdata
              </div>
              <div className="space-y-2 text-sm text-foreground/90">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  {sourceLabel}
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-amber-500" />
                  Uppdaterad {generatedAt}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

export default ReportDetailDialogContent;
