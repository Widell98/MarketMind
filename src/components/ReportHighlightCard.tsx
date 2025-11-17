import React from 'react';
import { ArrowUpRight, LineChart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GeneratedReport } from '@/types/generatedReport';

interface ReportHighlightCardProps {
  report: GeneratedReport;
  ctaHref?: string;
  onCTAClick?: () => void;
}

const truncateText = (text: string, limit = 160) => {
  if (!text) return '';
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}…`;
};

const ReportHighlightCard: React.FC<ReportHighlightCardProps> = ({ report, ctaHref, onCTAClick }) => {
  const highlightedMetrics = (report.keyMetrics ?? []).slice(0, 2);

  const ctaContent = (
    <span className="flex items-center justify-center gap-2 text-sm">
      Läs sammanfattning
      <ArrowUpRight className="h-4 w-4" />
    </span>
  );

  return (
    <Card className="h-full border-border/60 bg-card/80 shadow-sm">
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
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <LineChart className="h-3.5 w-3.5" />
              Nyckeltal
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {highlightedMetrics.map((metric, index) => (
                <div key={`${report.id}-highlight-metric-${index}`} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                  <p className="text-base font-semibold text-foreground">{metric.value}</p>
                  {metric.trend && <p className="text-xs text-muted-foreground">{metric.trend}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto">
          {ctaHref ? (
            <Button variant="outline" className="w-full rounded-xl border-border/70" asChild>
              <a href={ctaHref} onClick={onCTAClick}>
                {ctaContent}
              </a>
            </Button>
          ) : (
            <Button variant="outline" className="w-full rounded-xl border-border/70" onClick={onCTAClick}>
              {ctaContent}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportHighlightCard;
