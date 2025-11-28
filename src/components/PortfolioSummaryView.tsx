import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Portfolio } from '@/hooks/usePortfolio';
import { useAdvisorPlan } from '@/utils/advisorPlan';
import {
  Sparkles,
  Brain,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

interface PortfolioSummaryViewProps {
  portfolio: Portfolio;
}

const PortfolioSummaryView = ({ portfolio }: PortfolioSummaryViewProps) => {
  const structuredPlan = portfolio.asset_allocation?.structured_plan;
  const advisorPlan = useAdvisorPlan(
    structuredPlan,
    portfolio.asset_allocation?.ai_strategy,
    portfolio.asset_allocation?.ai_strategy_raw
  );

  if (!advisorPlan) {
    return null;
  }

  const isAnalysis = portfolio.portfolio_name === 'Portföljsammanfattning gjord av AI';
  const formatPercentValue = (value: number | undefined): string | null => {
    if (value === undefined || value === null || !Number.isFinite(value)) return null;
    return `${Math.round(value)}%`;
  };

  const displayNextSteps = advisorPlan.next_steps || [];
  const recommendedAssets = advisorPlan.recommended_assets || [];

  return (
    <div className="space-y-6 text-base leading-relaxed text-foreground animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      {/* Main summary card - Enhanced */}
      <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-3 shadow-md">
              {isAnalysis ? (
                <Brain className="h-6 w-6" />
              ) : (
                <Sparkles className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-2 flex-1">
              {advisorPlan.action_summary && (
                <p className="text-xl font-bold text-foreground leading-7">{advisorPlan.action_summary}</p>
              )}
              {advisorPlan.risk_alignment && (
                <p className="text-sm leading-6 text-foreground/80">{advisorPlan.risk_alignment}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-4">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold px-3 py-1.5">
              {isAnalysis ? '🔍 Portföljanalys' : '✨ Portföljplan'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Why section - Enhanced */}
      {advisorPlan.risk_alignment && (
        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-card/80 to-card/40 p-6 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wider text-foreground">Varför denna bedömning?</p>
          </div>
          <p className="text-base leading-7 text-foreground/90 pl-12">{advisorPlan.risk_alignment}</p>
        </div>
      )}

      {/* Next steps */}
      {displayNextSteps.length > 0 && (
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-card/90 to-card/50 shadow-lg backdrop-blur-sm">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-3 border border-blue-500/20">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Så går du vidare</p>
              <CardTitle className="text-xl font-bold text-foreground">Prioriterade nästa steg</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pl-4">
            <ol className="space-y-3 list-none text-base leading-7">
              {displayNextSteps.map((step, index) => (
                <li key={`step-${index}`} className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-sm font-bold text-primary mt-0.5 group-hover:bg-primary/20 transition-colors">
                    {index + 1}
                  </div>
                  <span className="flex-1 text-foreground pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Recommended assets / Analysis recommendations */}
      {recommendedAssets.length > 0 && (
        <div className="space-y-4 rounded-xl border-2 border-primary/10 bg-gradient-to-br from-card/90 to-card/50 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-base font-bold uppercase tracking-wide text-foreground">
                {isAnalysis ? 'Rekommendationer och analys' : 'Föreslagna åtgärder per tillgång'}
              </h4>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
              {recommendedAssets.length} {isAnalysis ? 'rekommendationer' : 'förslag'}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendedAssets.map((asset, index) => {
              const allocationDisplay = formatPercentValue(asset.allocation_percent);

              return (
                <div
                  key={`${asset.name}-${index}`}
                  className="group flex h-full flex-col gap-4 rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-card/50 p-5 shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-lg font-bold text-foreground">{asset.name}</p>
                        {asset.ticker && (
                          <Badge variant="outline" className="text-xs uppercase tracking-wide border-primary/30 bg-primary/5 text-primary font-semibold">
                            {asset.ticker}
                          </Badge>
                        )}
                      </div>
                      {asset.risk_role && (
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                          Roll: {asset.risk_role}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs">
                      {allocationDisplay && (
                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold">
                          {allocationDisplay}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {asset.rationale && (
                    <p className="text-sm leading-6 text-foreground/80 border-t border-border/40 pt-3">{asset.rationale}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {advisorPlan.disclaimer && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mt-2">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium text-center leading-5">
            ⚠️ {advisorPlan.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummaryView;
