import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { GeneratedReport } from '@/types/generatedReport';

interface GeneratedReportsCarouselProps {
  reports: GeneratedReport[];
  isLoading?: boolean;
}

const renderSkeleton = () => (
  <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-8">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
    </div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Skeleton key={`report-skeleton-${index}`} className="h-48 rounded-2xl" />
      ))}
    </div>
  </section>
);

const truncateText = (text: string, limit = 180) => {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}…`;
};

const GeneratedReportsCarousel: React.FC<GeneratedReportsCarouselProps> = ({ reports, isLoading }) => {
  if (!reports.length) {
    return isLoading ? renderSkeleton() : null;
  }

  const slides = reports.slice(0, 9);

  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground sm:text-lg">Senaste rapportsammanfattningar</p>
            <p className="text-sm text-muted-foreground">
              AI-genererade analyser av färska bolagsrapporter.
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="secondary" className="text-xs">
            {reports.length} sammanfattningar
          </Badge>
        </div>
      </div>

      <div className="mt-6">
        <Carousel opts={{ align: 'start', dragFree: true, slidesToScroll: 1 }}>
          <CarouselContent className="-ml-2 md:-ml-4">
            {slides.map((report) => {
              const generatedAt = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: sv });
              const topMetrics = report.keyMetrics.slice(0, 2);

              return (
                <CarouselItem
                  key={report.id}
                  className="basis-full pl-2 sm:basis-1/2 md:pl-4 lg:basis-1/3"
                >
                  <Card className="h-full border border-border/40 bg-background/70 shadow-sm">
                    <CardHeader className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <CardTitle className="text-base font-semibold text-foreground">
                            {report.reportTitle}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">Genererad {generatedAt}</p>
                        </div>
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
                    </CardHeader>
                    <CardContent className="flex h-full flex-col justify-between gap-4 text-sm text-muted-foreground">
                      <p className="text-foreground/90 dark:text-gray-200">
                        {truncateText(report.summary)}
                      </p>

                      <div className="space-y-3">
                        {topMetrics.length > 0 && (
                          <div className="space-y-2">
                            <Separator className="bg-border/60" />
                            <div className="grid gap-2 sm:grid-cols-2">
                              {topMetrics.map((metric, index) => (
                                <div
                                  key={`${report.id}-carousel-metric-${index}`}
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
                        )}

                        {report.ceoCommentary && (
                          <div className="space-y-2">
                            <Separator className="bg-border/60" />
                            <div className="flex items-start gap-2">
                              <FileText className="mt-0.5 h-4 w-4 text-primary" />
                              <p className="text-xs italic text-foreground/90 dark:text-gray-200">
                                “{truncateText(report.ceoCommentary, 140)}”
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default GeneratedReportsCarousel;

