import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

import { GeneratedReport } from '@/types/generatedReport';

interface GeneratedReportsSectionProps {
  reports: GeneratedReport[];
}

const GeneratedReportsSection: React.FC<GeneratedReportsSectionProps> = ({ reports }) => {
  if (!reports.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">Rapporter</h2>
      </div>
      <div className="space-y-4">
        {reports.map((report) => {
          const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });

          return (
            <Card key={report.id} className="border-0 bg-background/60 shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold sm:text-lg">
                    {report.reportTitle}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {report.companyName}
                    </Badge>
                    {report.sourceDocumentName && (
                      <Badge variant="secondary" className="text-xs">
                        {report.sourceDocumentName}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Genererad {generatedAt}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="leading-relaxed text-foreground/90 dark:text-gray-200">{report.summary}</p>
                {report.keyMetrics && report.keyMetrics.length > 0 && (
                  <div className="space-y-2">
                    <Separator className="bg-border/70" />
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Viktiga siffror</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {report.keyMetrics.map((metric, metricIndex) => (
                          <div
                            key={`${report.id}-metric-${metricIndex}`}
                            className="rounded-2xl border border-border/60 bg-card/60 p-3"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {metric.label}
                            </p>
                            <p className="text-base font-semibold text-foreground">
                              {metric.value}
                            </p>
                            {metric.trend && (
                              <p className="text-xs text-muted-foreground">{metric.trend}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {report.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <Separator className="bg-border/70" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nyckelpunkter</p>
                      <ul className="list-disc space-y-1 pl-5 text-foreground/90 dark:text-gray-200">
                        {report.keyPoints.map((point, keyIndex) => (
                          <li key={`${report.id}-point-${keyIndex}`}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {report.ceoCommentary && (
                  <div className="space-y-2">
                    <Separator className="bg-border/70" />
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">VD:s ord</p>
                      <blockquote className="rounded-2xl border-l-4 border-primary/60 bg-primary/10 p-3 text-sm italic text-foreground/90 dark:text-gray-200">
                        {report.ceoCommentary}
                      </blockquote>
                    </div>
                  </div>
                )}
                {report.sourceUrl && (
                  <a
                    href={report.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Visa källa
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default GeneratedReportsSection;
