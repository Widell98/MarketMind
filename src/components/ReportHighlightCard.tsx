import React from 'react';
import { ArrowRight, LineChart } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { GeneratedReport } from '@/types/generatedReport';
import ReportDetailDialogContent from '@/components/ReportDetailDialogContent';
import { getReportBrandTheme } from '@/lib/reportBrandTheme';

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
  const theme = getReportBrandTheme(report.companyName);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          className={cn(
            'group relative h-full cursor-pointer overflow-hidden border shadow-sm transition hover:-translate-y-1 hover:shadow-md',
            `bg-gradient-to-b ${theme.cardGradient}`,
            theme.panelBorder
          )}
        >
          <div
            className={cn(
              'absolute inset-x-6 top-6 h-16 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100',
              `bg-gradient-to-r ${theme.glow}`
            )}
          />
          <CardContent className="relative flex h-full flex-col gap-5 p-5">
            <div className="flex items-start gap-3">
              <Avatar className={cn('h-12 w-12 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900', theme.logoRing)}>
                {report.companyLogoUrl && (
                  <AvatarImage src={report.companyLogoUrl} alt={report.companyName} className="object-cover" />
                )}
                <AvatarFallback className={cn('bg-gradient-to-br text-sm font-semibold uppercase text-white', theme.logoGradient)}>
                  {report.companyName?.[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className={cn('rounded-full', theme.badgeBg)}>
                    {report.companyName}
                  </Badge>
                  {report.sourceDocumentName && (
                    <Badge variant="outline" className={cn('rounded-full border-dashed text-[11px]', theme.chipBorder)}>
                      {report.sourceDocumentName}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold leading-tight text-foreground">{report.reportTitle}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{truncateText(report.summary)}</p>
              </div>
            </div>

            {highlightedMetrics.length > 0 && (
              <div
                className={cn(
                  'rounded-2xl border p-4 shadow-[0_6px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur',
                  theme.metricBg,
                  theme.metricBorder
                )}
              >
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

            <div
              className={cn(
                'mt-auto flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium text-primary transition',
                theme.chipBorder,
                theme.mutedPanel,
                'group-hover:border-primary/50 group-hover:text-primary'
              )}
            >
              <span className={cn('flex items-center gap-2 font-semibold', theme.accentText)}>
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
