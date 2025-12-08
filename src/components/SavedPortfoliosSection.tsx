import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolios } from '@/hooks/usePortfolios';
import { Portfolio, usePortfolio } from '@/hooks/usePortfolio';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import {
  Briefcase,
  Calendar,
  TrendingUp,
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PortfolioGeneratedNotification from '@/components/PortfolioGeneratedNotification';
import { useAdvisorPlan } from '@/utils/advisorPlan';

interface SavedPortfoliosSectionProps {
  onViewPortfolio?: (portfolio: Portfolio) => void;
}

const SavedPortfoliosSection = ({ onViewPortfolio }: SavedPortfoliosSectionProps) => {
  const { portfolios, loading, refetch } = usePortfolios();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const { generatePortfolio, loading: portfolioGenerating } = usePortfolio();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [recommendationCount, setRecommendationCount] = useState<number | undefined>(undefined);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const { user } = useAuth();

  // Get advisor plan for the first portfolio (if exists) - hooks must be at top level
  // Always call hooks at top level, even if portfolio might not exist
  const firstPortfolio = portfolios[0];
  const advisorPlan = useAdvisorPlan(
    firstPortfolio?.asset_allocation?.structured_plan,
    firstPortfolio?.asset_allocation?.ai_strategy,
    firstPortfolio?.asset_allocation?.ai_strategy_raw
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: sv });
    } catch {
      return dateString;
    }
  };

  const handleGenerateNewPortfolio = async () => {
    if (!riskProfile || !riskProfile.id) {
      toast({
        title: 'Riskprofil saknas',
        description: 'Du behöver en riskprofil för att generera en portfölj. Skapa en riskprofil först.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Build conversationData from risk profile to ensure all data is used
      const conversationData = {
        age: riskProfile.age ?? undefined,
        annualIncome: riskProfile.annual_income ?? undefined,
        monthlyAmount: riskProfile.monthly_investment_amount?.toString(),
        monthlyAmountNumeric: riskProfile.monthly_investment_amount ?? undefined,
        riskTolerance: riskProfile.risk_tolerance ?? undefined,
        timeHorizon: riskProfile.investment_horizon ?? undefined,
        investmentGoal: riskProfile.investment_goal ?? undefined,
        investmentExperienceLevel: riskProfile.investment_experience ?? undefined,
        sectorInterests: riskProfile.sector_interests && riskProfile.sector_interests.length > 0 
          ? riskProfile.sector_interests 
          : undefined,
        preferredAssets: riskProfile.preferred_assets && riskProfile.preferred_assets.length > 0
          ? riskProfile.preferred_assets
          : undefined,
        liquidCapital: riskProfile.liquid_capital?.toString(),
        availableCapital: riskProfile.liquid_capital ?? undefined,
        housingSituation: riskProfile.housing_situation ?? undefined,
        hasLoans: riskProfile.has_loans ?? undefined,
        loanDetails: riskProfile.loan_details ?? undefined,
        hasChildren: riskProfile.has_children ?? undefined,
        emergencyBufferMonths: riskProfile.emergency_buffer_months ?? undefined,
        investmentPurpose: riskProfile.investment_purpose && riskProfile.investment_purpose.length > 0
          ? riskProfile.investment_purpose
          : undefined,
        targetAmount: riskProfile.target_amount?.toString(),
        targetDate: riskProfile.target_date ?? undefined,
        riskComfortLevel: riskProfile.risk_comfort_level ?? undefined,
        panicSellingHistory: riskProfile.panic_selling_history ?? undefined,
        controlImportance: riskProfile.control_importance ?? undefined,
        marketCrashReaction: riskProfile.market_crash_reaction ?? undefined,
        sustainabilityPreference: riskProfile.sustainability_focus ?? undefined,
        portfolioHelpFocus: riskProfile.portfolio_help_focus ?? undefined,
        currentPortfolioStrategy: riskProfile.current_portfolio_strategy ?? undefined,
        optimizationGoals: riskProfile.optimization_goals && riskProfile.optimization_goals.length > 0
          ? riskProfile.optimization_goals
          : undefined,
        optimizationRiskFocus: riskProfile.optimization_risk_focus ?? undefined,
        optimizationDiversificationFocus: riskProfile.optimization_diversification_focus && riskProfile.optimization_diversification_focus.length > 0
          ? riskProfile.optimization_diversification_focus
          : undefined,
        optimizationPreference: riskProfile.optimization_preference ?? undefined,
        optimizationTimeline: riskProfile.optimization_timeline ?? undefined,
        portfolioChangeFrequency: riskProfile.portfolio_change_frequency ?? undefined,
        activityPreference: riskProfile.activity_preference ?? undefined,
        investmentStylePreference: riskProfile.investment_style_preference ?? undefined,
        preferredStockCount: riskProfile.preferred_stock_count ?? undefined,
        currentPortfolioValue: riskProfile.current_portfolio_value?.toString(),
        overexposureAwareness: riskProfile.overexposure_awareness ?? undefined,
      };

      // Remove undefined values to keep the object clean
      Object.keys(conversationData).forEach(key => {
        if (conversationData[key as keyof typeof conversationData] === undefined) {
          delete conversationData[key as keyof typeof conversationData];
        }
      });

      // Call generate-portfolio with conversationData to use all available risk profile data
      const { data, error } = await supabase.functions.invoke('generate-portfolio', {
        body: {
          riskProfileId: riskProfile.id,
          userId: user?.id,
          conversationData: conversationData,
          mode: 'new'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Portfolio generation failed: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('Portfolio generation was not successful:', data);
        throw new Error(data?.error || 'Failed to generate portfolio - unknown error');
      }

      // Refetch portfolios to show the new one
      await refetch();
      
      // Get recommendation count from the generated portfolio
      const recommendedStocks = data.portfolio?.recommended_stocks || [];
      const count = Array.isArray(recommendedStocks) ? recommendedStocks.length : 0;
      setRecommendationCount(count);
      
      // Reset show all recommendations state
      setShowAllRecommendations(false);
      
      // Show notification popup
      setShowNotification(true);
      
      toast({
        title: 'Portfölj genererad',
        description: 'Din nya portfölj har skapats med all tillgänglig riskprofil-data och visas nu.',
      });
    } catch (error: any) {
      console.error('Error generating portfolio:', error);
      toast({
        title: 'Fel vid generering',
        description: error?.message || 'Kunde inte generera portfölj. Försök igen senare.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 rounded-2xl sm:rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Laddar portföljer...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (portfolios.length === 0) {
    return (
      <Card className="border-0 rounded-2xl sm:rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex justify-end w-full mb-6">
              <Button
                onClick={handleGenerateNewPortfolio}
                disabled={isGenerating || !riskProfile || !riskProfile.id || riskProfileLoading}
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Genererar...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Generera ny portfölj</span>
                    <span className="sm:hidden">Ny</span>
                  </>
                )}
              </Button>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-6 border border-blue-200/30 dark:border-blue-700/30">
              <Briefcase className="w-8 h-8 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Ingen portfölj genererad än</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-center">
              När du genererar en portfölj via Portfolio Advisor kommer den att sparas här så att du kan gå tillbaka och granska den senare.
            </p>
            <Button
              onClick={() => navigate('/portfolio-advisor')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl sm:rounded-2xl font-medium transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Generera portfölj
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PortfolioGeneratedNotification
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        recommendationCount={recommendationCount}
      />
      <Card className="border-0 rounded-2xl sm:rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <CardContent className="p-4 sm:p-6 md:p-8">
        {portfolios.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateNewPortfolio}
                disabled={isGenerating || portfolioGenerating || !riskProfile || !riskProfile.id || riskProfileLoading || loading}
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating || portfolioGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Genererar...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Generera ny portfölj</span>
                    <span className="sm:hidden">Ny</span>
                  </>
                )}
              </Button>
            </div>
            {(() => {
              const portfolio = portfolios[0];
              
              // Extract summary from structured plan
              const summary = advisorPlan?.action_summary || portfolio.asset_allocation?.structured_plan?.action_summary || portfolio.asset_allocation?.structured_plan?.summary || 
                             'AI-genererad portfölj';
              const riskAlignment = advisorPlan?.risk_alignment;

              const recommendedStocks = portfolio.recommended_stocks || [];
              const stockCount = recommendedStocks.length;

              return (
                <div className="group p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/60 to-slate-50/30 dark:from-slate-800/60 dark:to-slate-700/30 border border-slate-200/40 dark:border-slate-700/40 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">
                          {portfolio.portfolio_name}
                        </h3>
                        {portfolio.portfolio_name === 'Portföljsammanfattning gjord av AI' ? (
                          <Badge variant="secondary" className="text-xs flex-shrink-0 rounded-lg px-2 py-0.5">
                            Analys
                          </Badge>
                        ) : portfolio.is_active ? (
                          <Badge variant="default" className="text-xs flex-shrink-0 rounded-lg px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                            Aktiv
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                        <div className="flex items-center gap-2 group/item">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center border border-orange-200/30 dark:border-orange-700/30">
                            <Calendar className="w-4 h-4 text-transparent bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text" />
                          </div>
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{formatDate(portfolio.created_at)}</span>
                        </div>
                        {stockCount > 0 && (
                          <div className="flex items-center gap-2 group/item">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center border border-green-200/30 dark:border-green-700/30">
                              <FileText className="w-4 h-4 text-transparent bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text" />
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{stockCount} rekommendation{stockCount !== 1 ? 'er' : ''}</span>
                          </div>
                        )}
                        {portfolio.risk_score && (
                          <div className="flex items-center gap-2 group/item">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border border-purple-200/30 dark:border-purple-700/30">
                              <TrendingUp className="w-4 h-4 text-transparent bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text" />
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Risk: {portfolio.risk_score}/10</span>
                          </div>
                        )}
                      </div>
                      {summary && (
                        <p className="text-base sm:text-lg font-bold leading-relaxed text-foreground mb-4">
                          {typeof summary === 'string' ? summary : JSON.stringify(summary)}
                        </p>
                      )}
                      {riskAlignment && riskAlignment !== summary && (
                        <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-foreground/70 mb-4 break-words">
                          {riskAlignment}
                        </p>
                      )}
                      
                      {recommendedStocks.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Förslag:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                            {(showAllRecommendations ? recommendedStocks : recommendedStocks.slice(0, 6)).map((stock: any, index: number) => (
                              <div 
                                key={index} 
                                className="p-2 sm:p-3 md:p-4 border border-slate-200/60 dark:border-slate-700/60 rounded-lg hover:shadow-md transition-shadow overflow-hidden bg-white/50 dark:bg-slate-800/50"
                              >
                                <div className="flex justify-between items-start mb-1 sm:mb-2 gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-xs sm:text-sm break-words overflow-wrap-anywhere line-clamp-2">
                                      {stock.name || stock.symbol}
                                    </h4>
                                    {stock.sector && (
                                      <p className="text-xs text-muted-foreground break-words overflow-wrap-anywhere line-clamp-1 mt-0.5">
                                        {stock.sector}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs flex-shrink-0 whitespace-nowrap">
                                    {stock.allocation || '5'}%
                                  </Badge>
                                </div>
                                {stock.reasoning && (
                                  <p className="text-xs text-muted-foreground mt-1 sm:mt-2 break-words overflow-wrap-anywhere leading-relaxed line-clamp-2">
                                    {stock.reasoning}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          {recommendedStocks.length > 6 && (
                            <Button
                              onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                              variant="ghost"
                              size="sm"
                              className="mt-3 text-xs sm:text-sm text-primary hover:text-primary/80 hover:bg-primary/10"
                            >
                              {showAllRecommendations ? 'Visa färre' : `Visa alla (${recommendedStocks.length})`}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex justify-end w-full mb-6">
              <Button
                onClick={handleGenerateNewPortfolio}
                disabled={isGenerating || !riskProfile || !riskProfile.id || riskProfileLoading}
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Genererar...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Generera ny portfölj</span>
                    <span className="sm:hidden">Ny</span>
                  </>
                )}
              </Button>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-6 border border-blue-200/30 dark:border-blue-700/30">
              <Briefcase className="w-8 h-8 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Ingen portfölj genererad än</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-center">
              När du genererar en portfölj via Portfolio Advisor kommer den att sparas här så att du kan gå tillbaka och granska den senare.
            </p>
            <Button
              onClick={() => navigate('/portfolio-advisor')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl sm:rounded-2xl font-medium transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Generera portfölj
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};

export default SavedPortfoliosSection;
