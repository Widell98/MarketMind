import type { GeneratedReport } from '@/types/generatedReport';

export type BeatStatus = 'beat' | 'miss' | 'in_line';
export type GuidanceStatus = 'raised' | 'lowered' | 'maintained';

interface BeatStatusResult {
  status: BeatStatus | null;
  percent?: number;
}

/**
 * Extract EPS beat status from report summary or keyMetrics
 */
export function extractEpsBeatStatus(report: GeneratedReport): BeatStatusResult {
  const text = (report.summary || '').toLowerCase();
  const keyMetricsText = (report.keyMetrics || [])
    .map(m => `${m.label || ''} ${m.value || ''} ${m.trend || ''}`)
    .join(' ')
    .toLowerCase();

  const searchText = `${text} ${keyMetricsText}`;

  // Look for patterns like "EPS BEAT (+8%)", "EPS beat expectations", "EPS missed", "EPS in line"
  const beatPattern = /eps\s+(?:beat|överträffa|översteg|bättre än)\s*(?:expectations|förväntningar|estimat)?\s*(?:\(?\+?(\d+(?:\.\d+)?)%?\)?)?/i;
  const missPattern = /eps\s+(?:miss|missed|under|understeg|sämre än)\s*(?:expectations|förväntningar|estimat)?\s*(?:\(?\-?(\d+(?:\.\d+)?)%?\)?)?/i;
  const inLinePattern = /eps\s+(?:in\s+line|i\s+linje|motsvarade)\s*(?:expectations|förväntningar|estimat)?/i;

  const beatMatch = searchText.match(beatPattern);
  if (beatMatch) {
    const percent = beatMatch[1] ? parseFloat(beatMatch[1]) : undefined;
    return { status: 'beat', percent };
  }

  const missMatch = searchText.match(missPattern);
  if (missMatch) {
    const percent = missMatch[1] ? parseFloat(missMatch[1]) : undefined;
    return { status: 'miss', percent };
  }

  if (inLinePattern.test(searchText)) {
    return { status: 'in_line' };
  }

  // Also check keyMetrics for EPS-related metrics
  const epsMetric = report.keyMetrics?.find(m => 
    (m.label || '').toLowerCase().includes('eps') ||
    (m.label || '').toLowerCase().includes('vinst per aktie')
  );

  if (epsMetric) {
    const trend = (epsMetric.trend || '').toLowerCase();
    if (trend.includes('beat') || trend.includes('överträffa') || trend.match(/\+/)) {
      const percentMatch = trend.match(/(\d+(?:\.\d+)?)%/);
      const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;
      return { status: 'beat', percent };
    }
    if (trend.includes('miss') || trend.includes('understeg') || trend.match(/\-/)) {
      const percentMatch = trend.match(/(\d+(?:\.\d+)?)%/);
      const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;
      return { status: 'miss', percent };
    }
  }

  return { status: null };
}

/**
 * Extract Revenue beat status from report summary or keyMetrics
 */
export function extractRevenueBeatStatus(report: GeneratedReport): BeatStatusResult {
  const text = (report.summary || '').toLowerCase();
  const keyMetricsText = (report.keyMetrics || [])
    .map(m => `${m.label || ''} ${m.value || ''} ${m.trend || ''}`)
    .join(' ')
    .toLowerCase();

  const searchText = `${text} ${keyMetricsText}`;

  // Look for patterns like "Revenue BEAT (+3%)", "Revenue beat expectations", etc.
  const beatPattern = /(?:revenue|omsättning|intäkter)\s+(?:beat|överträffa|översteg|bättre än)\s*(?:expectations|förväntningar|estimat)?\s*(?:\(?\+?(\d+(?:\.\d+)?)%?\)?)?/i;
  const missPattern = /(?:revenue|omsättning|intäkter)\s+(?:miss|missed|under|understeg|sämre än)\s*(?:expectations|förväntningar|estimat)?\s*(?:\(?\-?(\d+(?:\.\d+)?)%?\)?)?/i;
  const inLinePattern = /(?:revenue|omsättning|intäkter)\s+(?:in\s+line|i\s+linje|motsvarade)\s*(?:expectations|förväntningar|estimat)?/i;

  const beatMatch = searchText.match(beatPattern);
  if (beatMatch) {
    const percent = beatMatch[1] ? parseFloat(beatMatch[1]) : undefined;
    return { status: 'beat', percent };
  }

  const missMatch = searchText.match(missPattern);
  if (missMatch) {
    const percent = missMatch[1] ? parseFloat(missMatch[1]) : undefined;
    return { status: 'miss', percent };
  }

  if (inLinePattern.test(searchText)) {
    return { status: 'in_line' };
  }

  // Also check keyMetrics for Revenue-related metrics
  const revenueMetric = report.keyMetrics?.find(m => 
    (m.label || '').toLowerCase().includes('revenue') ||
    (m.label || '').toLowerCase().includes('omsättning') ||
    (m.label || '').toLowerCase().includes('intäkter')
  );

  if (revenueMetric) {
    const trend = (revenueMetric.trend || '').toLowerCase();
    if (trend.includes('beat') || trend.includes('överträffa') || trend.match(/\+/)) {
      const percentMatch = trend.match(/(\d+(?:\.\d+)?)%/);
      const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;
      return { status: 'beat', percent };
    }
    if (trend.includes('miss') || trend.includes('understeg') || trend.match(/\-/)) {
      const percentMatch = trend.match(/(\d+(?:\.\d+)?)%/);
      const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;
      return { status: 'miss', percent };
    }
  }

  return { status: null };
}

