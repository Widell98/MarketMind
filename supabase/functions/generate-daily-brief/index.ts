import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PortfolioRecord = {
  id: string;
  user_id: string;
  name: string | null;
};

type DailyBriefResponse = {
  headline?: string;
  summary?: string;
  bullets?: string[];
  cta?: {
    label?: string;
    url?: string;
  };
  sources?: Array<{
    title?: string;
    url?: string;
  }>;
};

const DEFAULT_CTA = {
  label: 'Fördjupa i AI-chatten',
  url: '/ai-chatt?message=Kan%20du%20f%C3%B6rdjupa%20dagens%20brief%3F',
};

const sanitizeBullets = (bullets: unknown): string[] => {
  if (!Array.isArray(bullets)) return [];
  return bullets
    .map(item => typeof item === 'string' ? item.trim() : '')
    .filter(item => item.length > 0)
    .slice(0, 4);
};

const sanitizeSources = (sources: unknown) => {
  if (!Array.isArray(sources)) return [] as { title: string; url: string }[];
  return sources
    .map((source: unknown) => {
      if (!source || typeof source !== 'object') return null;
      const candidate = source as { title?: unknown; url?: unknown };
      const title = typeof candidate.title === 'string' ? candidate.title.trim() : null;
      const url = typeof candidate.url === 'string' ? candidate.url.trim() : null;
      if (!url) return null;
      return {
        title: title && title.length > 0 ? title : 'Källa',
        url,
      };
    })
    .filter((item): item is { title: string; url: string } => Boolean(item))
    .slice(0, 5);
};

const parseDailyBrief = (raw: unknown): DailyBriefResponse => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as DailyBriefResponse;
  return {};
};

const buildDailyBriefMessage = (portfolio: PortfolioRecord) => {
  const portfolioName = portfolio.name ? portfolio.name : 'din aktiva portfölj';
  return `Ge mig den senaste AI-briefen om marknaden idag. Fokusera på vad som hänt det senaste dygnet och hur det påverkar ${portfolioName}. Inkludera nyckelorden senaste och idag samt konkreta rubriker.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: portfolios, error: portfolioError } = await supabase
      .from('user_portfolios')
      .select('id, user_id, name')
      .eq('is_active', true)
      .not('user_id', 'is', null);

    if (portfolioError) {
      console.error('Failed to load active portfolios:', portfolioError);
      throw portfolioError;
    }

    const activePortfolios = Array.isArray(portfolios) ? portfolios.filter((p): p is PortfolioRecord => Boolean(p?.id) && Boolean(p?.user_id)) : [];
    const results: Array<{ portfolioId: string; status: 'inserted' | 'skipped'; reason?: string }> = [];

    for (const portfolio of activePortfolios) {
      try {
        const message = buildDailyBriefMessage(portfolio);
        const payload = {
          userId: portfolio.user_id,
          portfolioId: portfolio.id,
          message,
          analysisType: 'daily_brief',
          chatHistory: [],
          scheduled: true,
        };

        const response = await fetch(`${supabaseUrl}/functions/v1/portfolio-ai-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.text();
          console.error('portfolio-ai-chat error:', body);
          results.push({ portfolioId: portfolio.id, status: 'skipped', reason: `AI call failed: ${response.status}` });
          continue;
        }

        const { response: aiResponse } = await response.json() as { response?: unknown };
        const parsed = parseDailyBrief(aiResponse);

        const headline = typeof parsed.headline === 'string' && parsed.headline.trim().length > 0
          ? parsed.headline.trim()
          : 'Detta bör du veta idag';
        const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : null;
        const bullets = sanitizeBullets(parsed.bullets);
        const sources = sanitizeSources(parsed.sources);
        const ctaUrl = typeof parsed.cta?.url === 'string' && parsed.cta.url.trim().length > 0
          ? parsed.cta.url.trim()
          : DEFAULT_CTA.url;

        const { error: insertError } = await supabase
          .from('daily_ai_briefs')
          .insert({
            user_id: portfolio.user_id,
            portfolio_id: portfolio.id,
            headline,
            summary,
            highlights: bullets,
            cta_url: ctaUrl,
            tavily_results: sources,
          });

        if (insertError) {
          console.error('Failed to store daily brief:', insertError);
          results.push({ portfolioId: portfolio.id, status: 'skipped', reason: 'insert_failed' });
          continue;
        }

        results.push({ portfolioId: portfolio.id, status: 'inserted' });
      } catch (error) {
        console.error(`Failed to generate brief for portfolio ${portfolio.id}:`, error);
        results.push({ portfolioId: portfolio.id, status: 'skipped', reason: 'exception' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('generate-daily-brief failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
