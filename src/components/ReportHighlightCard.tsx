import React, { useEffect, useState } from 'react';
import { Clock, LineChart, TrendingUp, TrendingDown } from 'lucide-react';
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

  const getTrendStyles = (normalizedTrend: string) => {
    const trendUp =
      normalizedTrend.toLowerCase().includes('upp') ||
      normalizedTrend.startsWith('+') ||
      normalizedTrend.match(/\+[\d.,\s]+/);
    const trendDown =
      normalizedTrend.toLowerCase().includes('ned') ||
      normalizedTrend.startsWith('-') ||
      normalizedTrend.match(/-[\d.,\s]+/);

    if (trendUp) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-200/80 dark:border-emerald-500/30';
    if (trendDown) return 'text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-500/10 border-red-200/80 dark:border-red-500/30';
    return 'text-muted-foreground bg-muted/40 border-border/60';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group h-full cursor-pointer overflow-hidden border border-border/70 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <CardContent className="flex h-full flex-col gap-5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-muted shadow-sm ring-1 ring-inset ring-border/40">
                  {companyLogoUrl ? (
                    <img
                      src={companyLogoUrl}
                      alt={`${report.companyName} logotyp`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">
                      {companyInitial}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary border-primary/30">
                    {report.companyName}
                  </Badge>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rapportsammanfattning</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{createdAtLabel}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold uppercase tracking-tight text-foreground leading-snug">
                {report.reportTitle}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{truncateText(report.summary, 220)}</p>
            </div>

            {highlightedMetrics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <LineChart className="h-4 w-4" />
                  Nyckeltal
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                    const trendStyles = normalizedTrend ? getTrendStyles(normalizedTrend) : 'text-muted-foreground bg-muted/40 border-border/60';

                    return (
                      <div
                        key={`${report.id}-highlight-metric-${index}`}
                        className="flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-background/80 p-3 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/50"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                        <div className="mt-2 flex items-start justify-between gap-2">
                          <p className="text-2xl font-bold text-foreground leading-tight">{metric.value}</p>
                          {normalizedTrend && (
                            <div className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${trendStyles}`}>
                              {trendStyles.includes('emerald') && <TrendingUp className="h-3.5 w-3.5" />}
                              {trendStyles.includes('red') && <TrendingDown className="h-3.5 w-3.5" />}
                              <span className="truncate">{normalizedTrend}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors group-hover:border-primary/50">
              <span className="truncate">Klicka för att öppna hela rapportanalysen</span>
              <span className="text-primary text-xs font-semibold">Visa</span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <ReportDetailDialogContent report={report} />
    </Dialog>
  );
};

export default ReportHighlightCard;
