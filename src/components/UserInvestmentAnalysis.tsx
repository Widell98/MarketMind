import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  CheckCircle,
  Settings,
  Plus,
  Activity,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import ResetProfileConfirmDialog from '@/components/ResetProfileConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAdvisorPlan } from '@/utils/advisorPlan';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
interface UserInvestmentAnalysisProps {
  onUpdateProfile?: () => void;
}
const UserInvestmentAnalysis = ({
  onUpdateProfile
}: UserInvestmentAnalysisProps) => {
  const {
    riskProfile,
    loading: riskLoading,
    clearRiskProfile,
    saveRiskProfile
  } = useRiskProfile();
  const {
    activePortfolio,
    latestAnalysis,
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
  const sectorOptions = useMemo(() => [
    'Technology',
    'Healthcare',
    'Finance',
    'Energy',
    'Consumer Goods',
    'Real Estate',
    'Utilities',
    'Industrials',
    'Materials',
    'Telecommunications'
  ], []);
  const preferredAssetOptions = useMemo(() => [
    'Aktier',
    'Fonder',
    'ETFer',
    'Investmentbolag',
    'Råvaror',
    'Krypto',
    'Räntor',
    'Alternativa tillgångar'
  ], []);
  const currentPortfolioStrategyOptions = useMemo(() => [
    { value: 'passive_index', label: 'Passiv – indexfonder och bred exponering' },
    { value: 'dividend_focus', label: 'Utdelningsfokus' },
    { value: 'growth_focus', label: 'Tillväxt och innovation' },
    { value: 'mixed', label: 'Blandad strategi' },
    { value: 'unsure', label: 'Osäker / ingen tydlig strategi' }
  ], []);
  const optimizationGoalOptions = useMemo(() => [
    { value: 'risk_balance', label: 'Balansera risk och avkastning' },
    { value: 'diversify', label: 'Öka diversifieringen' },
    { value: 'reduce_fees', label: 'Minska avgifter' },
    { value: 'add_growth', label: 'Hitta nya tillväxtmöjligheter' },
    { value: 'income_focus', label: 'Stärka utdelningsflödet' },
    { value: 'sustainability', label: 'Öka hållbarhetsprofilen' },
  ], []);
  const optimizationDiversificationOptions = useMemo(() => [
    { value: 'nordics', label: 'Mer mot Norden' },
    { value: 'global', label: 'Global exponering' },
    { value: 'sectors', label: 'Fler olika sektorer' },
    { value: 'small_caps', label: 'Småbolag och tillväxt' },
    { value: 'thematic', label: 'Tematiska investeringar / fonder' }
  ], []);
  const optimizationRiskOptions = useMemo(() => [
    { value: 'drawdown', label: 'Stora svängningar / drawdowns' },
    { value: 'concentration', label: 'Hög koncentration i få innehav' },
    { value: 'market', label: 'Känslighet mot marknadsrisk' },
    { value: 'currency', label: 'Valutarisk' },
    { value: 'liquidity', label: 'Likviditetsrisk' }
  ], []);
  const marketCrashReactionOptions = useMemo(() => [
    { value: 'sell', label: 'Jag blir orolig och vill sälja' },
    { value: 'wait', label: 'Jag försöker avvakta' },
    { value: 'buy_more', label: 'Jag ser det som ett köptillfälle' }
  ], []);
  const portfolioHelpOptions = useMemo(() => [
    { value: 'long_term_portfolio', label: 'Bygga en långsiktig portfölj' },
    { value: 'analyze_holdings', label: 'Ge analyser på mina aktier' },
    { value: 'find_new_investments', label: 'Hitta nya intressanta investeringar' },
    { value: 'learn_more', label: 'Lära mig mer om investeringar' },
    { value: 'step_by_step', label: 'Komma igång steg-för-steg' },
  ], []);
  const tradingFrequencyOptions = useMemo(() => [
    { value: 'rarely', label: 'Sällan (några gånger per år)' },
    { value: 'monthly', label: 'Någon gång i månaden' },
    { value: 'weekly', label: 'Varje vecka eller oftare' }
  ], []);
  const investmentPurposeOptions = useMemo(() => [
    'Pension',
    'Bostad',
    'Barnspar',
    'Buffert',
    'Frihet/"FIRE"',
    'Annat mål'
  ], []);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferenceForm, setPreferenceForm] = useState({
    age: '' as number | string,
    risk_tolerance: '',
    investment_horizon: '',
    investment_experience: '',
    monthly_investment_amount: '' as number | string,
    sector_interests: [] as string[],
    investment_goal: '',
    investment_purpose: [] as string[],
    risk_comfort_level: 3,
    current_portfolio_strategy: '',
    preferred_assets: [] as string[],
    optimization_goals: [] as string[],
    optimization_risk_focus: '',
    optimization_diversification_focus: [] as string[],
    optimization_preference: '',
    optimization_timeline: '',
    portfolio_help_focus: '',
    portfolio_change_frequency: '',
    market_crash_reaction: '',
    liquid_capital: '' as number | string
  });

  React.useEffect(() => {
    if (!riskProfile) return;

    setPreferenceForm({
      age: riskProfile.age || '',
      risk_tolerance: riskProfile.risk_tolerance || '',
      investment_horizon: riskProfile.investment_horizon || '',
      investment_experience: riskProfile.investment_experience || '',
      monthly_investment_amount: riskProfile.monthly_investment_amount?.toString() || '',
      sector_interests: riskProfile.sector_interests || [],
      investment_goal: riskProfile.investment_goal || '',
      investment_purpose: riskProfile.investment_purpose || [],
      risk_comfort_level: riskProfile.risk_comfort_level || 3,
      current_portfolio_strategy: riskProfile.current_portfolio_strategy || '',
      preferred_assets: riskProfile.preferred_assets || [],
      optimization_goals: riskProfile.optimization_goals || [],
      optimization_risk_focus: riskProfile.optimization_risk_focus || '',
      optimization_diversification_focus: riskProfile.optimization_diversification_focus || [],
      optimization_preference: riskProfile.optimization_preference || '',
      optimization_timeline: riskProfile.optimization_timeline || '',
      portfolio_help_focus: riskProfile.portfolio_help_focus || '',
      portfolio_change_frequency: riskProfile.portfolio_change_frequency || '',
      market_crash_reaction: riskProfile.market_crash_reaction || '',
      liquid_capital: riskProfile.liquid_capital?.toString() || ''
    });
  }, [riskProfile]);

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
  // Determine which to display: show the most recent one (portfolio or analysis) based on created_at
  const displayPortfolio = useMemo(() => {
    if (!latestAnalysis && !activePortfolio) return null;
    if (!latestAnalysis) return activePortfolio;
    if (!activePortfolio) return latestAnalysis;
    
    // Both exist - return the most recent one
    const analysisDate = new Date(latestAnalysis.created_at);
    const portfolioDate = new Date(activePortfolio.created_at);
    return analysisDate > portfolioDate ? latestAnalysis : activePortfolio;
  }, [latestAnalysis, activePortfolio]);
  
  const isAnalysis = displayPortfolio === latestAnalysis && displayPortfolio?.is_active === false;
  
  const aiStrategyData = displayPortfolio?.asset_allocation?.ai_strategy;
  const aiStrategyRaw = displayPortfolio?.asset_allocation?.ai_strategy_raw;
  const structuredPlan = displayPortfolio?.asset_allocation?.structured_plan;
  const conversationData = displayPortfolio?.asset_allocation?.conversation_data || {};

  const advisorPlan = useAdvisorPlan(structuredPlan, aiStrategyData, aiStrategyRaw);

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

  const handleQuickOnboarding = () => {
    navigate('/portfolio-advisor?direct=true');
  };
  const getInvestmentHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'short':
        return 'Kort (0–2 år)';
      case 'medium':
        return 'Medel (3–5 år)';
      case 'long':
        return 'Lång (5+ år)';
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

  const handleSectorToggle = (sector: string) => {
    setPreferenceForm(prev => ({
      ...prev,
      sector_interests: prev.sector_interests.includes(sector)
        ? prev.sector_interests.filter(s => s !== sector)
        : [...prev.sector_interests, sector]
    }));
  };

  const handleInvestmentPurposeToggle = (purpose: string) => {
    setPreferenceForm(prev => ({
      ...prev,
      investment_purpose: prev.investment_purpose.includes(purpose)
        ? prev.investment_purpose.filter(item => item !== purpose)
        : [...prev.investment_purpose, purpose]
    }));
  };

  const handlePreferredAssetToggle = (asset: string) => {
    setPreferenceForm(prev => ({
      ...prev,
      preferred_assets: prev.preferred_assets.includes(asset)
        ? prev.preferred_assets.filter(item => item !== asset)
        : [...prev.preferred_assets, asset]
    }));
  };

  const handleOptimizationGoalToggle = (goal: string) => {
    setPreferenceForm(prev => ({
      ...prev,
      optimization_goals: prev.optimization_goals.includes(goal)
        ? prev.optimization_goals.filter(item => item !== goal)
        : [...prev.optimization_goals, goal]
    }));
  };

  const handleOptimizationDiversificationToggle = (focus: string) => {
    setPreferenceForm(prev => ({
      ...prev,
      optimization_diversification_focus: prev.optimization_diversification_focus.includes(focus)
        ? prev.optimization_diversification_focus.filter(item => item !== focus)
        : [...prev.optimization_diversification_focus, focus]
    }));
  };

  const handleSavePreferences = async () => {
    if (!riskProfile) return;

    setIsSavingPreferences(true);
    const { id, user_id, created_at, updated_at, sustainability_focus, ...rest } = riskProfile;
    const monthlyAmount = preferenceForm.monthly_investment_amount === ''
      ? null
      : Number(preferenceForm.monthly_investment_amount);
    const age = preferenceForm.age === '' ? null : Number(preferenceForm.age);
    const liquidCapital = preferenceForm.liquid_capital === ''
      ? null
      : Number(preferenceForm.liquid_capital);

    try {
      const safeRiskComfort = Math.min(5, Math.max(1, preferenceForm.risk_comfort_level || 1));

      const updatedProfile = await saveRiskProfile({
        ...rest,
        risk_tolerance: preferenceForm.risk_tolerance || null,
        investment_horizon: preferenceForm.investment_horizon || null,
        investment_experience: preferenceForm.investment_experience || null,
        monthly_investment_amount: Number.isNaN(monthlyAmount) ? null : monthlyAmount,
        sector_interests: preferenceForm.sector_interests,
        investment_goal: preferenceForm.investment_goal || null,
        investment_purpose: preferenceForm.investment_purpose,
        risk_comfort_level: safeRiskComfort,
        current_portfolio_strategy: preferenceForm.current_portfolio_strategy || null,
        preferred_assets: preferenceForm.preferred_assets,
        optimization_goals: preferenceForm.optimization_goals,
        optimization_risk_focus: preferenceForm.optimization_risk_focus || null,
        optimization_diversification_focus: preferenceForm.optimization_diversification_focus,
        optimization_preference: preferenceForm.optimization_preference || null,
        optimization_timeline: preferenceForm.optimization_timeline || null,
        portfolio_help_focus: preferenceForm.portfolio_help_focus || null,
        portfolio_change_frequency: preferenceForm.portfolio_change_frequency || null,
        market_crash_reaction: preferenceForm.market_crash_reaction || null,
        age: Number.isNaN(age) ? null : age,
        liquid_capital: Number.isNaN(liquidCapital) ? null : liquidCapital
      });

      if (updatedProfile && onUpdateProfile) {
        onUpdateProfile();
      }
    } finally {
      setIsSavingPreferences(false);
    }
  };
    return (
      <div className="space-y-10 animate-fade-in">
      <ResetProfileConfirmDialog isOpen={showResetDialog} onClose={() => setShowResetDialog(false)} onConfirm={handleResetProfile} />

      <Card className="border-0 rounded-2xl sm:rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-blue-50/40 dark:from-slate-900/90 dark:to-blue-900/10 backdrop-blur-sm border border-blue-200/40 dark:border-blue-800/30">
        <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-blue-200/40 dark:border-blue-800/40 flex-shrink-0">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Finjustera riskprofil</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 break-words">Uppdatera dina preferenser direkt</p>
              </div>
            </div>
            <div className="text-left sm:text-right text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">
              Ändringar sparas på ditt konto
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50/80 to-purple-50/60 dark:from-blue-950/30 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/40">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 sm:mt-1 flex-shrink-0" />
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">Klart med snabb onboarding</p>
              <p className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400 break-words">Komplettera dina preferenser här under "Riskprofil" för en fullständig AI-plan och justera allt i din egen takt.</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-slate-100/70 dark:bg-slate-900/60 rounded-xl sm:rounded-2xl p-0.5 sm:p-1">
              <TabsTrigger value="profile" className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold py-2 sm:py-2.5">Profil & kapital</TabsTrigger>
              <TabsTrigger value="behavior" className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold py-2 sm:py-2.5">Beteende & preferenser</TabsTrigger>
              <TabsTrigger value="goals" className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold py-2 sm:py-2.5">Mål & optimering</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Ålder</Label>
                  <Input
                    type="number"
                    value={preferenceForm.age}
                    onChange={(e) => setPreferenceForm(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Exempelvis 32"
                    className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm"
                    min={18}
                    max={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Tillgängligt kapital</Label>
                  <Input
                    type="number"
                    value={preferenceForm.liquid_capital}
                    onChange={(e) => setPreferenceForm(prev => ({ ...prev, liquid_capital: e.target.value }))}
                    placeholder="T.ex. 50 000"
                    className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm"
                  />
                  <p className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">Hur mycket kan du investera på kort sikt?</p>
                </div>

                <div className="space-y-2 sm:col-span-2 md:col-span-1">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Nuvarande strategi</Label>
                  <Select
                    value={preferenceForm.current_portfolio_strategy}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, current_portfolio_strategy: value }))}
                  >
                    <SelectTrigger className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Hur investerar du idag?" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentPortfolioStrategyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Risktolerans</Label>
                  <Select
                    value={preferenceForm.risk_tolerance}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, risk_tolerance: value }))}
                  >
                    <SelectTrigger className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Välj risktolerans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative" className="text-xs sm:text-sm">Konservativ</SelectItem>
                      <SelectItem value="moderate" className="text-xs sm:text-sm">Måttlig</SelectItem>
                      <SelectItem value="aggressive" className="text-xs sm:text-sm">Aggressiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Tidshorisont</Label>
                  <Select
                    value={preferenceForm.investment_horizon}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, investment_horizon: value }))}
                  >
                    <SelectTrigger className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Välj tidshorisont" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short" className="text-xs sm:text-sm">Kort (0–2 år)</SelectItem>
                      <SelectItem value="medium" className="text-xs sm:text-sm">Medel (3–5 år)</SelectItem>
                      <SelectItem value="long" className="text-xs sm:text-sm">Lång (5+ år)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2 md:col-span-1">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Erfarenhetsnivå</Label>
                  <Select
                    value={preferenceForm.investment_experience}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, investment_experience: value }))}
                  >
                    <SelectTrigger className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Välj erfarenhet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner" className="text-xs sm:text-sm">Nybörjare</SelectItem>
                      <SelectItem value="intermediate" className="text-xs sm:text-sm">Mellannivå</SelectItem>
                      <SelectItem value="advanced" className="text-xs sm:text-sm">Avancerad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Riskkomfort</Label>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{preferenceForm.risk_comfort_level}/5</span>
                  </div>
                  <Slider
                    value={[preferenceForm.risk_comfort_level]}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, risk_comfort_level: value[0] }))}
                    min={1}
                    max={5}
                    step={1}
                    className="py-2 sm:py-3"
                  />
                  <div className="flex justify-between text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">
                    <span>Låg risk</span>
                    <span>Hög risk</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Månadssparande (SEK)</Label>
                  <Input
                    type="number"
                    value={preferenceForm.monthly_investment_amount}
                    onChange={(e) => setPreferenceForm(prev => ({ ...prev, monthly_investment_amount: e.target.value }))}
                    placeholder="Exempelvis 3000"
                    className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Handelsfrekvens</Label>
                  <Select
                    value={preferenceForm.portfolio_change_frequency}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, portfolio_change_frequency: value }))}
                  >
                    <SelectTrigger className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Hur ofta gör du ändringar?" />
                    </SelectTrigger>
                    <SelectContent>
                      {tradingFrequencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Hur reagerar du vid nedgångar?</Label>
                  <Select
                    value={preferenceForm.market_crash_reaction}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, market_crash_reaction: value }))}
                  >
                    <SelectTrigger className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Välj reaktion" />
                    </SelectTrigger>
                    <SelectContent>
                      {marketCrashReactionOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Vad vill du att AI:n fokuserar på?</Label>
                  <Select
                    value={preferenceForm.portfolio_help_focus}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, portfolio_help_focus: value }))}
                  >
                    <SelectTrigger className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Välj fokus" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolioHelpOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Sektorintressen</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {sectorOptions.map((sector) => (
                    <label
                      key={sector}
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 shadow-sm hover:border-primary/50 transition-colors"
                    >
                      <Checkbox
                        checked={preferenceForm.sector_interests.includes(sector)}
                        onCheckedChange={() => handleSectorToggle(sector)}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 break-words">{sector}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Tillgångar du vill använda</Label>
                <p className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">Markera de tillgångstyper du föredrar så anpassas förslagen.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {preferredAssetOptions.map((asset) => (
                    <label
                      key={asset}
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 shadow-sm hover:border-primary/50 transition-colors"
                    >
                      <Checkbox
                        checked={preferenceForm.preferred_assets.includes(asset)}
                        onCheckedChange={() => handlePreferredAssetToggle(asset)}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 break-words">{asset}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Förbättringsmål</Label>
                <p className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">Berätta hur du vill att portföljen ska vässas så AI:n prioriterar rätt.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {optimizationGoalOptions.map((goal) => (
                    <label
                      key={goal.value}
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 shadow-sm hover:border-primary/50 transition-colors"
                    >
                      <Checkbox
                        checked={preferenceForm.optimization_goals.includes(goal.value)}
                        onCheckedChange={() => handleOptimizationGoalToggle(goal.value)}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 break-words">{goal.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {preferenceForm.optimization_goals.includes('risk_balance') && (
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Vilken risk oroar dig mest?</Label>
                  <Select
                    value={preferenceForm.optimization_risk_focus}
                    onValueChange={(value) => setPreferenceForm(prev => ({ ...prev, optimization_risk_focus: value }))}
                  >
                    <SelectTrigger className="rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Välj risk" />
                    </SelectTrigger>
                    <SelectContent>
                      {optimizationRiskOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {preferenceForm.optimization_goals.includes('diversify') && (
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Var vill du sprida risken?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                    {optimizationDiversificationOptions.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 shadow-sm hover:border-primary/50 transition-colors"
                      >
                        <Checkbox
                          checked={preferenceForm.optimization_diversification_focus.includes(option.value)}
                          onCheckedChange={() => handleOptimizationDiversificationToggle(option.value)}
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                        />
                        <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 break-words">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">Sparmål</Label>
                <p className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">Markera vad du sparar till för att finjustera planen.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {investmentPurposeOptions.map((purpose) => (
                    <label
                      key={purpose}
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 shadow-sm hover:border-primary/50 transition-colors"
                    >
                      <Checkbox
                        checked={preferenceForm.investment_purpose.includes(purpose)}
                        onCheckedChange={() => handleInvestmentPurposeToggle(purpose)}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 break-words">{purpose}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button
              onClick={handleSavePreferences}
              disabled={isSavingPreferences}
              className="rounded-lg sm:rounded-xl px-4 sm:px-6 text-xs sm:text-sm w-full sm:w-auto"
            >
              {isSavingPreferences ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                'Spara uppdateringar'
              )}
            </Button>
          </div>
          </CardContent>
        </Card>

      {!advisorPlan && aiStrategyText && (
        <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-blue-50/30 dark:from-slate-900/90 dark:to-blue-900/10 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="pb-8 pt-8">
            <CardTitle className="flex items-center gap-4 text-2xl font-bold">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center shadow-inner border border-blue-200/30 dark:border-blue-700/30">
                <Brain className="w-7 h-7 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
              </div>
              <span className="text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
                {isAnalysis ? 'Senaste Portföljanalys' : 'AI-Genererad Investeringsstrategi'}
              </span>
              <Badge className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text border-blue-300/30 dark:border-blue-700/30 rounded-2xl font-semibold px-4 py-2 shadow-sm">
                {isAnalysis ? 'Portföljanalys' : 'Personlig Analys'}
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

      {advisorPlan && (
        <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-blue-50/30 dark:from-slate-900/90 dark:to-blue-900/10 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="pb-6 pt-8">
            <CardTitle className="flex items-center gap-4 text-2xl font-bold">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center shadow-inner border border-blue-200/30 dark:border-blue-700/30">
                <Brain className="w-7 h-7 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" />
              </div>
              <div className="flex-1">
                <div className="text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text">
                  {isAnalysis ? 'Senaste Portföljanalys' : 'Senaste Portföljgenerering'}
                </div>
                {advisorPlan.actionSummary && (
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mt-2">
                    {advisorPlan.actionSummary}
                  </p>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Conversation Context - Apple-inspired */}
      {/* {conversationData && Object.keys(conversationData).length > 0 && <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-green-50/30 dark:from-slate-900/90 dark:to-green-900/10 backdrop-blur-sm border border-green-200/30 dark:border-green-800/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
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
        </Card>} */}

    </div>
    );
  };

export default UserInvestmentAnalysis;