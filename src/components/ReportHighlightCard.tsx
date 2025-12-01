import React, { useEffect, useState } from 'react';
import { Calendar, FileText, LineChart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

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
  const companyInitial = report.companyName?.charAt(0).toUpperCase() || '?';
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => setLogoFailed(false), [report.companyLogoUrl]);
  const companyLogoUrl = logoFailed ? null : report.companyLogoUrl ?? null;
  const createdAtLabel = formatDistanceToNow(new Date(report.createdAt), {
    addSuffix: true,
    locale: sv,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group h-full cursor-pointer overflow-hidden border-border/70 bg-card/90 shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="flex gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-primary/5 to-muted">
                {companyLogoUrl ? (
                  <img
                    src={companyLogoUrl}
                    alt={`${report.companyName} logotyp`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-semibold text-primary">
                    {companyInitial}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/60" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {report.companyName}
                  </Badge>
                  {report.sourceDocumentName && (
                    <Badge variant="outline" className="rounded-full border-dashed px-3 py-1 text-[11px] text-muted-foreground">
                      {report.sourceDocumentName}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground">{report.reportTitle}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{truncateText(report.summary, 180)}</p>
              </div>
            </div>

            <div className="space-y-3">
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

              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 font-medium text-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {report.keyPoints.length} punkter
                </div>
                <div className="flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 font-medium text-foreground">
                  <LineChart className="h-3.5 w-3.5" />
                  {report.keyMetrics.length} nyckeltal
                </div>
                <div className="flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  {createdAtLabel}
                </div>
              </div>
            </div>

            <div className="mt-auto rounded-xl border border-dashed border-border/70 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
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
