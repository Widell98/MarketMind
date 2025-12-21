import React, { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GeneratedReport } from '@/types/generatedReport';
import ReportDetailDialogContent from '@/components/ReportDetailDialogContent';
import {
  extractEpsBeatStatus,
  extractRevenueBeatStatus,
  extractGuidanceStatus,
  extractRevenueGrowth,
  extractGrossMargin,
} from '@/utils/reportDataExtractor';

const ReportHighlightCard: React.FC<ReportHighlightCardProps> = ({ report }) => {
  const companyInitial = report.companyName?.charAt(0).toUpperCase() || '?';
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => setLogoFailed(false), [report.companyLogoUrl]);
  const companyLogoUrl = logoFailed ? null : report.companyLogoUrl ?? null;

  // Extract earnings data
  const epsBeat = extractEpsBeatStatus(report);
  const revenueBeat = extractRevenueBeatStatus(report);
  const guidanceStatus = extractGuidanceStatus(report);
  const revenueGrowth = extractRevenueGrowth(report);
  const grossMargin = extractGrossMargin(report);

  // Helper to format beat status badge
  const getBeatStatusBadge = (status: typeof epsBeat.status, percent?: number) => {
    if (!status) return null;
    
    const percentText = percent !== undefined ? ` (${percent > 0 ? '+' : ''}${percent}%)` : '';
    const statusText = status === 'beat' ? 'BEAT' : status === 'miss' ? 'MISS' : 'IN LINE';
    
    const className = status === 'beat' 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : status === 'miss'
      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      : 'bg-muted text-muted-foreground border-border/60';

    return (
      <Badge className={`rounded-full px-1.5 py-0.5 sm:px-2 md:px-2.5 text-[9px] sm:text-[10px] md:text-[11px] font-semibold border ${className}`}>
        {statusText}{percentText}
      </Badge>
    );
  };

  // Helper to format guidance badge
  const getGuidanceBadge = (status: typeof guidanceStatus) => {
    if (!status) return null;
    
    const statusText = status === 'raised' ? 'RAISED' : status === 'lowered' ? 'LOWERED' : 'MAINTAINED';
    
    const className = status === 'raised'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : status === 'lowered'
      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      : 'bg-muted text-muted-foreground border-border/60';

    return (
      <Badge className={`rounded-full px-1.5 py-0.5 sm:px-2 md:px-2.5 text-[9px] sm:text-[10px] md:text-[11px] font-semibold border ${className}`}>
        {statusText}
      </Badge>
    );
  };

  // Extract percentage from revenue growth for arrow display
  const revenueGrowthPercent = revenueGrowth?.match(/([+-]?\d+(?:\.\d+)?)%/)?.[1];
  const hasPositiveGrowth = revenueGrowthPercent && parseFloat(revenueGrowthPercent) > 0;

  // Translate metric labels to Swedish and shorten long texts
  const translateMetricLabel = (label: string): string => {
    const lowerLabel = label.toLowerCase();
    
    // Common financial metrics translations
    const translations: Record<string, string> = {
      'revenue': 'Omsättning',
      'revenue growth': 'Omsättningstillväxt',
      'revenue growth (yoy)': 'Omsättningstillväxt (år till år)',
      'gross margin': 'Bruttomarginal',
      'gross profit': 'Bruttovinst',
      'operating margin': 'Rörelsemarginal',
      'operating income': 'Rörelseresultat',
      'net income': 'Nettoresultat',
      'net profit': 'Nettoresultat',
      'net income attributable': 'Nettoresultat',
      'net loss attributable': 'Nettoresultat',
      'net income attributable to shareholders': 'Nettoresultat',
      'net loss attributable to shareholders': 'Nettoresultat',
      'net income attributable to equity holders': 'Nettoresultat',
      'net loss attributable to equity holders': 'Nettoresultat',
      'nettoresultat hänförlig': 'Nettoresultat',
      'nettoförlust hänförlig': 'Nettoresultat',
      'nettoresultat hänförlig till aktieägare': 'Nettoresultat',
      'nettoförlust hänförlig till aktieägare': 'Nettoresultat',
      'eps': 'Vinst per aktie',
      'earnings per share': 'Vinst per aktie',
      'ebitda': 'EBITDA',
      'ebit': 'EBIT',
      'free cash flow': 'Fritt kassaflöde',
      'cash flow': 'Kassaflöde',
      'total assets': 'Totala tillgångar',
      'total liabilities': 'Totala skulder',
      'debt': 'Skuld',
      'equity': 'Eget kapital',
      'market cap': 'Börsvärde',
      'market capitalization': 'Börsvärde',
      'price to earnings': 'P/E-tal',
      'pe ratio': 'P/E-tal',
      'price to book': 'P/B-tal',
      'pb ratio': 'P/B-tal',
      'dividend yield': 'Utdelningsavkastning',
      'return on equity': 'Avkastning på eget kapital',
      'roe': 'Avkastning på eget kapital',
      'return on assets': 'Avkastning på tillgångar',
      'roa': 'Avkastning på tillgångar',
      'net sales': 'Nettoförsäljning',
      'nettoförsäljning': 'Nettoförsäljning',
      'operating result': 'Rörelseresultat',
      'rörelseresultat': 'Rörelseresultat',
      'diluted earnings per share': 'Vinst per aktie',
      'nettoresultat per utspädd aktie': 'Vinst per aktie',
    };

    // Check for exact match first
    if (translations[lowerLabel]) {
      return translations[lowerLabel];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(translations)) {
      if (lowerLabel.includes(key)) {
        return value;
      }
    }

    // Auto-shorten long labels by extracting key words
    const shortenLabel = (text: string): string => {
      const words = text.toLowerCase().split(/[\s\/\-]+/);
      
      // Common patterns for shortening
      if (words.includes('netto') && (words.includes('resultat') || words.includes('vinst') || words.includes('förlust'))) {
        return 'Nettoresultat';
      }
      if (words.includes('rörelse') && words.includes('resultat')) {
        return 'Rörelseresultat';
      }
      if (words.includes('netto') && words.includes('försäljning')) {
        return 'Nettoförsäljning';
      }
      if (words.includes('hänförlig') || words.includes('attributable')) {
        if (words.includes('netto') || words.includes('net')) {
          return 'Nettoresultat';
        }
      }
      if (words.includes('utspädd') || words.includes('diluted')) {
        if (words.includes('aktie') || words.includes('share')) {
          return 'Vinst per aktie';
        }
      }
      
      // If label is too long (>25 chars), try to extract first meaningful words
      if (text.length > 25) {
        // Take first 2-3 meaningful words
        const meaningfulWords = words.filter(w => 
          w.length > 3 && 
          !['till', 'för', 'att', 'och', 'the', 'to', 'for', 'and'].includes(w)
        );
        if (meaningfulWords.length > 0) {
          const shortened = meaningfulWords.slice(0, 2).map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          return shortened.length <= 25 ? shortened : shortened.substring(0, 22) + '...';
        }
      }
      
      return text;
    };

    // If no translation found, try to shorten
    return shortenLabel(label);
  };

  // Extract EPS/VPA from keyMetrics if available
  const epsMetric = report.keyMetrics?.find(m => {
    const label = (m.label || '').toLowerCase();
    return (
      label.includes('eps') ||
      label.includes('vinst per aktie') ||
      label.includes('earnings per share') ||
      label.includes('vpa')
    );
  });

  // Find revenue growth metric object
  const revenueGrowthMetric = report.keyMetrics?.find(m => {
    const label = (m.label || '').toLowerCase();
    return (
      label.includes('revenue growth') ||
      label.includes('omsättningstillväxt') ||
      label.includes('intäktsstillväxt') ||
      (label.includes('growth') && (label.includes('revenue') || label.includes('omsättning'))) ||
      (label.includes('yoy') && (label.includes('revenue') || label.includes('omsättning')))
    );
  });

  // Find gross margin metric object
  const grossMarginMetric = report.keyMetrics?.find(m => {
    const label = (m.label || '').toLowerCase();
    return (
      label.includes('gross margin') ||
      label.includes('bruttomarginal') ||
      label.includes('brutto vinstmarginal') ||
      label === 'margin' ||
      label === 'marginal'
    );
  });

  // Get additional key metrics (excluding ones we already show)
  // Calculate how many metrics are already shown (revenueGrowth and grossMargin)
  const shownMetricsCount = (revenueGrowth ? 1 : 0) + (grossMargin ? 1 : 0);
  const maxAdditionalMetrics = Math.max(0, 4 - shownMetricsCount); // Max 4 total metrics
  
  const additionalMetrics = (report.keyMetrics || []).filter(metric => {
    const label = (metric.label || '').toLowerCase();
    return (
      !label.includes('revenue growth') &&
      !label.includes('omsättningstillväxt') &&
      !label.includes('gross margin') &&
      !label.includes('bruttomarginal') &&
      !label.includes('constant currency') &&
      !label.includes('konstant valuta') &&
      !label.includes('intäkter på konstant valuta') &&
      !label.includes('net loss attributable') &&
      !label.includes('nettoförlust hänförlig') &&
      !label.includes('nettoförlust hänförlig till aktieägare') &&
      !label.includes('volume') &&
      !label.includes('volym') &&
      !label.includes('såld volym') &&
      !label.includes('sold volume') &&
      !label.includes('liters') &&
      !label.includes('eps') &&
      !label.includes('vinst per aktie') &&
      !label.includes('earnings per share') &&
      !label.includes('vpa') &&
      metric.value && 
      metric.value.trim() !== ''
    );
  }).slice(0, maxAdditionalMetrics); // Show up to max 4 total metrics

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group h-full cursor-pointer overflow-hidden border-border/60 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl">
          <CardContent className="flex h-full flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 p-3 sm:p-4 md:p-5 lg:p-6">
            {/* Header Section */}
            <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-muted shadow-sm">
                {companyLogoUrl ? (
                  <img
                    src={companyLogoUrl}
                    alt={`${report.companyName} logotyp`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm sm:text-base md:text-lg font-bold text-primary">
                    {companyInitial}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full bg-muted text-foreground/90 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm md:text-base font-medium">
                    {report.companyName}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Earnings Performance Section */}
            <div className="space-y-1.5 sm:space-y-2">
              {epsBeat.status && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Vinst per aktie (VPA):</span>
                  {getBeatStatusBadge(epsBeat.status, epsBeat.percent)}
                </div>
              )}
              {!epsBeat.status && epsMetric && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Vinst per aktie (VPA):</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-semibold text-foreground break-words">{epsMetric.value}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Metrics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
              {revenueGrowth && (() => {
                const beatPercent = revenueGrowthMetric?.beatPercent;
                return (
                  <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm p-2.5 sm:p-3 md:p-3.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30">
                    <p className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 break-words leading-tight mb-1.5">
                      Omsättningstillväxt (år till år)
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                      <span className="text-[12px] sm:text-sm md:text-base lg:text-lg font-bold text-foreground break-words">{revenueGrowth}</span>
                      {beatPercent !== null && beatPercent !== undefined && (
                        <Badge className={`rounded-full px-1 py-0.5 sm:px-1.5 md:px-2 text-[9px] sm:text-[10px] md:text-[11px] font-semibold border shrink-0 ${
                          beatPercent > 0 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : beatPercent < 0
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                            : 'bg-muted text-muted-foreground border-border/60'
                        }`}>
                          {beatPercent > 0 ? '+' : ''}{beatPercent.toFixed(1)}%
                        </Badge>
                      )}
                      {!beatPercent && hasPositiveGrowth && (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </div>
                );
              })()}
              {grossMargin && (() => {
                const beatPercent = grossMarginMetric?.beatPercent;
                return (
                  <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm p-2.5 sm:p-3 md:p-3.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30">
                    <p className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 break-words leading-tight mb-1.5">
                      Bruttomarginal
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                      <span className="text-[12px] sm:text-sm md:text-base lg:text-lg font-bold text-foreground break-words">{grossMargin}</span>
                      {beatPercent !== null && beatPercent !== undefined && (
                        <Badge className={`rounded-full px-1 py-0.5 sm:px-1.5 md:px-2 text-[9px] sm:text-[10px] md:text-[11px] font-semibold border shrink-0 ${
                          beatPercent > 0 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : beatPercent < 0
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                            : 'bg-muted text-muted-foreground border-border/60'
                        }`}>
                          {beatPercent > 0 ? '+' : ''}{beatPercent.toFixed(1)}%
                        </Badge>
                      )}
                      {!beatPercent && (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </div>
                );
              })()}
              {/* Additional Key Metrics */}
              {additionalMetrics.map((metric, index) => {
                const translatedLabel = translateMetricLabel(metric.label);
                const trendValue = metric.trend || '';
                const isPositive = trendValue.match(/\+|\d+%/) || trendValue.toLowerCase().includes('upp') || trendValue.toLowerCase().includes('ökad');
                const isNegative = trendValue.match(/-|\d+%/) || trendValue.toLowerCase().includes('ned') || trendValue.toLowerCase().includes('minskad');
                const beatPercent = metric.beatPercent;
                
                return (
                  <div key={`${report.id}-additional-metric-${index}`} className="rounded-xl border border-border/40 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm p-2.5 sm:p-3 md:p-3.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30">
                    <p className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 whitespace-normal break-words leading-tight mb-1.5">
                      {translatedLabel}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                      <span className="text-[12px] sm:text-sm md:text-base lg:text-lg font-bold text-foreground break-words">{metric.value}</span>
                      {beatPercent !== null && beatPercent !== undefined && (
                        <Badge className={`rounded-full px-1 py-0.5 sm:px-1.5 md:px-2 text-[9px] sm:text-[10px] md:text-[11px] font-semibold border shrink-0 ${
                          beatPercent > 0 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : beatPercent < 0
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                            : 'bg-muted text-muted-foreground border-border/60'
                        }`}>
                          {beatPercent > 0 ? '+' : ''}{beatPercent.toFixed(1)}%
                        </Badge>
                      )}
                      {!beatPercent && isPositive && !isNegative && (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Guidance Section */}
            {guidanceStatus && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Prognos:</span>
                {getGuidanceBadge(guidanceStatus)}
              </div>
            )}

            {/* CTA Button */}
            <div className="mt-auto pt-1.5 sm:pt-2">
              <div className="w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 md:py-2.5 px-3 sm:px-4 text-center transition-all group-hover:shadow-lg flex items-center justify-center cursor-pointer">
                Läs hela rapporten <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
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
