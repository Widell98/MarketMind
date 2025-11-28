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
  BarChart3,
  Shield,
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
    <div className="space-y-4 sm:space-y-6 text-sm sm:text-base leading-relaxed text-foreground animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      {/* Main summary card - Enhanced */}
      <div className="rounded-lg sm:rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-4 sm:p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-2 sm:p-3 shadow-md flex-shrink-0">
              {isAnalysis ? (
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              {advisorPlan.action_summary && (
                <p className="text-lg sm:text-xl font-bold text-foreground leading-6 sm:leading-7 break-words">{advisorPlan.action_summary}</p>
              )}
              {advisorPlan.risk_alignment && !isAnalysis && advisorPlan.risk_alignment !== advisorPlan.action_summary && (
                <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-foreground/80 break-words">{advisorPlan.risk_alignment}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">
              {isAnalysis ? '🔍 Portföljanalys' : '✨ Portföljplan'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Why section - Enhanced */}
      {advisorPlan.risk_alignment && !isAnalysis && (
        <div className="rounded-lg sm:rounded-xl border border-primary/10 bg-gradient-to-br from-card/80 to-card/40 p-4 sm:p-6 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">Varför denna bedömning?</p>
          </div>
          <p className="text-sm sm:text-base leading-6 sm:leading-7 text-foreground/90 pl-0 sm:pl-10 sm:pl-12 break-words">{advisorPlan.risk_alignment}</p>
        </div>
      )}

      {/* Portfolio Analysis Section - Only for analyses */}
      {isAnalysis && (
        <div className="rounded-lg sm:rounded-xl border-2 border-primary/10 bg-gradient-to-br from-card/90 to-card/50 p-4 sm:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground">Portföljanalys</h4>
          </div>

          {/* Risk Analysis */}
          {portfolio.risk_score && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <p className="text-xs sm:text-sm font-semibold text-foreground">Risknivå</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                    style={{ width: `${(portfolio.risk_score / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap">{portfolio.risk_score}/10</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {portfolio.risk_score <= 3 ? 'Konservativ riskprofil' : 
                 portfolio.risk_score <= 6 ? 'Måttlig riskprofil' : 
                 'Hög riskprofil'}
              </p>
            </div>
          )}

          {/* Detailed Analysis from risk_alignment - Larger and more prominent */}
          {advisorPlan.risk_alignment && (
            <div className="p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card/80 to-card/40 shadow-md backdrop-blur-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-foreground">Detaljerad analys</h4>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-sm sm:text-base leading-6 sm:leading-7 text-foreground/90 whitespace-pre-line break-words">
                  {advisorPlan.risk_alignment}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next steps - only show for new portfolios, not for analyses */}
      {!isAnalysis && displayNextSteps.length > 0 && (
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-card/90 to-card/50 shadow-lg backdrop-blur-sm">
          <CardHeader className="flex flex-row items-start gap-3 sm:gap-4 space-y-0 pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-2 sm:p-3 border border-blue-500/20 flex-shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Så går du vidare</p>
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Prioriterade nästa steg</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pl-3 sm:pl-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <ol className="space-y-2 sm:space-y-3 list-none text-sm sm:text-base leading-6 sm:leading-7">
              {displayNextSteps.map((step, index) => (
                <li key={`step-${index}`} className="flex items-start gap-3 sm:gap-4 group">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-xs sm:text-sm font-bold text-primary mt-0.5 group-hover:bg-primary/20 transition-colors">
                    {index + 1}
                  </div>
                  <span className="flex-1 text-foreground pt-0.5 break-words">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Recommended assets - only show for new portfolios, not for analyses */}
      {!isAnalysis && recommendedAssets.length > 0 && (
        <div className="space-y-3 sm:space-y-4 rounded-lg sm:rounded-xl border-2 border-primary/10 bg-gradient-to-br from-card/90 to-card/50 p-4 sm:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h4 className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground">
                Föreslagna åtgärder per tillgång
              </h4>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold px-2 sm:px-3 py-1 w-fit">
              {recommendedAssets.length} förslag
            </Badge>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            {recommendedAssets.map((asset, index) => {
              const allocationDisplay = formatPercentValue(asset.allocation_percent);

              return (
                <div
                  key={`${asset.name}-${index}`}
                  className="group flex h-full flex-col gap-3 sm:gap-4 rounded-lg sm:rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-card/50 p-4 sm:p-5 shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="text-base sm:text-lg font-bold text-foreground break-words">{asset.name}</p>
                        {asset.ticker && (
                          <Badge variant="outline" className="text-xs uppercase tracking-wide border-primary/30 bg-primary/5 text-primary font-semibold flex-shrink-0">
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
                    <div className="flex flex-col items-end gap-2 text-xs flex-shrink-0">
                      {allocationDisplay && (
                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold">
                          {allocationDisplay}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {asset.rationale && (
                    <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-foreground/80 border-t border-border/40 pt-2 sm:pt-3 break-words">{asset.rationale}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {advisorPlan.disclaimer && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 sm:p-4 mt-2">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium text-center leading-4 sm:leading-5 break-words">
            ⚠️ {advisorPlan.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummaryView;
