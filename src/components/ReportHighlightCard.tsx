import React from 'react';
import { ArrowRight, LineChart } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        <Card
          className="group relative h-full cursor-pointer overflow-hidden border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <CardContent className="relative grid h-full grid-rows-[auto,1fr,auto] gap-5 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900">
                {report.companyLogoUrl && (
                  <AvatarImage src={report.companyLogoUrl} alt={report.companyName} className="object-cover" />
                )}
                <AvatarFallback className="bg-muted text-sm font-semibold uppercase text-foreground">
                  {report.companyName?.[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="rounded-full">
                    {report.companyName}
                  </Badge>
                  {report.sourceDocumentName && (
                    <Badge variant="outline" className="rounded-full border-dashed text-[11px]">
                      {report.sourceDocumentName}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold leading-tight text-foreground">{report.reportTitle}</h3>
                <p className="min-h-[3.75rem] text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {truncateText(report.summary)}
                </p>
              </div>
            </div>

            {highlightedMetrics.length > 0 && (
              <div className="rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <LineChart className="h-3.5 w-3.5" />
                  Nyckeltal
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {highlightedMetrics.map((metric, index) => (
                    <div
                      key={`${report.id}-highlight-metric-${index}`}
                      className="flex h-full flex-col gap-1 border-t pt-2 text-left sm:border-l sm:border-t-0 sm:pl-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-4 break-words">
                        {metric.label}
                      </p>
                      <p className="text-lg font-semibold text-foreground sm:text-xl">{metric.value}</p>
                      {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border bg-card/80 px-4 py-3 text-sm font-medium text-primary transition group-hover:border-primary/50 group-hover:text-primary sm:px-5">
              <span className="flex items-center gap-2 font-semibold">
                <span>Läs hela analysen</span>
              </span>
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
