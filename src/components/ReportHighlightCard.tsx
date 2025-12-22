import React, { useEffect, useState } from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import type { GeneratedReport } from '@/types/generatedReport';
import ReportDetailDialogContent from '@/components/ReportDetailDialogContent';
import {
  extractEpsBeatStatus,
  extractRevenueBeatStatus,
  extractGuidanceStatus,
  extractRevenueGrowth,
  extractGrossMargin,
} from '@/utils/reportDataExtractor';

interface Metric {
  label: string;
  value: string;
  subValue?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

interface ReportHighlightCardProps {
  report: GeneratedReport;
  variant?: 'editorial' | 'modern' | 'minimal' | 'data-forward';
}

const ReportHighlightCard: React.FC<ReportHighlightCardProps> = ({ 
  report,
  variant = 'modern'
}) => {
  const companyInitial = report.companyName?.charAt(0).toUpperCase() || '?';
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => setLogoFailed(false), [report.companyLogoUrl]);
  const companyLogoUrl = logoFailed ? null : report.companyLogoUrl ?? null;

  // Extract company name and remove ticker symbol
  const companyName = report.companyName || '';
  const cleanCompanyName = companyName.replace(/\s*\([^)]+\)\s*/, '').trim();

  // Extract earnings data
  const epsBeat = extractEpsBeatStatus(report);
  const revenueBeat = extractRevenueBeatStatus(report);
  const guidanceStatus = extractGuidanceStatus(report);
  const revenueGrowth = extractRevenueGrowth(report);
  const grossMargin = extractGrossMargin(report);

  // Translate metric labels to Swedish
  const translateMetricLabel = (label: string): string => {
    const lowerLabel = label.toLowerCase();
    
    // Filter out unwanted labels
    if (lowerLabel.includes('hänförlig') || lowerLabel.includes('attributable')) {
      return '';
    }
    
    const translations: Record<string, string> = {
      'revenue': 'Omsättning',
      'revenue growth': 'Omsättningstillväxt',
      'revenue growth (yoy)': 'Omsättningstillväxt',
      'gross margin': 'Bruttomarginal',
      'gross profit': 'Bruttovinst',
      'operating margin': 'Rörelsemarginal',
      'operating income': 'Rörelseresultat',
      'net income': 'Nettoresultat',
      'net profit': 'Nettoresultat',
      'eps': 'Vinst per aktie',
      'earnings per share': 'Vinst per aktie',
      'ebitda': 'EBITDA',
      'ebit': 'EBIT',
      'free cash flow': 'Fritt kassaflöde',
      'net sales': 'Nettoförsäljning',
      'nettoförsäljning': 'Nettoförsäljning',
    };

    if (translations[lowerLabel]) {
      return translations[lowerLabel];
    }

    for (const [key, value] of Object.entries(translations)) {
      if (lowerLabel.includes(key)) {
        return value;
      }
    }

    return label;
  };

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
  const shownMetricsCount = (revenueGrowth ? 1 : 0) + (grossMargin ? 1 : 0);
  const maxAdditionalMetrics = Math.max(0, 4 - shownMetricsCount);
  
  const additionalMetrics = (report.keyMetrics || []).filter(metric => {
    const label = (metric.label || '').toLowerCase();
    return (
      !label.includes('revenue growth') &&
      !label.includes('omsättningstillväxt') &&
      !label.includes('gross margin') &&
      !label.includes('bruttomarginal') &&
      !label.includes('constant currency') &&
      !label.includes('volume') &&
      !label.includes('eps') &&
      !label.includes('vinst per aktie') &&
      !label.includes('hänförlig') &&
      !label.includes('attributable') &&
      !label.includes('nettoresultat hänförlig') &&
      !label.includes('nettoförlust hänförlig') &&
      !label.includes('net income attributable') &&
      !label.includes('net loss attributable') &&
      metric.value && 
      metric.value.trim() !== ''
    );
  }).slice(0, maxAdditionalMetrics);

  // Convert to Metric format
  const buildMetrics = (): Metric[] => {
    const metrics: Metric[] = [];

    // Revenue Growth
    if (revenueGrowth) {
      const beatPercent = revenueGrowthMetric?.beatPercent;
      const changeType = beatPercent !== null && beatPercent !== undefined
        ? (beatPercent > 0 ? 'positive' : beatPercent < 0 ? 'negative' : 'neutral')
        : undefined;
      
      // Extract y/y improvement from trend or value
      // Check if value contains parentheses (e.g., "7.1% (konstant valuta +3.8%)")
      const parenthesesMatch = revenueGrowth.match(/\(([^)]+)\)/);
      const yoyInfo = revenueGrowthMetric?.trend || 
        (parenthesesMatch ? parenthesesMatch[1] : null);
      
      // Clean value - remove parentheses content if it exists
      const cleanValue = parenthesesMatch 
        ? revenueGrowth.replace(/\s*\([^)]+\)/g, '').trim()
        : revenueGrowth;
      
      metrics.push({
        label: 'Omsättningstillväxt',
        value: cleanValue,
        subValue: yoyInfo,
        change: beatPercent !== null && beatPercent !== undefined
          ? `${beatPercent > 0 ? '+' : ''}${beatPercent.toFixed(1)}%`
          : undefined,
        changeType,
      });
    }

    // Gross Margin
    if (grossMargin) {
      const beatPercent = grossMarginMetric?.beatPercent;
      const changeType = beatPercent !== null && beatPercent !== undefined
        ? (beatPercent > 0 ? 'positive' : beatPercent < 0 ? 'negative' : 'neutral')
        : undefined;
      
      // Extract y/y improvement from trend
      const yoyInfo = grossMarginMetric?.trend;
      
      metrics.push({
        label: 'Bruttomarginal',
        value: grossMargin,
        subValue: yoyInfo,
        change: beatPercent !== null && beatPercent !== undefined
          ? `${beatPercent > 0 ? '+' : ''}${beatPercent.toFixed(1)}%`
          : undefined,
        changeType,
      });
    }

    // Additional metrics
    additionalMetrics.forEach(metric => {
      const translatedLabel = translateMetricLabel(metric.label);
      // Skip metrics with empty labels (filtered out)
      if (!translatedLabel) {
        return;
      }
      
      const beatPercent = metric.beatPercent;
      const changeType = beatPercent !== null && beatPercent !== undefined
        ? (beatPercent > 0 ? 'positive' : beatPercent < 0 ? 'negative' : 'neutral')
        : undefined;

      metrics.push({
        label: translatedLabel,
        value: metric.value,
        subValue: metric.trend || undefined,
        change: beatPercent !== null && beatPercent !== undefined
          ? `${beatPercent > 0 ? '+' : ''}${beatPercent.toFixed(1)}%`
          : undefined,
        changeType,
      });
    });

    return metrics;
  };

  const metrics = buildMetrics();

  const getVariantStyles = () => {
    switch (variant) {
      case 'editorial':
        return {
          card: 'bg-[#fefdfb] border-[#e8e4dc] shadow-sm',
          header: 'border-b border-[#e8e4dc] pb-6',
          companyName: 'font-serif text-xl font-medium text-[#1a1a1a] tracking-tight',
          metricLabel: 'text-[11px] font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5 font-sans',
          metricValue: 'text-2xl font-serif font-medium text-[#1a1a1a] tracking-tight',
          metricSub: 'text-sm text-[#6b6b6b] font-sans mt-0.5',
          button: 'bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] font-sans',
        };
      case 'minimal':
        return {
          card: 'bg-white border-gray-100 shadow-sm',
          header: 'border-b border-gray-100 pb-8',
          companyName: 'text-2xl font-light text-gray-900 tracking-tight',
          metricLabel: 'text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2',
          metricValue: 'text-3xl font-light text-gray-900 tracking-tight',
          metricSub: 'text-sm text-gray-400 mt-1',
          button: 'bg-gray-900 text-white hover:bg-gray-800',
        };
      case 'data-forward':
        return {
          card: 'bg-[#0a0e27] border-[#1a1f3a] shadow-lg',
          header: 'border-b border-[#1a1f3a] pb-5',
          companyName: 'text-lg font-semibold text-white tracking-tight',
          metricLabel: 'text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1',
          metricValue: 'text-3xl font-bold text-white tracking-tight tabular-nums',
          metricSub: 'text-xs text-[#9ca3af] mt-0.5 tabular-nums',
          button: 'bg-blue-600 text-white hover:bg-blue-700 font-semibold',
        };
      default: // modern
        return {
          card: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-md',
          header: 'pb-6',
          companyName: 'text-xl font-semibold text-gray-900 dark:text-white',
          metricLabel: 'text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5',
          metricValue: 'text-2xl font-semibold text-gray-900 dark:text-white',
          metricSub: 'text-sm text-gray-600 dark:text-gray-400 mt-0.5',
          button: 'bg-blue-600 text-white hover:bg-blue-700 font-medium',
        };
    }
  };

  const styles = getVariantStyles();

  const getChangeColor = (changeType?: 'positive' | 'negative' | 'neutral') => {
    if (variant === 'data-forward') {
      return changeType === 'positive' 
        ? 'bg-emerald-500/20 text-emerald-400' 
        : changeType === 'negative'
        ? 'bg-red-500/20 text-red-400'
        : 'bg-gray-500/20 text-gray-400';
    }
    return changeType === 'positive' 
      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
      : changeType === 'negative'
      ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400'
      : 'bg-gray-50 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          data-id={report.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`rounded-xl border p-6 transition-shadow hover:shadow-xl cursor-pointer h-full flex flex-col ${styles.card}`}
        >
          {/* Header */}
          <div className={`flex items-start gap-4 ${styles.header}`}>
            {companyLogoUrl ? (
              <img 
                src={companyLogoUrl} 
                alt={cleanCompanyName}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                loading="lazy"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                variant === 'data-forward' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {companyInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className={styles.companyName}>{cleanCompanyName}</h3>
            </div>
          </div>

          {/* Metrics Grid */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 mt-6">
              {metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className={styles.metricLabel}>{metric.label}</div>
                  <div className="flex items-baseline gap-2">
                    <div className={styles.metricValue}>{metric.value}</div>
                    {metric.change && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getChangeColor(metric.changeType)}`}>
                        {metric.change}
                      </span>
                    )}
                  </div>
                  {metric.subValue && (
                    <div className={styles.metricSub}>{metric.subValue}</div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full mt-6 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${styles.button}`}
          >
            Läs hela rapporten
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </DialogTrigger>
      <ReportDetailDialogContent report={report} />
    </Dialog>
  );
};

export default ReportHighlightCard;
