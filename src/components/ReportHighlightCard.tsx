import React from 'react';
import { ArrowRight, Calendar, LineChart } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import type { GeneratedReport } from '@/types/generatedReport';
import ReportDetailDialogContent from '@/components/ReportDetailDialogContent';

interface ReportHighlightCardProps {
  report: GeneratedReport;
}

const truncateText = (text: string, limit = 160) => {
  if (!text) return '';
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}…`;
};

const formatDate = (isoString?: string) => {
  if (!isoString) return '';

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const ReportHighlightCard: React.FC<ReportHighlightCardProps> = ({ report }) => {
  const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 3);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group h-full cursor-pointer overflow-hidden border border-border/60 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl dark:bg-card/90">
          <CardContent className="flex h-full flex-col gap-6 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Badge variant="secondary" className="rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                    {report.companyName}
                  </Badge>
                  {report.sourceDocumentName && (
                    <Badge variant="outline" className="rounded-full border-dashed text-[11px] text-muted-foreground">
                      {report.sourceDocumentName}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold leading-snug text-foreground">{report.reportTitle}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{truncateText(report.summary, 200)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(report.createdAt) || 'Aktuell rapport'}
              </div>
            </div>

            {highlightedMetrics.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">
                  <LineChart className="h-3.5 w-3.5" />
                  Nyckeltal
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {highlightedMetrics.map((metric, index) => (
                    <div
                      key={`${report.id}-highlight-metric-${index}`}
                      className="rounded-2xl border border-border/60 bg-muted/15 p-3 transition group-hover:border-primary/40"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">{metric.label}</p>
                      <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                      {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-3 text-sm font-medium text-primary">
              <span>Klicka för att läsa hela analysen</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <ReportDetailDialogContent report={report} />
    </Dialog>
  );
};

export default ReportHighlightCard;
