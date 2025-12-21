import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowUpRight, Calendar, FileText, LineChart } from 'lucide-react';

import { DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { GeneratedReport } from '@/types/generatedReport';
import { extractKeyDriver } from '@/utils/reportDataExtractor';

interface ReportDetailDialogContentProps {
  report: GeneratedReport;
}

const ReportDetailDialogContent: React.FC<ReportDetailDialogContentProps> = ({ report }) => {
  const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });
  const keyDriver = extractKeyDriver(report);

  return (
    <DialogContent className="w-[95vw] max-w-2xl m-2 sm:m-4 md:m-6 overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-border/50 bg-card p-0 shadow-2xl">
      <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-4 sm:p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">
              <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              AI-genererad analys
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground break-words">{report.reportTitle}</h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs px-2 py-0.5">
                {report.companyName}
              </Badge>
              {report.sourceDocumentName && (
                <Badge variant="outline" className="rounded-full border-dashed text-[10px] sm:text-xs text-muted-foreground px-2 py-0.5">
                  {report.sourceDocumentName}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1 text-[10px] sm:text-[11px] uppercase tracking-wide px-2 py-0.5">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                {generatedAt}
              </Badge>
            </div>
          </div>
          {report.sourceUrl ? (
            <Button variant="outline" asChild className="rounded-lg sm:rounded-xl border-border/70 text-[10px] sm:text-xs w-full sm:w-auto shrink-0">
              <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                Visa källa
                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </a>
            </Button>
          ) : (
            <div className="rounded-lg sm:rounded-xl border border-dashed border-border/60 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs text-muted-foreground w-full sm:w-auto text-center sm:text-left">
              Ingen källa angiven
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh]">
        <div className="space-y-6 sm:space-y-7 md:space-y-8 px-4 sm:px-5 md:px-6 pb-6 sm:pb-7 md:pb-8 pt-4 sm:pt-5 md:pt-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Översikt</h3>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">{report.summary}</p>
          </div>

          {report.keyMetrics && report.keyMetrics.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <LineChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Viktiga siffror
              </div>
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                {report.keyMetrics.map((metric, metricIndex) => (
                  <div key={`${report.id}-dialog-metric-${metricIndex}`} className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/70 p-3 sm:p-4">
                    <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight mb-1">{metric.label}</p>
                    <p className="text-lg sm:text-xl font-semibold text-foreground break-words">{metric.value}</p>
                    {metric.trend && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{metric.trend}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.keyPoints && report.keyPoints.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Nyckelpunkter</h3>
              <ul className="space-y-1.5 sm:space-y-2 rounded-xl sm:rounded-2xl bg-muted/20 p-3 sm:p-4 text-sm sm:text-base text-foreground/90">
                {report.keyPoints.map((point, keyIndex) => (
                  <li key={`${report.id}-dialog-point-${keyIndex}`} className="flex gap-2">
                    <span className="mt-1.5 sm:mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="break-words">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {keyDriver && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Huvuddriver</h3>
              <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/70 p-3 sm:p-4 text-sm sm:text-base text-foreground/90 leading-relaxed">
                {keyDriver}
              </div>
            </div>
          )}

          {report.ceoCommentary && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">VD:s ord</h3>
              <blockquote className="rounded-2xl sm:rounded-3xl border border-primary/30 bg-primary/10 p-3 sm:p-4 text-sm sm:text-base italic text-foreground/90 leading-relaxed">
                {report.ceoCommentary}
              </blockquote>
            </div>
          )}

          {report.sourceUrl && (
            <div className="space-y-2">
              <Separator className="bg-border/60" />
              <p className="text-[10px] sm:text-xs text-muted-foreground break-all">
                Källa:{' '}
                <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all">
                  {report.sourceUrl}
                </a>
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

export default ReportDetailDialogContent;
