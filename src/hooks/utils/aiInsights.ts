import { Database } from '@/integrations/supabase/types';

export interface AIInsight {
  title: string;
  message: string;
  type: 'performance' | 'allocation' | 'risk' | 'opportunity';
  confidence: number;
}

export interface DailyBriefSource {
  title: string;
  url: string;
}

export interface DailyBriefPayload {
  headline: string;
  summary: string;
  bullets: string[];
  ctaLabel: string;
  ctaUrl: string | null;
  sources: DailyBriefSource[];
}

const DEFAULT_CTA_LABEL = 'Fördjupa i AI-chatten';
const DEFAULT_CTA_URL = '/ai-chatt?message=Kan%20du%20f%C3%B6rdjupa%20dagens%20brief%3F';

const sanitizeBullets = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(entry => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(entry => entry.length > 0)
    .slice(0, 4);
};

const sanitizeSources = (value: unknown): DailyBriefSource[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as { title?: unknown; url?: unknown };
      const url = typeof candidate.url === 'string' ? candidate.url.trim() : null;
      if (!url) return null;
      const title = typeof candidate.title === 'string' && candidate.title.trim().length > 0
        ? candidate.title.trim()
        : 'Källa';
      return { title, url };
    })
    .filter((item): item is DailyBriefSource => Boolean(item))
    .slice(0, 5);
};

export const parsePortfolioAIResponse = (response: string): AIInsight[] => {
  const insights: AIInsight[] = [];
  const lines = response.split('\n').filter(line => line.trim());

  let currentInsight: Partial<AIInsight> = {};

  for (const line of lines) {
    if (line.includes('Insikt:') || line.includes('Rekommendation:') || line.includes('•')) {
      if (currentInsight.message) {
        insights.push({
          title: currentInsight.title || 'AI-insikt',
          message: currentInsight.message,
          type: 'opportunity',
          confidence: 0.85,
        });
      }
      currentInsight = {
        title: 'AI-insikt',
        message: line.replace(/^[•-]\s*/, '').replace(/Insikt:\s*/, '').replace(/Rekommendation:\s*/, ''),
      };
    } else if (currentInsight.message && line.trim()) {
      currentInsight.message += ' ' + line.trim();
    }
  }

  if (currentInsight.message) {
    insights.push({
      title: currentInsight.title || 'AI-insikt',
      message: currentInsight.message,
      type: 'opportunity',
      confidence: 0.85,
    });
  }

  return insights.slice(0, 3);
};

export const parseDailyBriefPayload = (payload: unknown): DailyBriefPayload => {
  if (!payload || typeof payload !== 'object') {
    return {
      headline: 'Detta bör du veta idag',
      summary: '',
      bullets: [],
      ctaLabel: DEFAULT_CTA_LABEL,
      ctaUrl: DEFAULT_CTA_URL,
      sources: [],
    };
  }

  const candidate = payload as Record<string, unknown> & {
    cta?: { label?: unknown; url?: unknown };
  };

  const headline = typeof candidate.headline === 'string' && candidate.headline.trim().length > 0
    ? candidate.headline.trim()
    : 'Detta bör du veta idag';
  const summary = typeof candidate.summary === 'string' ? candidate.summary.trim() : '';
  const bullets = sanitizeBullets(candidate.bullets);
  const ctaLabel = typeof candidate.cta?.label === 'string' && candidate.cta.label.trim().length > 0
    ? candidate.cta.label.trim()
    : DEFAULT_CTA_LABEL;
  const ctaUrlRaw = typeof candidate.cta?.url === 'string' ? candidate.cta.url.trim() : '';
  const sources = sanitizeSources(candidate.sources);

  return {
    headline,
    summary,
    bullets,
    ctaLabel,
    ctaUrl: ctaUrlRaw.length > 0 ? ctaUrlRaw : DEFAULT_CTA_URL,
    sources,
  };
};

export const mapDailyBriefRow = (
  row: Database['public']['Tables']['daily_ai_briefs']['Row'] | null,
): (DailyBriefPayload & { createdAt: string }) | null => {
  if (!row) return null;

  const highlights = sanitizeBullets(row.highlights);
  const sources = sanitizeSources(row.tavily_results);

  return {
    headline: row.headline,
    summary: row.summary?.trim() ?? '',
    bullets: highlights,
    ctaLabel: DEFAULT_CTA_LABEL,
    ctaUrl: row.cta_url ?? DEFAULT_CTA_URL,
    sources,
    createdAt: row.created_at,
  };
};
