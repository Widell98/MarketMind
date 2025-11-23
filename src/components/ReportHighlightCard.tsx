import React from 'react';
import { ArrowRight, LineChart } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import type { GeneratedReport } from '@/types/generatedReport';
import ReportDetailDialogContent from '@/components/ReportDetailDialogContent';

interface ReportHighlightCardProps {
  report: GeneratedReport;
}

const truncateText = (text: string, limit = 200) => {
  if (!text) return '';
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}…`;
};

const ReportHighlightCard: React.FC<ReportHighlightCardProps> = ({ report }) => {
  const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 3);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group relative h-full cursor-pointer overflow-hidden border border-border/60 bg-gradient-to-b from-white to-slate-50/60 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:from-slate-900 dark:to-slate-900/60">
          <div className="absolute inset-x-6 top-6 h-14 rounded-full bg-primary/5 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
          <CardContent className="relative flex h-full flex-col gap-5 p-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  {report.companyName}
                </Badge>
                {report.sourceDocumentName && (
                  <Badge variant="outline" className="rounded-full border-dashed text-[11px] text-muted-foreground">
                    {report.sourceDocumentName}
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-semibold leading-tight text-foreground">{report.reportTitle}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{truncateText(report.summary)}</p>
            </div>

            {highlightedMetrics.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-white/70 p-4 shadow-[0_6px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-slate-900/60">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <LineChart className="h-3.5 w-3.5" />
                  Nyckeltal
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  {highlightedMetrics.map((metric, index) => (
                    <div
                      key={`${report.id}-highlight-metric-${index}`}
                      className="flex flex-col gap-1 border-t pt-2 text-left sm:border-l sm:border-t-0 sm:pl-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                      <p className="text-lg font-semibold text-foreground sm:text-xl">{metric.value}</p>
                      {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium text-primary transition group-hover:border-primary/50 group-hover:text-primary">
              <span>Läs hela analysen</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <ReportDetailDialogContent report={report} />
    </Dialog>
  );
};

export default ReportHighlightCard;
