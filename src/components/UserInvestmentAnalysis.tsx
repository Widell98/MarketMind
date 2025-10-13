import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User, Target, TrendingUp, DollarSign, Calendar, PieChart, Brain, BarChart3, AlertCircle, CheckCircle, Settings, Plus, Activity } from 'lucide-react';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import ResetProfileConfirmDialog from '@/components/ResetProfileConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
interface UserInvestmentAnalysisProps {
  onUpdateProfile?: () => void;
}

type AdvisorPlanAsset = {
  name: string;
  ticker?: string;
  allocation_percent: number;
  rationale?: string;
  risk_role?: string;
};

type AdvisorPlan = {
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

const parseAdvisorPlan = (value: unknown): AdvisorPlan | null => {
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
const UserInvestmentAnalysis = ({
  onUpdateProfile
}: UserInvestmentAnalysisProps) => {
  const {
    riskProfile,
    loading: riskLoading,
    clearRiskProfile
  } = useRiskProfile();
  const {
    activePortfolio,
    loading: portfolioLoading
  } = usePortfolio();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  // Function to format AI strategy text with proper CSS styling
  const formatAIStrategy = (text: string) => {
    if (!text) return text;

    // Split text into lines for processing
    const lines = text.split('\n');
    const formattedLines = lines.map((line, index) => {
      // Check if line contains percentage allocation (like "Svenska och nordiska aktier (20%)")
      const percentageMatch = line.match(/^#+\s*(.+?)\s*\((\d+)%\)/);
      if (percentageMatch) {
        const [, sectionName, percentage] = percentageMatch;
        return <h3 key={index} className="text-lg font-bold text-green-700 dark:text-green-300 mt-4 mb-2 pb-1 border-b-2 border-green-200 dark:border-green-700">
            {sectionName.trim()} ({percentage}%)
          </h3>;
      }

      // Check for other markdown headers
      const headerMatch = line.match(/^(#+)\s*(.+)/);
      if (headerMatch) {
        const [, hashes, title] = headerMatch;
        const level = hashes.length;
        if (level === 1) {
          return <h1 key={index} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              {title.trim()}
            </h1>;
        } else if (level === 2) {
          return <h2 key={index} className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-5 mb-2">
              {title.trim()}
            </h2>;
        } else if (level === 3) {
          return <h3 key={index} className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">
              {title.trim()}
            </h3>;
        }
      }

      // Regular text line
      if (line.trim()) {
        return <p key={index} className="mb-2 leading-relaxed">
            {line.trim()}
          </p>;
      }

      // Empty line
      return <br key={index} />;
    });
    return <div className="space-y-1">{formattedLines}</div>;
  };
  const handleResetProfile = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att återställa din profil",
        variant: "destructive"
      });
      return;
    }
    try {
      // First, clear AI recommendations from user_holdings
      const {
        error: holdingsError
      } = await supabase.from('user_holdings').delete().eq('user_id', user.id).eq('holding_type', 'recommendation');
      if (holdingsError) {
        console.error('Error clearing AI recommendations:', holdingsError);
      }

      // Then clear the risk profile
      if (clearRiskProfile) {
        const success = await clearRiskProfile();
        if (success) {
          toast({
            title: "Profil återställd",
            description: "Din riskprofil och AI-rekommendationer har raderats."
          });
          if (onUpdateProfile) {
            onUpdateProfile();
          }
          // Navigate to portfolio advisor to create new profile
          navigate('/portfolio-advisor');
        }
      }
    } catch (error) {
      console.error('Error resetting profile:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen senare.",
        variant: "destructive"
      });
    }
    setShowResetDialog(false);
  };
  const handleCreateNewProfile = () => {
    navigate('/portfolio-advisor');
  };
  const aiStrategyData = activePortfolio?.asset_allocation?.ai_strategy;
  const aiStrategyRaw = activePortfolio?.asset_allocation?.ai_strategy_raw;
  const structuredPlan = activePortfolio?.asset_allocation?.structured_plan;
  const conversationData = activePortfolio?.asset_allocation?.conversation_data || {};

  const advisorPlan = useMemo(() => {
    return parseAdvisorPlan(structuredPlan)
      || parseAdvisorPlan(aiStrategyData)
      || parseAdvisorPlan(aiStrategyRaw);
  }, [aiStrategyData, aiStrategyRaw, structuredPlan]);

  const aiStrategyText = useMemo(() => {
    if (advisorPlan) {
      return '';
    }

    const candidate = typeof aiStrategyData === 'string' && aiStrategyData.trim()
      ? aiStrategyData
      : typeof aiStrategyRaw === 'string'
        ? aiStrategyRaw
        : '';

    const trimmed = candidate.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return '';
      } catch (error) {
        console.warn('Failed to parse AI strategy JSON:', error);
      }
    }

    if (/https:\/\/deno\.land\//.test(trimmed)) {
      return '';
    }

    return trimmed;
  }, [advisorPlan, aiStrategyData, aiStrategyRaw]);

  if (riskLoading || portfolioLoading) {
    return <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-48 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
          <div className="h-48 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
          <div className="h-64 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl animate-pulse border border-slate-200/50 dark:border-slate-700/50"></div>
        </div>
      </div>;
  }
  if (!riskProfile) {
    return <div className="space-y-8 animate-fade-in">
        {/* No Profile State - Apple-inspired */}
        <Card className="border-dashed border-2 rounded-3xl shadow-lg bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
          <CardContent className="flex flex-col items-center justify-center py-16 px-8">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto shadow-inner border border-blue-200/30 dark:border-blue-700/30">
                  <Brain className="w-12 h-12 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
                Ingen riskprofil hittades
              </h3>
              <p className="text-lg mb-8 max-w-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Du behöver skapa en riskprofil för att få personliga investeringsrekommendationer och AI-analys.
              </p>
              <Button 
                onClick={handleCreateNewProfile} 
                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Skapa ny riskprofil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  const getRiskToleranceLabel = (tolerance: string) => {
    switch (tolerance) {
      case 'conservative':
        return 'Konservativ';
      case 'moderate':
        return 'Måttlig';
      case 'aggressive':
        return 'Aggressiv';
      default:
        return tolerance || 'Ej angiven';
    }
  };
  const getInvestmentHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'short':
        return 'Kort (1-3 år)';
      case 'medium':
        return 'Medel (3-7 år)';
      case 'long':
        return 'Lång (7+ år)';
      default:
        return horizon || 'Ej angiven';
    }
  };
  const getExperienceLabel = (experience: string) => {
    switch (experience) {
      case 'beginner':
        return 'Nybörjare';
      case 'intermediate':
        return 'Mellannivå';
      case 'advanced':
        return 'Avancerad';
      default:
        return experience || 'Ej angiven';
    }
  };
  return <div className="space-y-10 animate-fade-in">
      <ResetProfileConfirmDialog isOpen={showResetDialog} onClose={() => setShowResetDialog(false)} onConfirm={handleResetProfile} />

      {/* Profile Summary - Apple-inspired design */}
      <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
        <CardHeader className="pb-8 pt-8">
          <CardTitle className="flex items-center gap-4 text-2xl font-bold">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center shadow-inner border border-blue-200/30 dark:border-blue-700/30">
              <User className="w-7 h-7 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
            </div>
            <span className="text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
              Din Investeringsprofil
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group p-6 bg-gradient-to-br from-white/60 to-slate-50/30 dark:from-slate-800/60 dark:to-slate-700/30 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center shadow-inner border border-orange-200/30 dark:border-orange-700/30 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-7 h-7 text-transparent bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Ålder</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{riskProfile.age || 'Ej angiven'} år</p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-white/60 to-slate-50/30 dark:from-slate-800/60 dark:to-slate-700/30 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center shadow-inner border border-green-200/30 dark:border-green-700/30 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-transparent bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Erfarenhetsnivå</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{getExperienceLabel(riskProfile.investment_experience || '')}</p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-white/60 to-slate-50/30 dark:from-slate-800/60 dark:to-slate-700/30 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center shadow-inner border border-purple-200/30 dark:border-purple-700/30 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 text-transparent bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Risktolerans</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{getRiskToleranceLabel(riskProfile.risk_tolerance || '')}</p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-white/60 to-slate-50/30 dark:from-slate-800/60 dark:to-slate-700/30 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center shadow-inner border border-blue-200/30 dark:border-blue-700/30 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-7 h-7 text-transparent bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Tidshorisont</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{getInvestmentHorizonLabel(riskProfile.investment_horizon || '')}</p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-white/60 to-slate-50/30 dark:from-slate-800/60 dark:to-slate-700/30 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex items-center justify-center shadow-inner border border-yellow-200/30 dark:border-yellow-700/30 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-7 h-7 text-transparent bg-gradient-to-br from-yellow-600 to-orange-600 bg-clip-text" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Månadssparande</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {riskProfile.monthly_investment_amount ? `${riskProfile.monthly_investment_amount.toLocaleString()} SEK` : 'Ej angiven'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-white/60 to-slate-50/30 dark:from-slate-800/60 dark:to-slate-700/30 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center shadow-inner border border-indigo-200/30 dark:border-indigo-700/30 group-hover:scale-110 transition-transform duration-300">
                  <PieChart className="w-7 h-7 text-transparent bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Riskkomfort</p>
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={(riskProfile.risk_comfort_level || 0) * 10} 
                      className="h-3 w-24 bg-slate-200 dark:bg-slate-700"
                    />
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{riskProfile.risk_comfort_level || 0}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => setShowResetDialog(true)}
              variant="outline"
              className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 border-slate-300/50 dark:border-slate-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 rounded-2xl px-6 py-2 transition-all duration-300"
            >
              <Settings className="w-4 h-4" />
              Återställ profil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Strategy - Structured plan presentation */}
      {advisorPlan && (
        <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-blue-50/30 dark:from-slate-900/90 dark:to-blue-900/10 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="pb-8 pt-8">
            <CardTitle className="flex items-center gap-4 text-2xl font-bold">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center shadow-inner border border-blue-200/30 dark:border-blue-700/30">
                <Brain className="w-7 h-7 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
              </div>
              <span className="text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
                Din AI-plan för nästa steg
              </span>
              <Badge className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text border-blue-300/30 dark:border-blue-700/30 rounded-2xl font-semibold px-4 py-2 shadow-sm">
                Personlig Analys
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="space-y-8">
              {(advisorPlan.action_summary || advisorPlan.risk_alignment) && (
                <div className="p-8 rounded-3xl bg-gradient-to-br from-white/70 to-blue-100/20 dark:from-slate-800/70 dark:to-blue-900/20 border border-blue-200/30 dark:border-blue-800/40 shadow-inner backdrop-blur-sm">
                  {advisorPlan.action_summary && (
                    <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-200 mb-4">
                      {advisorPlan.action_summary}
                    </p>
                  )}
                  {advisorPlan.risk_alignment && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {advisorPlan.risk_alignment}
                    </p>
                  )}
                </div>
              )}

              {advisorPlan.next_steps.length > 0 && (
                <div className="p-8 rounded-3xl bg-gradient-to-br from-white/70 to-slate-100/20 dark:from-slate-800/70 dark:to-slate-900/20 border border-slate-200/30 dark:border-slate-700/40 shadow-inner backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Handlingsplan</h3>
                  <ol className="list-decimal pl-6 space-y-3 text-base text-slate-700 dark:text-slate-300">
                    {advisorPlan.next_steps.map((step, index) => (
                      <li key={`${step}-${index}`} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {advisorPlan.recommended_assets.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Inköpslista &amp; allokering</h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400">Summera till 100%</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {advisorPlan.recommended_assets.map((asset, index) => (
                      <div
                        key={`${asset.name}-${asset.ticker || index}`}
                        className="h-full p-6 rounded-3xl border border-blue-200/30 dark:border-blue-800/30 bg-gradient-to-br from-white/60 to-blue-50/10 dark:from-slate-800/60 dark:to-blue-900/10 shadow-sm backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{asset.name}</p>
                            {asset.ticker && (
                              <p className="text-sm uppercase tracking-wide text-blue-600 dark:text-blue-300 mt-1">{asset.ticker}</p>
                            )}
                          </div>
                          <Badge className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 text-sm font-semibold">
                            {asset.allocation_percent}%
                          </Badge>
                        </div>
                        {asset.rationale && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                            {asset.rationale}
                          </p>
                        )}
                        {asset.risk_role && (
                          <span className="inline-flex items-center text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1 rounded-full">
                            {asset.risk_role}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {advisorPlan.disclaimer && (
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  {advisorPlan.disclaimer}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!advisorPlan && aiStrategyText && (
        <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-blue-50/30 dark:from-slate-900/90 dark:to-blue-900/10 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="pb-8 pt-8">
            <CardTitle className="flex items-center gap-4 text-2xl font-bold">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center shadow-inner border border-blue-200/30 dark:border-blue-700/30">
                <Brain className="w-7 h-7 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
              </div>
              <span className="text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
                AI-Genererad Investeringsstrategi
              </span>
              <Badge className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text border-blue-300/30 dark:border-blue-700/30 rounded-2xl font-semibold px-4 py-2 shadow-sm">
                Personlig Analys
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="prose prose-lg max-w-none text-foreground p-8 bg-gradient-to-br from-white/60 to-blue-50/20 dark:from-slate-800/60 dark:to-blue-900/10 rounded-3xl border border-blue-200/20 dark:border-blue-800/20 shadow-inner backdrop-blur-sm">
              <div className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {formatAIStrategy(aiStrategyText)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Context - Apple-inspired */}
      {conversationData && Object.keys(conversationData).length > 0 && <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-green-50/30 dark:from-slate-900/90 dark:to-green-900/10 backdrop-blur-sm border border-green-200/30 dark:border-green-800/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="pb-8 pt-8">
            <CardTitle className="flex items-center gap-4 text-2xl font-bold">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center shadow-inner border border-green-200/30 dark:border-green-700/30">
                <CheckCircle className="w-7 h-7 text-transparent bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text" />
              </div>
              <span className="text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
                Dina Svar från Konsultationen
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="grid gap-4">
              {conversationData.isBeginnerInvestor !== undefined && <div className="flex justify-between items-center p-6 bg-gradient-to-r from-white/60 to-green-50/20 dark:from-slate-800/60 dark:to-green-900/10 rounded-2xl border border-green-200/20 dark:border-green-800/20 shadow-sm backdrop-blur-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Erfarenhetsnivå:</span>
                  <Badge 
                    variant={conversationData.isBeginnerInvestor ? "secondary" : "default"} 
                    className="rounded-xl font-semibold px-4 py-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 border-green-300/30 dark:border-green-700/30"
                  >
                    {conversationData.isBeginnerInvestor ? 'Nybörjare' : 'Erfaren'}
                  </Badge>
                </div>}
              
              {conversationData.investmentGoal && <div className="flex justify-between items-center p-6 bg-gradient-to-r from-white/60 to-green-50/20 dark:from-slate-800/60 dark:to-green-900/10 rounded-2xl border border-green-200/20 dark:border-green-800/20 shadow-sm backdrop-blur-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Investeringsmål:</span>
                  <span className="text-base text-slate-600 dark:text-slate-400 font-medium capitalize">
                    {conversationData.investmentGoal}
                  </span>
                </div>}
              
              {conversationData.timeHorizon && <div className="flex justify-between items-center p-6 bg-gradient-to-r from-white/60 to-green-50/20 dark:from-slate-800/60 dark:to-green-900/10 rounded-2xl border border-green-200/20 dark:border-green-800/20 shadow-sm backdrop-blur-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Tidshorisont:</span>
                  <span className="text-base text-slate-600 dark:text-slate-400 font-medium capitalize">
                    {conversationData.timeHorizon}
                  </span>
                </div>}
              
              {conversationData.riskTolerance && <div className="flex justify-between items-center p-6 bg-gradient-to-r from-white/60 to-green-50/20 dark:from-slate-800/60 dark:to-green-900/10 rounded-2xl border border-green-200/20 dark:border-green-800/20 shadow-sm backdrop-blur-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Risktolerans:</span>
                  <span className="text-base text-slate-600 dark:text-slate-400 font-medium capitalize">
                    {conversationData.riskTolerance}
                  </span>
                </div>}
              
              {conversationData.investmentStyle && <div className="flex justify-between items-center p-6 bg-gradient-to-r from-white/60 to-green-50/20 dark:from-slate-800/60 dark:to-green-900/10 rounded-2xl border border-green-200/20 dark:border-green-800/20 shadow-sm backdrop-blur-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Investeringsstil:</span>
                  <span className="text-base text-slate-600 dark:text-slate-400 font-medium capitalize">
                    {conversationData.investmentStyle}
                  </span>
                </div>}
              
              {conversationData.hasCurrentPortfolio !== undefined && <div className="flex justify-between items-center p-6 bg-gradient-to-r from-white/60 to-green-50/20 dark:from-slate-800/60 dark:to-green-900/10 rounded-2xl border border-green-200/20 dark:border-green-800/20 shadow-sm backdrop-blur-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Befintlig portfölj:</span>
                  <Badge 
                    variant={conversationData.hasCurrentPortfolio ? "default" : "secondary"} 
                    className="rounded-xl font-semibold px-4 py-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 border-green-300/30 dark:border-green-700/30"
                  >
                    {conversationData.hasCurrentPortfolio ? 'Ja' : 'Nej'}
                  </Badge>
                </div>}
            </div>
          </CardContent>
        </Card>}

      {/* Risk Profile Summary - Apple-inspired */}
      {riskProfile.sector_interests && riskProfile.sector_interests.length > 0 && <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-purple-50/30 dark:from-slate-900/90 dark:to-purple-900/10 backdrop-blur-sm border border-purple-200/30 dark:border-purple-800/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="pb-8 pt-8">
            <CardTitle className="flex items-center gap-4 text-2xl font-bold">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center shadow-inner border border-purple-200/30 dark:border-purple-700/30">
                <TrendingUp className="w-7 h-7 text-transparent bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text" />
              </div>
              <span className="text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
                Sektorintressen
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex flex-wrap gap-4">
              {riskProfile.sector_interests.map((sector, index) => 
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="capitalize px-6 py-3 rounded-2xl font-semibold text-base border-purple-300/30 dark:border-purple-700/30 text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-50/50 to-pink-50/30 dark:from-purple-900/20 dark:to-pink-900/10 hover:bg-gradient-to-r hover:from-purple-100/60 hover:to-pink-100/40 dark:hover:from-purple-800/30 dark:hover:to-pink-800/20 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm"
                >
                  {sector}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default UserInvestmentAnalysis;