import React, { useEffect, useState } from 'react';
import { Calendar, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
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
        <Card className="group h-full cursor-pointer overflow-hidden border-border/60 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl">
          <CardContent className="flex h-full flex-col gap-3 sm:gap-4 lg:gap-5 p-4 sm:p-5 lg:p-6">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-muted shadow-sm ring-1 ring-inset ring-border/40">
                  {companyLogoUrl ? (
                    <img
                      src={companyLogoUrl}
                      alt={`${report.companyName} logotyp`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm sm:text-base lg:text-lg font-bold text-primary">
                      {companyInitial}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full bg-primary/10 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-primary border-primary/20">
                      {report.companyName}
                    </Badge>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{report.reportTitle}</h3>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="leading-none">{createdAtLabel}</span>
              </div>
            </div>

            {/* Summary Section */}
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2 sm:line-clamp-3">{truncateText(report.summary, 180)}</p>

            <div className="h-px bg-border/50" />

            {/* Key Metrics Section */}
            {highlightedMetrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {highlightedMetrics.map((metric, index) => {
                  const normalizeTrend = (trend: string | undefined): string => {
                    if (!trend) return '';

                    const lowerTrend = trend.toLowerCase();

                    // Ersätt "ökade med" med "+"
                    if (lowerTrend.includes('ökade med')) {
                      const match = trend.match(/ökade med\s*([\d.,\s]+)/i);
                      if (match) {
                        return `+${match[1].trim()}`;
                      }
                      return trend.replace(/ökade med/gi, '+');
                    }

                    // Ersätt "minskade med" med "-"
                    if (lowerTrend.includes('minskade med')) {
                      const match = trend.match(/minskade med\s*([\d.,\s]+)/i);
                      if (match) {
                        return `-${match[1].trim()}`;
                      }
                      return trend.replace(/minskade med/gi, '-');
                    }

                    // Om det redan finns + eller - i början, behåll det
                    if (trend.trim().startsWith('+') || trend.trim().startsWith('-')) {
                      return trend;
                    }

                    return trend;
                  };

                  const normalizedTrend = normalizeTrend(metric.trend);
                  const trendUp = normalizedTrend.toLowerCase().includes('upp') || normalizedTrend.startsWith('+') || normalizedTrend.match(/\+[\d.,\s]+/);
                  const trendDown = normalizedTrend.toLowerCase().includes('ned') || normalizedTrend.startsWith('-') || normalizedTrend.match(/-[\d.,\s]+/);

                  return (
                    <div
                      key={`${report.id}-highlight-metric-${index}`}
                      className="space-y-1 rounded-xl border border-border/60 bg-card/40 p-3 sm:p-4 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-sm"
                    >
                      <p className="text-[10px] sm:text-xs font-semibold tracking-wide text-muted-foreground uppercase truncate">{metric.label}</p>
                      <div className="flex items-baseline gap-2 sm:gap-3">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{metric.value}</p>
                        {normalizedTrend && (
                          <div
                            className={`flex items-center gap-1 text-xs font-semibold ${
                              trendUp ? 'text-emerald-600 dark:text-emerald-400' :
                              trendDown ? 'text-red-600 dark:text-red-400' :
                              'text-muted-foreground'
                            }`}
                          >
                            <span>{trendUp ? '▲' : trendDown ? '▼' : ''}</span>
                            <span className="truncate">{normalizedTrend}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Section */}
            <div className="mt-auto flex items-center justify-end text-[11px] sm:text-xs font-semibold text-primary gap-1">
              <span>Läs analysen</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <ReportDetailDialogContent report={report} />
    </Dialog>
  );
};

export default ReportHighlightCard;
