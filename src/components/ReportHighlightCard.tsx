import React, { useEffect, useState } from 'react';
import { BadgeCheck, Calendar, FileText, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
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

const truncateText = (text: string, limit = 220) => {
  if (!text) return '';
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}…`;
};

const ReportHighlightCard: React.FC<ReportHighlightCardProps> = ({ report }) => {
  const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 3);
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
        <Card className="group h-full cursor-pointer overflow-hidden rounded-[22px] border border-border/60 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
          <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6 lg:p-7">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-muted shadow-sm ring-1 ring-inset ring-border/40">
                  {companyLogoUrl ? (
                    <img
                      src={companyLogoUrl}
                      alt={`${report.companyName} logotyp`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base sm:text-lg font-bold text-primary">
                      {companyInitial}
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary border-primary/20">
                      {report.companyName}
                    </Badge>
                    {report.sourceDocumentName && (
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                        {report.sourceDocumentName}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground/80">{createdAtLabel}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">AI-summerad rapport</p>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {report.reportTitle}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 text-right text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span className="font-semibold">Hög precision</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{truncateText(report.summary)}</p>

                {report.keyPoints.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      Viktiga punkter
                    </div>
                    <ul className="grid gap-2 text-sm text-foreground/90">
                      {report.keyPoints.slice(0, 3).map((point, index) => (
                        <li key={`${report.id}-point-${index}`} className="flex items-start gap-2">
                          <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary/70" />
                          <span className="leading-snug">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {highlightedMetrics.length > 0 && (
                <div className="flex flex-col gap-4 pt-4 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <LineChart className="h-3 w-3 text-primary" />
                    Nyckeltal
                  </div>
                  <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {highlightedMetrics.map((metric, index) => {
                      const normalizeTrend = (trend: string | undefined): string => {
                        if (!trend) return '';

                        const lowerTrend = trend.toLowerCase();

                        if (lowerTrend.includes('ökade med')) {
                          const match = trend.match(/ökade med\s*([\d.,\s]+)/i);
                          if (match) {
                            return `+${match[1].trim()}`;
                          }
                          return trend.replace(/ökade med/gi, '+');
                        }

                        if (lowerTrend.includes('minskade med')) {
                          const match = trend.match(/minskade med\s*([\d.,\s]+)/i);
                          if (match) {
                            return `-${match[1].trim()}`;
                          }
                          return trend.replace(/minskade med/gi, '-');
                        }

                        if (trend.trim().startsWith('+') || trend.trim().startsWith('-')) {
                          return trend;
                        }

                        return trend;
                      };

                      const normalizedTrend = normalizeTrend(metric.trend);
                      const trendUp = normalizedTrend.toLowerCase().includes('upp') || normalizedTrend.startsWith('+') || normalizedTrend.match(/\+[\d.,\s]+/);
                      const trendDown = normalizedTrend.toLowerCase().includes('ned') || normalizedTrend.startsWith('-') || normalizedTrend.match(/-[\d.,\s]+/);

                      return (
                        <div key={`${report.id}-highlight-metric-${index}`} className="flex flex-col gap-2 pr-2 sm:pr-4">
                          <p
                            className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/90 leading-tight break-words"
                            title={metric.label}
                          >
                            {metric.label}
                          </p>
                          <div className="flex flex-col gap-1 text-foreground">
                            <div className="flex flex-wrap items-baseline gap-2 text-2xl font-bold leading-tight">
                              <span>{metric.value}</span>
                              {normalizedTrend && (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    trendUp
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                      : trendDown
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                      : 'bg-muted/50 text-foreground'
                                  }`}
                                >
                                  {trendUp && <TrendingUp className="h-3 w-3" />}
                                  {trendDown && <TrendingDown className="h-3 w-3" />}
                                  <span className="leading-none">{normalizedTrend}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 pt-2 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span className="font-medium">{report.keyPoints.length} punkter</span>
              </div>
              <div className="flex items-center gap-1">
                <LineChart className="h-3.5 w-3.5" />
                <span className="font-medium">{report.keyMetrics.length} nyckeltal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <ReportDetailDialogContent report={report} />
    </Dialog>
  );
};

export default ReportHighlightCard;
