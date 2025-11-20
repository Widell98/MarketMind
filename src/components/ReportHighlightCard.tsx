import React from 'react';
import { ArrowUpRight, Clock, LineChart } from 'lucide-react';

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
        <Card className="group h-full cursor-pointer border border-border/60 bg-gradient-to-b from-finance-navy/5 via-background to-primary/10 shadow-[0_10px_38px_-28px_rgba(10,38,71,0.55)] transition hover:-translate-y-1 hover:border-finance-navy/40 hover:shadow-lg">
          <CardContent className="flex h-full flex-col gap-4 p-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Badge variant="secondary" className="rounded-full border border-finance-navy/10 bg-finance-navy/10 text-finance-navy shadow-sm">
                  {report.companyName}
                </Badge>
                {report.sourceDocumentName && (
                  <Badge variant="outline" className="rounded-full border-finance-navy/25 bg-finance-navy/5 text-[11px] text-finance-navy">
                    {report.sourceDocumentName}
                  </Badge>
                )}
                {report.createdAt && (
                  <Badge variant="outline" className="flex items-center gap-1 rounded-full border-finance-navy/25 bg-finance-navy/5 text-[11px] text-finance-navy">
                    <Clock className="h-3 w-3" />
                    {new Date(report.createdAt).toLocaleDateString('sv-SE')}
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-finance-navy">{report.reportTitle}</h3>
              <p className="text-sm text-muted-foreground">{truncateText(report.summary)}</p>
            </div>

            {highlightedMetrics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <LineChart className="h-3.5 w-3.5" />
                  Nyckeltal
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {highlightedMetrics.map((metric, index) => (
                    <div
                      key={`${report.id}-highlight-metric-${index}`}
                      className="rounded-2xl border border-border/60 bg-gradient-to-br from-finance-navy/5 via-primary/5 to-background p-3 transition group-hover:border-finance-navy/40 group-hover:bg-finance-navy/10 group-hover:shadow-sm"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                      <p className="text-base font-semibold text-foreground">{metric.value}</p>
                      {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto flex items-center justify-between rounded-2xl border border-finance-navy/30 bg-finance-navy/10 px-3 py-2 text-sm font-semibold text-finance-navy transition group-hover:border-finance-navy group-hover:bg-finance-navy/15">
              <span>Öppna rapport</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <ReportDetailDialogContent report={report} />
    </Dialog>
  );
};

export default ReportHighlightCard;