/**
 * Extract guidance status from report summary or keyPoints
 */
export function extractGuidanceStatus(report: GeneratedReport): GuidanceStatus | null {
  const text = (report.summary || '').toLowerCase();
  const keyPointsText = (report.keyPoints || []).join(' ').toLowerCase();

  const searchText = `${text} ${keyPointsText}`;

  // Look for patterns like "raised guidance", "höjde prognos", "lowered guidance", "sänkte prognos"
  const raisedPattern = /(?:raised|höjde|höjer|höjning|uppåt)\s+(?:guidance|prognos|utlåtande|förväntningar)/i;
  const loweredPattern = /(?:lowered|sänkte|sänker|sänkning|nedåt|reducerad)\s+(?:guidance|prognos|utlåtande|förväntningar)/i;
  const maintainedPattern = /(?:maintained|behöll|behåller|oförändrad)\s+(?:guidance|prognos|utlåtande|förväntningar)/i;

  if (raisedPattern.test(searchText)) {
    return 'raised';
  }

  if (loweredPattern.test(searchText)) {
    return 'lowered';
  }

  if (maintainedPattern.test(searchText)) {
    return 'maintained';
  }

  return null;
}

/**
 * Extract revenue growth (YoY) from keyMetrics
 */
export function extractRevenueGrowth(report: GeneratedReport): string | null {
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

  if (revenueGrowthMetric?.value) {
    return revenueGrowthMetric.value;
  }

  // Try to extract from trend if value is not available
  if (revenueGrowthMetric?.trend) {
    const percentMatch = revenueGrowthMetric.trend.match(/(\+?\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      return `${percentMatch[1]}%`;
    }
  }

  return null;
}

/**
 * Extract gross margin from keyMetrics
 */
export function extractGrossMargin(report: GeneratedReport): string | null {
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

  if (grossMarginMetric?.value) {
    return grossMarginMetric.value;
  }

  return null;
}

/**
 * Extract gross margin beat status from report summary or keyMetrics
 */
export function extractGrossMarginBeatStatus(report: GeneratedReport): BeatStatusResult {
  const text = (report.summary || '').toLowerCase();
  const keyMetricsText = (report.keyMetrics || [])
    .map(m => `${m.label || ''} ${m.value || ''} ${m.trend || ''}`)
    .join(' ')
    .toLowerCase();

  const searchText = `${text} ${keyMetricsText}`;

  // Look for patterns like "gross margin BEAT", "bruttomarginal överträffa", etc.
  const beatPattern = /(?:gross\s+margin|bruttomarginal|brutto\s+marginal)\s+(?:beat|överträffa|översteg|bättre än)\s*(?:expectations|förväntningar|estimat)?\s*(?:\(?\+?(\d+(?:\.\d+)?)%?\)?)?/i;
  const missPattern = /(?:gross\s+margin|bruttomarginal|brutto\s+marginal)\s+(?:miss|missed|under|understeg|sämre än)\s*(?:expectations|förväntningar|estimat)?\s*(?:\(?\-?(\d+(?:\.\d+)?)%?\)?)?/i;
  const inLinePattern = /(?:gross\s+margin|bruttomarginal|brutto\s+marginal)\s+(?:in\s+line|i\s+linje|motsvarade)\s*(?:expectations|förväntningar|estimat)?/i;

  const beatMatch = searchText.match(beatPattern);
  if (beatMatch) {
    const percent = beatMatch[1] ? parseFloat(beatMatch[1]) : undefined;
    return { status: 'beat', percent };
  }

  const missMatch = searchText.match(missPattern);
  if (missMatch) {
    const percent = missMatch[1] ? parseFloat(missMatch[1]) : undefined;
    return { status: 'miss', percent };
  }

  if (inLinePattern.test(searchText)) {
    return { status: 'in_line' };
  }

  // Also check keyMetrics for gross margin-related metrics
  const grossMarginMetric = report.keyMetrics?.find(m => {
    const label = (m.label || '').toLowerCase();
    return (
      label.includes('gross margin') ||
      label.includes('bruttomarginal') ||
      label.includes('brutto vinstmarginal')
    );
  });

  if (grossMarginMetric) {
    const trend = (grossMarginMetric.trend || '').toLowerCase();
    if (trend.includes('beat') || trend.includes('överträffa') || trend.match(/\+/)) {
      const percentMatch = trend.match(/(\d+(?:\.\d+)?)%/);
      const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;
      return { status: 'beat', percent };
    }
    if (trend.includes('miss') || trend.includes('understeg') || trend.match(/\-/)) {
      const percentMatch = trend.match(/(\d+(?:\.\d+)?)%/);
      const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;
      return { status: 'miss', percent };
    }
  }

  return { status: null };
}

/**
 * Extract revenue growth beat status from report summary or keyMetrics
 */
export function extractRevenueGrowthBeatStatus(report: GeneratedReport): BeatStatusResult {
  const text = (report.summary || '').toLowerCase();
  const keyMetricsText = (report.keyMetrics || [])
    .map(m => `${m.label || ''} ${m.value || ''} ${m.trend || ''}`)
    .join(' ')
    .toLowerCase();

  const searchText = `${text} ${keyMetricsText}`;

  // Look for patterns like "revenue growth BEAT", "omsättningstillväxt överträffa", etc.
  const beatPattern = /(?:revenue\s+growth|omsättningstillväxt|intäktsstillväxt)\s+(?:beat|överträffa|översteg|bättre än)\s*(?:expectations|förväntningar|estimat)?\s*(?:\(?\+?(\d+(?:\.\d+)?)%?\)?)?/i;
  const missPattern = /(?:revenue\s+growth|omsättningstillväxt|intäktsstillväxt)\s+(?:miss|missed|under|understeg|sämre än)\s*(?:expectations|förväntningar|estimat)?\s*(?:\(?\-?(\d+(?:\.\d+)?)%?\)?)?/i;
  const inLinePattern = /(?:revenue\s+growth|omsättningstillväxt|intäktsstillväxt)\s+(?:in\s+line|i\s+linje|motsvarade)\s*(?:expectations|förväntningar|estimat)?/i;

  const beatMatch = searchText.match(beatPattern);
  if (beatMatch) {
    const percent = beatMatch[1] ? parseFloat(beatMatch[1]) : undefined;
    return { status: 'beat', percent };
  }

  const missMatch = searchText.match(missPattern);
  if (missMatch) {
    const percent = missMatch[1] ? parseFloat(missMatch[1]) : undefined;
    return { status: 'miss', percent };
  }

  if (inLinePattern.test(searchText)) {
    return { status: 'in_line' };
  }

  // Also check keyMetrics for revenue growth-related metrics
  const revenueGrowthMetric = report.keyMetrics?.find(m => {
    const label = (m.label || '').toLowerCase();
    return (
      label.includes('revenue growth') ||
      label.includes('omsättningstillväxt') ||
      label.includes('intäktsstillväxt') ||
      (label.includes('growth') && (label.includes('revenue') || label.includes('omsättning')))
    );
  });

  if (revenueGrowthMetric) {
    const trend = (revenueGrowthMetric.trend || '').toLowerCase();
    if (trend.includes('beat') || trend.includes('överträffa') || trend.match(/\+/)) {
      const percentMatch = trend.match(/(\d+(?:\.\d+)?)%/);
      const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;
      return { status: 'beat', percent };
    }
    if (trend.includes('miss') || trend.includes('understeg') || trend.match(/\-/)) {
      const percentMatch = trend.match(/(\d+(?:\.\d+)?)%/);
      const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;
      return { status: 'miss', percent };
    }
  }

  return { status: null };
}

/**
 * Extract key driver from summary or keyPoints
 */
export function extractKeyDriver(report: GeneratedReport): string | null {
  const text = report.summary || '';
  const keyPoints = report.keyPoints || [];

  // Look for patterns like "key driver:", "huvuddriver:", "driven by", "främst drivet av"
  const driverPattern = /(?:key\s+driver|huvuddriver|främst\s+drivet\s+av|driven\s+by|främsta\s+faktorn)[:：]\s*(.+?)(?:\.|$)/i;
  const match = text.match(driverPattern);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Also check keyPoints for driver-related content
  const driverPoint = keyPoints.find(point => {
    const lowerPoint = point.toLowerCase();
    return (
      lowerPoint.includes('driver') ||
      lowerPoint.includes('driveras') ||
      lowerPoint.includes('drivet') ||
      lowerPoint.includes('främst')
    );
  });

  if (driverPoint) {
    // Try to extract just the key phrase
    const cleanPoint = driverPoint.replace(/^(?:key\s+driver|huvuddriver)[:：]\s*/i, '').trim();
    return cleanPoint.length > 100 ? cleanPoint.substring(0, 100) + '...' : cleanPoint;
  }

  return null;
}

