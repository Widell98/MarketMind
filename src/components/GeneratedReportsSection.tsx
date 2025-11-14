import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

import { GeneratedReport } from '@/types/generatedReport';

interface GeneratedReportsSectionProps {
  reports: GeneratedReport[];
}

const truncateText = (text: string, limit = 220) => {
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
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">Rapporter</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((report) => {
          const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });
          const highlightedMetrics = report.keyMetrics.slice(0, 3);

          return (
            <Dialog key={report.id}>
              <DialogTrigger asChild>
                <Card className="group h-full cursor-pointer border-0 bg-background/60 shadow-sm transition hover:-translate-y-0.5 hover:bg-background/80 hover:shadow-md">
                  <CardHeader className="space-y-3">
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
                    <p className="text-sm leading-relaxed text-foreground/90 dark:text-gray-200">
                      {truncateText(report.summary)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {highlightedMetrics.length > 0 && (
                      <div className="space-y-2">
                        <Separator className="bg-border/70" />
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nyckeltal</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {highlightedMetrics.map((metric, metricIndex) => (
                              <div
                                key={`${report.id}-preview-metric-${metricIndex}`}
                                className="rounded-2xl border border-border/60 bg-card/60 p-3"
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-medium text-primary">Visa full rapport</span>
                      <Button variant="ghost" size="sm" className="h-8 px-0 text-xs text-primary">
                        Läs mer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
                <DialogHeader className="space-y-3 text-left">
                  <DialogTitle className="text-2xl font-semibold text-foreground">
                    {report.reportTitle}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Genererad {generatedAt}
                  </DialogDescription>
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
                </DialogHeader>

                <div className="space-y-6 text-sm text-muted-foreground">
                  <p className="leading-relaxed text-foreground/90 dark:text-gray-200">{report.summary}</p>

                  {report.keyMetrics && report.keyMetrics.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Viktiga siffror</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {report.keyMetrics.map((metric, metricIndex) => (
                          <div
                            key={`${report.id}-dialog-metric-${metricIndex}`}
                            className="rounded-2xl border border-border/60 bg-card/60 p-4"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {metric.label}
                            </p>
                            <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                            {metric.trend && (
                              <p className="text-xs text-muted-foreground">{metric.trend}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.keyPoints && report.keyPoints.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nyckelpunkter</h3>
                      <ul className="list-disc space-y-2 pl-5 text-foreground/90 dark:text-gray-200">
                        {report.keyPoints.map((point, keyIndex) => (
                          <li key={`${report.id}-dialog-point-${keyIndex}`}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.ceoCommentary && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">VD:s ord</h3>
                      <blockquote className="rounded-2xl border-l-4 border-primary/60 bg-primary/10 p-4 text-sm italic text-foreground/90 dark:text-gray-200">
                        {report.ceoCommentary}
                      </blockquote>
                    </div>
                  )}

                  {report.sourceUrl && (
                    <div className="pt-2">
                      <a
                        href={report.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Visa källa
                      </a>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </section>
  );
};

export default GeneratedReportsSection;
