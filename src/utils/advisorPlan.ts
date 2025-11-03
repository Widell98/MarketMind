import { useMemo } from 'react';

export type AdvisorPlanAsset = {
  name: string;
  ticker?: string;
  allocation_percent: number;
  rationale?: string;
  risk_role?: string;
};

export type AdvisorPlan = {
  action_summary?: string;
  risk_alignment?: string;
  next_steps: string[];
  recommended_assets: AdvisorPlanAsset[];
  disclaimer?: string;
};

const toStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map(entry => (entry != null ? String(entry).trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n+|\.\s+/)
      .map(entry => entry.trim())
      .filter(Boolean);
  }
  return [];
};

export const parseAdvisorPlan = (value: unknown): AdvisorPlan | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      return parseAdvisorPlan(parsed);
    } catch (error) {
      console.warn('Failed to parse AI plan string as JSON:', error);
      return null;
    }
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const plan = value as Record<string, unknown>;
  const rawAssets = Array.isArray(plan.recommended_assets)
    ? plan.recommended_assets
    : Array.isArray(plan.recommendations)
      ? plan.recommendations
      : [];

  const recommended_assets: AdvisorPlanAsset[] = rawAssets
    .map((asset: any) => {
      if (!asset || !asset.name) return null;

      const allocationValue = asset.allocation_percent ?? asset.allocation ?? asset.weight;
      const allocation = typeof allocationValue === 'number'
        ? allocationValue
        : typeof allocationValue === 'string'
          ? parseFloat(allocationValue.replace(/[^\d.,-]/g, '').replace(',', '.'))
          : 0;

      return {
        name: String(asset.name).trim(),
        ticker: asset.ticker || asset.symbol || '',
        allocation_percent: Number.isFinite(allocation) ? Math.round(allocation) : 0,
        rationale: asset.rationale || asset.reasoning || asset.analysis || '',
        risk_role: asset.risk_role || asset.role || '',
      };
    })
    .filter(Boolean) as AdvisorPlanAsset[];

  const next_steps = toStringArray(plan.next_steps || plan.action_plan || plan.implementation_plan || plan.follow_up);

  return {
    action_summary: typeof plan.action_summary === 'string'
      ? plan.action_summary
      : typeof plan.summary === 'string'
        ? plan.summary
        : undefined,
    risk_alignment: typeof plan.risk_alignment === 'string'
      ? plan.risk_alignment
      : typeof plan.risk_analysis === 'string'
        ? plan.risk_analysis
        : undefined,
    next_steps,
    recommended_assets,
    disclaimer: typeof plan.disclaimer === 'string'
      ? plan.disclaimer
      : typeof plan.footer === 'string'
        ? plan.footer
        : undefined,
  };
};

export const useAdvisorPlan = (
  structuredPlan: unknown,
  aiStrategyData: unknown,
  aiStrategyRaw: unknown
): AdvisorPlan | null => {
  return useMemo(() => {
    return parseAdvisorPlan(structuredPlan)
      || parseAdvisorPlan(aiStrategyData)
      || parseAdvisorPlan(aiStrategyRaw);
  }, [structuredPlan, aiStrategyData, aiStrategyRaw]);
};
