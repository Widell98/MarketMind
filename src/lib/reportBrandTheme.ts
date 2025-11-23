import { cn } from '@/lib/utils';

export type ReportBrandTheme = {
  cardGradient: string;
  headerGradient: string;
  glow: string;
  accentText: string;
  chipBg: string;
  chipBorder: string;
  mutedPanel: string;
  panelBorder: string;
  metricBg: string;
  metricBorder: string;
  logoGradient: string;
  logoRing: string;
  badgeBg: string;
};

const reportBrandThemes: ReportBrandTheme[] = [
  {
    cardGradient: 'from-white via-sky-50/80 to-sky-100/60',
    headerGradient: 'from-sky-50 via-blue-50 to-white',
    glow: 'from-sky-300/30 via-blue-200/25 to-transparent',
    accentText: 'text-sky-800',
    chipBg: 'bg-sky-100 text-sky-800',
    chipBorder: 'border-sky-200',
    mutedPanel: 'bg-sky-50/60',
    panelBorder: 'border-sky-100',
    metricBg: 'bg-white/90',
    metricBorder: 'border-sky-100/80',
    logoGradient: 'from-sky-400 via-blue-500 to-indigo-500',
    logoRing: 'ring-sky-200/80',
    badgeBg: 'bg-sky-50 text-sky-800',
  },
  {
    cardGradient: 'from-white via-emerald-50/70 to-emerald-100/60',
    headerGradient: 'from-emerald-50 via-emerald-100 to-white',
    glow: 'from-emerald-300/30 via-teal-200/25 to-transparent',
    accentText: 'text-emerald-800',
    chipBg: 'bg-emerald-100 text-emerald-800',
    chipBorder: 'border-emerald-200',
    mutedPanel: 'bg-emerald-50/60',
    panelBorder: 'border-emerald-100',
    metricBg: 'bg-white/90',
    metricBorder: 'border-emerald-100/80',
    logoGradient: 'from-emerald-400 via-teal-500 to-green-600',
    logoRing: 'ring-emerald-200/80',
    badgeBg: 'bg-emerald-50 text-emerald-800',
  },
  {
    cardGradient: 'from-white via-amber-50/75 to-orange-100/60',
    headerGradient: 'from-amber-50 via-orange-50 to-white',
    glow: 'from-amber-300/30 via-orange-200/25 to-transparent',
    accentText: 'text-amber-800',
    chipBg: 'bg-amber-100 text-amber-800',
    chipBorder: 'border-amber-200',
    mutedPanel: 'bg-amber-50/60',
    panelBorder: 'border-amber-100',
    metricBg: 'bg-white/90',
    metricBorder: 'border-amber-100/80',
    logoGradient: 'from-amber-400 via-orange-500 to-amber-600',
    logoRing: 'ring-amber-200/80',
    badgeBg: 'bg-amber-50 text-amber-800',
  },
  {
    cardGradient: 'from-white via-violet-50/80 to-indigo-100/60',
    headerGradient: 'from-violet-50 via-indigo-50 to-white',
    glow: 'from-violet-300/30 via-indigo-200/25 to-transparent',
    accentText: 'text-violet-800',
    chipBg: 'bg-violet-100 text-violet-800',
    chipBorder: 'border-violet-200',
    mutedPanel: 'bg-violet-50/60',
    panelBorder: 'border-violet-100',
    metricBg: 'bg-white/90',
    metricBorder: 'border-violet-100/80',
    logoGradient: 'from-violet-400 via-indigo-500 to-purple-600',
    logoRing: 'ring-violet-200/80',
    badgeBg: 'bg-violet-50 text-violet-800',
  },
];

const defaultTheme = reportBrandThemes[0];

const stringHash = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getReportBrandTheme = (companyName?: string): ReportBrandTheme => {
  if (!companyName) return defaultTheme;
  const index = stringHash(companyName) % reportBrandThemes.length;
  return reportBrandThemes[index] ?? defaultTheme;
};

export const themedClassNames = (theme: ReportBrandTheme) => ({
  cardBackground: cn('bg-gradient-to-b', theme.cardGradient),
  headerBackground: cn('bg-gradient-to-r', theme.headerGradient),
  chip: cn('rounded-full px-3 py-1 text-xs font-semibold', theme.chipBg),
});
