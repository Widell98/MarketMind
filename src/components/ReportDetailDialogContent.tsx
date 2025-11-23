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
import { cn } from '@/lib/utils';
import { getReportBrandTheme } from '@/lib/reportBrandTheme';
import type { GeneratedReport } from '@/types/generatedReport';

interface ReportDetailDialogContentProps {
  report: GeneratedReport;
}

const ReportDetailDialogContent: React.FC<ReportDetailDialogContentProps> = ({ report }) => {
  const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });
  const theme = getReportBrandTheme(report.companyName);

  return (
    <DialogContent className="max-w-5xl overflow-hidden rounded-[28px] border border-border/50 bg-slate-50/90 p-0 shadow-2xl dark:bg-slate-950/90">
      <div
        className={cn(
          'relative overflow-hidden p-8 pb-6',
          `bg-gradient-to-r ${theme.headerGradient}`,
          'dark:bg-slate-950'
        )}
      >
        <div className={cn('absolute inset-x-4 inset-y-0 rounded-[28px] opacity-80', `bg-gradient-to-r ${theme.glow}`)} />
        <div className="relative grid gap-6 md:grid-cols-[1.2fr_auto] md:items-start">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className={cn('h-14 w-14 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900', theme.logoRing)}>
                {report.companyLogoUrl && (
                  <AvatarImage src={report.companyLogoUrl} alt={report.companyName} className="object-cover" />
                )}
                <AvatarFallback className={cn('bg-gradient-to-br text-base font-semibold uppercase text-white', theme.logoGradient)}>
                  {report.companyName?.[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <div className={cn('flex items-center gap-1 rounded-full px-3 py-1', theme.chipBg)}>
                    <Sparkles className="h-3.5 w-3.5" />
                    AI-genererad analys
                  </div>
                  {report.sourceDocumentName && (
                    <Badge variant="outline" className={cn('rounded-full border-dashed text-[11px]', theme.chipBorder)}>
                      {report.sourceDocumentName}
                    </Badge>
                  )}
                </div>
                <div className={cn('flex flex-wrap items-center gap-2 text-sm', theme.accentText)}>
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">{report.companyName}</span>
                </div>
                <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-[32px]">{report.reportTitle}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className={cn('rounded-full', theme.badgeBg)}>
                    {report.companyName}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 rounded-full text-[11px] uppercase tracking-wide">
                    <Clock3 className="h-3.5 w-3.5" />
                    {generatedAt}
                  </Badge>
                </div>
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
        <div className="grid gap-6 bg-gradient-to-b from-white via-slate-50 to-white px-6 pb-8 pt-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              {report.keyPoints && report.keyPoints.length > 0 && (
                <div className={cn('rounded-2xl border p-5 shadow-sm', theme.panelBorder, theme.mutedPanel, 'dark:bg-slate-900/80')}>
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
                <div className={cn('rounded-2xl border p-5 shadow-sm', theme.panelBorder, theme.mutedPanel, 'dark:border-primary/40')}>
                  <h3 className={cn('text-xs font-semibold uppercase tracking-wide', theme.accentText)}>VD:s ord</h3>
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
              <div className={cn('rounded-2xl border p-5 shadow-sm', theme.panelBorder, 'bg-white/90 dark:bg-slate-900')}>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Översikt</h3>
                <p className="mt-3 text-base leading-relaxed text-foreground/90">{report.summary}</p>
              </div>

              {report.keyMetrics && report.keyMetrics.length > 0 && (
                <div className={cn('rounded-2xl border p-5 shadow-sm', theme.panelBorder, 'bg-white/90 dark:bg-slate-900')}>
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Viktiga siffror</span>
                    <LineChart className="h-4 w-4" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {report.keyMetrics.map((metric, metricIndex) => (
                      <div
                        key={`${report.id}-dialog-metric-${metricIndex}`}
                        className={cn(
                          'flex items-start justify-between rounded-xl border px-4 py-3 text-left',
                          theme.metricBorder,
                          theme.mutedPanel
                        )}
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
