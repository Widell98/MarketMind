import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowUpRight, Calendar, FileText, LineChart, Sparkles } from 'lucide-react';

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
    <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-finance-navy/6 via-card/95 to-background p-0 shadow-2xl">
      <div className="relative border-b border-border/60 bg-gradient-to-br from-finance-navy/12 via-primary/10 to-transparent p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Kuraterad rapport
            </div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{report.reportTitle}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full border border-finance-navy/15 bg-finance-navy/10 text-finance-navy shadow-sm">
                {report.companyName}
              </Badge>
              {report.sourceDocumentName && (
                <Badge variant="outline" className="rounded-full border-finance-navy/25 bg-finance-navy/5 text-xs text-finance-navy">
                  {report.sourceDocumentName}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1 rounded-full border-finance-navy/25 bg-finance-navy/10 text-[11px] uppercase tracking-wide text-finance-navy">
                <Calendar className="h-3 w-3" />
                {generatedAt}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 rounded-full bg-finance-navy/10 text-[11px] font-semibold text-finance-navy">
                <Sparkles className="h-3 w-3 text-finance-navy" />
                Publicerad av MarketMind-teamet
              </Badge>
            </div>
          </div>
          {report.sourceUrl ? (
            <Button variant="outline" asChild className="rounded-xl border-finance-navy/40 text-xs text-finance-navy hover:bg-finance-navy/10">
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
            <p className="text-base font-medium leading-relaxed text-foreground">{report.summary}</p>
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
                    className="rounded-2xl border border-border/60 bg-gradient-to-br from-finance-navy/6 via-primary/5 to-background p-3 shadow-sm"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                    <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                    {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
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

          <div className="space-y-2">
            <Separator className="bg-border/60" />
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground/80">Publicerad av MarketMind-teamet</p>
              {report.sourceUrl ? (
                <p className="text-muted-foreground">
                  Källa:{' '}
                  <a href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {report.sourceUrl}
                  </a>
                </p>
              ) : (
                <p className="text-muted-foreground">Ingen extern källa angiven</p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

export default ReportDetailDialogContent;
