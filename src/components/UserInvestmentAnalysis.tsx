
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  PieChart,
  Brain,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Settings,
  Lightbulb
} from 'lucide-react';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { usePortfolio } from '@/hooks/usePortfolio';

interface UserInvestmentAnalysisProps {
  onUpdateProfile?: () => void;
}

const UserInvestmentAnalysis = ({ onUpdateProfile }: UserInvestmentAnalysisProps) => {
  const { riskProfile, loading: riskLoading } = useRiskProfile();
  const { activePortfolio, loading: portfolioLoading } = usePortfolio();

  if (riskLoading || portfolioLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="animate-pulse bg-muted h-32 rounded-2xl"></div>
        <div className="animate-pulse bg-muted h-48 rounded-2xl"></div>
      </div>
    );
  }

  if (!riskProfile) {
    return (
      <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="flex items-center justify-center h-32 p-4 sm:p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Ingen riskprofil hittades</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskToleranceLabel = (tolerance: string) => {
    switch (tolerance) {
      case 'conservative': return 'Konservativ';
      case 'moderate': return 'Måttlig';
      case 'aggressive': return 'Aggressiv';
      default: return tolerance || 'Ej angiven';
    }
  };

  const getInvestmentHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'short': return 'Kort (1-3 år)';
      case 'medium': return 'Medel (3-7 år)';
      case 'long': return 'Lång (7+ år)';
      default: return horizon || 'Ej angiven';
    }
  };

  const getExperienceLabel = (experience: string) => {
    switch (experience) {
      case 'beginner': return 'Nybörjare';
      case 'intermediate': return 'Mellannivå';
      case 'advanced': return 'Avancerad';
      default: return experience || 'Ej angiven';
    }
  };

  const aiStrategy = activePortfolio?.asset_allocation?.ai_strategy || '';
  const conversationData = activePortfolio?.asset_allocation?.conversation_data || {};

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Update Profile Button - Matching AI Assistant Style */}
      <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-3 sm:pb-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-bold">
                  Din Investeringsanalys
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Personlig riskprofil och AI-genererad strategi
                </p>
              </div>
            </div>
            {onUpdateProfile && (
              <Button
                onClick={onUpdateProfile}
                variant="outline"
                className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm">
                      Gör om profil
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Uppdatera din riskprofil
                    </div>
                  </div>
                </div>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Profile Summary - Matching AI Assistant Card Style */}
      <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-3 sm:pb-4 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-bold">
                Din Investeringsprofil
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
            <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
              <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm">Ålder</div>
                  <div className="text-xs text-muted-foreground">{riskProfile.age || 'Ej angiven'} år</div>
                </div>
              </div>
            </div>
            
            <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
              <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm">Erfarenhetsnivå</div>
                  <div className="text-xs text-muted-foreground">{getExperienceLabel(riskProfile.investment_experience || '')}</div>
                </div>
              </div>
            </div>
            
            <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
              <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm">Risktolerans</div>
                  <div className="text-xs text-muted-foreground">{getRiskToleranceLabel(riskProfile.risk_tolerance || '')}</div>
                </div>
              </div>
            </div>
            
            <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
              <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm">Tidshorisont</div>
                  <div className="text-xs text-muted-foreground">{getInvestmentHorizonLabel(riskProfile.investment_horizon || '')}</div>
                </div>
              </div>
            </div>
            
            <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
              <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm">Månadssparande</div>
                  <div className="text-xs text-muted-foreground">
                    {riskProfile.monthly_investment_amount 
                      ? `${riskProfile.monthly_investment_amount.toLocaleString()} SEK` 
                      : 'Ej angiven'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
              <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm">Riskkomfort</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={(riskProfile.risk_comfort_level || 0) * 10} className="h-2 w-16" />
                    <span className="text-xs font-semibold">{riskProfile.risk_comfort_level || 0}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Strategy - Matching AI Assistant Card Style */}
      {aiStrategy && (
        <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-bold">
                  AI-Genererad Investeringsstrategi
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-primary text-primary-foreground border-0 shadow-sm">
                    <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                    Personlig Analys
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="h-auto p-3 sm:p-4 lg:p-5 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm">
              <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {aiStrategy}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Context - Matching AI Assistant Card Style */}
      {conversationData && Object.keys(conversationData).length > 0 && (
        <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-bold">
                  Dina Svar från Konsultationen
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid gap-2.5 sm:gap-3 lg:gap-4">
              {conversationData.isBeginnerInvestor !== undefined && (
                <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs sm:text-sm">Erfarenhetsnivå:</span>
                    <Badge className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-secondary text-secondary-foreground border-0 shadow-sm">
                      {conversationData.isBeginnerInvestor ? 'Nybörjare' : 'Erfaren'}
                    </Badge>
                  </div>
                </div>
              )}
              
              {conversationData.investmentGoal && (
                <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs sm:text-sm">Investeringsmål:</span>
                    <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                      {conversationData.investmentGoal}
                    </span>
                  </div>
                </div>
              )}
              
              {conversationData.timeHorizon && (
                <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs sm:text-sm">Tidshorisont:</span>
                    <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                      {conversationData.timeHorizon}
                    </span>
                  </div>
                </div>
              )}
              
              {conversationData.riskTolerance && (
                <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs sm:text-sm">Risktolerans:</span>
                    <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                      {conversationData.riskTolerance}
                    </span>
                  </div>
                </div>
              )}
              
              {conversationData.investmentStyle && (
                <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs sm:text-sm">Investeringsstil:</span>
                    <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                      {conversationData.investmentStyle}
                    </span>
                  </div>
                </div>
              )}
              
              {conversationData.hasCurrentPortfolio !== undefined && (
                <div className="h-auto p-3 sm:p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs sm:text-sm">Befintlig portfölj:</span>
                    <Badge className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-secondary text-secondary-foreground border-0 shadow-sm">
                      {conversationData.hasCurrentPortfolio ? 'Ja' : 'Nej'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Profile Summary - Matching AI Assistant Card Style */}
      {riskProfile.sector_interests && riskProfile.sector_interests.length > 0 && (
        <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-bold">
                  Sektorintressen
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {riskProfile.sector_interests.map((sector, index) => (
                <Badge key={index} className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-secondary text-secondary-foreground border-0 shadow-sm capitalize">
                  {sector}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserInvestmentAnalysis;
