import React from 'react';
import { LineChart } from 'lucide-react';

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

const ReportHighlightCard: React.FC<ReportHighlightCardProps> = ({ report }) => {
  const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 2);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group h-full cursor-pointer border-border/60 bg-card/80 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
          <CardContent className="flex h-full flex-col gap-4 p-4">
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
              <h3 className="text-lg font-semibold text-foreground">{report.reportTitle}</h3>
              <p className="text-sm text-muted-foreground">{truncateText(report.summary)}</p>
            </div>

            {highlightedMetrics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">
                  <LineChart className="h-3.5 w-3.5" />
                  Nyckeltal
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {highlightedMetrics.map((metric, index) => (
                    <div
                      key={`${report.id}-highlight-metric-${index}`}
                      className="rounded-2xl border border-border/60 bg-muted/20 p-3 transition group-hover:border-primary/40"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">{metric.label}</p>
                      <p className="text-base font-semibold text-foreground">{metric.value}</p>
                      {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto rounded-2xl border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-xs font-medium text-primary">
              Klicka för att läsa hela analysen
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <ReportDetailDialogContent report={report} />
    </Dialog>
  );
};

export default ReportHighlightCard;
