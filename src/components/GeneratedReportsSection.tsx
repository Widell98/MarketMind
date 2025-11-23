import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUpRight, Calendar, LineChart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

import { GeneratedReport } from '@/types/generatedReport';
import ReportDetailDialogContent from '@/components/ReportDetailDialogContent';

interface GeneratedReportsSectionProps {
  reports: GeneratedReport[];
}

const truncateText = (text: string, limit = 240) => {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}…`;
};

const GeneratedReportsSection: React.FC<GeneratedReportsSectionProps> = ({ reports }) => {
  if (!reports.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((report) => {
          const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });
          const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 3);
          const previewKeyPoints = (report.keyPoints ?? []).slice(0, 2);

          return (
            <Dialog key={report.id}>
              <DialogTrigger asChild>
                <Card className="group relative h-full cursor-pointer overflow-hidden border border-border/50 bg-background/70 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition group-hover:opacity-100" />
                  <CardHeader className="relative z-10 space-y-4 pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold leading-tight sm:text-lg">
                        {report.reportTitle}
                      </CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide">
                        <Calendar className="h-3 w-3" />
                        {generatedAt}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                        {report.companyName}
                      </Badge>
                      {report.sourceDocumentName && (
                        <Badge variant="outline" className="rounded-full border-dashed text-xs text-muted-foreground">
                          {report.sourceDocumentName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {truncateText(report.summary)}
                    </p>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4 pt-4">
                    {highlightedMetrics.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">
                          <LineChart className="h-3.5 w-3.5" />
                          Nyckeltal i fokus
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {highlightedMetrics.map((metric, metricIndex) => (
                            <div
                              key={`${report.id}-preview-metric-${metricIndex}`}
                              className="rounded-2xl border border-border/60 bg-card/70 p-3 transition group-hover:border-primary/40"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">
                                {metric.label}
                              </p>
                              <p className="text-base font-semibold text-foreground">{metric.value}</p>
                              {metric.trend && (
                                <p className="text-xs text-muted-foreground">{metric.trend}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewKeyPoints.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-normal break-words leading-tight">Snabbt summerat</p>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          {previewKeyPoints.map((point, keyIndex) => (
                            <li
                              key={`${report.id}-preview-point-${keyIndex}`}
                              className="rounded-xl bg-muted/30 px-3 py-2 text-foreground/80"
                            >
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-xs font-medium text-primary">
                      <span>Läs hela analysen</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <ReportDetailDialogContent report={report} />
            </Dialog>
          );
        })}
      </div>
    </section>
  );
};

export default GeneratedReportsSection;
