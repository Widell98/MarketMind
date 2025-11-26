import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RiskProfile } from '@/hooks/useRiskProfile';
import {
  User,
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Settings
} from 'lucide-react';

interface InvestmentProfileSummaryProps {
  riskProfile: RiskProfile | null;
  loading?: boolean;
  showActions?: boolean;
  onReset?: () => void;
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

const InvestmentProfileSummary = ({
  riskProfile,
  loading = false,
  showActions = false,
  onReset
}: InvestmentProfileSummaryProps) => {
  const profile: Partial<RiskProfile> = riskProfile || {};

  if (loading) {
    return (
      <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 animate-pulse">
        <CardHeader className="pb-6 pt-8">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile.age ?? 'Ej angiven'} år</p>
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
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{getExperienceLabel((profile.investment_experience as string) || '')}</p>
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
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{getRiskToleranceLabel((profile.risk_tolerance as string) || '')}</p>
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
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{getInvestmentHorizonLabel((profile.investment_horizon as string) || '')}</p>
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
                  {profile.monthly_investment_amount ? `${profile.monthly_investment_amount.toLocaleString()} SEK` : 'Ej angiven'}
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
                    value={(profile.risk_comfort_level || 0) * 20}
                    className="h-3 w-24 bg-slate-200 dark:bg-slate-700"
                  />
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile.risk_comfort_level || 0}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={onReset}
              variant="outline"
              className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 border-slate-300/50 dark:border-slate-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 rounded-2xl px-6 py-2 transition-all duration-300"
            >
              <Settings className="w-4 h-4" />
              Återställ profil
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentProfileSummary;
