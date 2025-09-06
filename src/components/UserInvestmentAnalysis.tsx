import React, { useState } from 'react';
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
  if (riskLoading || portfolioLoading) {
    return <div className="space-y-6">
        <div className="animate-pulse bg-muted h-32 rounded-2xl"></div>
        <div className="animate-pulse bg-muted h-48 rounded-2xl"></div>
      </div>;
  }
  if (!riskProfile) {
    return <div className="space-y-6">
        {/* No Profile State */}
        <Card className="border-dashed border-2 rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary/10">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Ingen riskprofil hittades</h3>
              <p className="text-base mb-6 max-w-md text-muted-foreground">
                Du behöver skapa en riskprofil för att få personliga investeringsrekommendationer och AI-analys.
              </p>
              <Button onClick={handleCreateNewProfile} className="flex items-center gap-2" size="lg">
                <Plus className="w-4 h-4" />
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
  const aiStrategy = activePortfolio?.asset_allocation?.ai_strategy || '';
  const conversationData = activePortfolio?.asset_allocation?.conversation_data || {};
  return <div className="space-y-8">
      <ResetProfileConfirmDialog isOpen={showResetDialog} onClose={() => setShowResetDialog(false)} onConfirm={handleResetProfile} />

      {/* Profile Summary */}
      <Card className="border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-card">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            Din Investeringsprofil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Ålder</p>
                <p className="text-lg font-semibold text-foreground">{riskProfile.age || 'Ej angiven'} år</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Erfarenhetsnivå</p>
                <p className="text-lg font-semibold text-foreground">{getExperienceLabel(riskProfile.investment_experience || '')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Risktolerans</p>
                <p className="text-lg font-semibold text-foreground">{getRiskToleranceLabel(riskProfile.risk_tolerance || '')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tidshorisont</p>
                <p className="text-lg font-semibold text-foreground">{getInvestmentHorizonLabel(riskProfile.investment_horizon || '')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Månadssparande</p>
                <p className="text-lg font-semibold text-foreground">
                  {riskProfile.monthly_investment_amount ? `${riskProfile.monthly_investment_amount.toLocaleString()} SEK` : 'Ej angiven'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Riskkomfort</p>
                <div className="flex items-center gap-3">
                  <Progress value={(riskProfile.risk_comfort_level || 0) * 10} className="h-2 w-20" />
                  <span className="text-lg font-semibold text-foreground">{riskProfile.risk_comfort_level || 0}/10</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Strategy */}
      {aiStrategy && <Card className="border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              AI-Genererad Investeringsstrategi
              <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg font-medium">
                Personlig Analys
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground p-8 bg-muted/30 rounded-xl border border-border/50">
              <div className="text-sm leading-relaxed">
                {formatAIStrategy(aiStrategy)}
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Conversation Context */}
      {conversationData && Object.keys(conversationData).length > 0 && <Card className="border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              Dina Svar från Konsultationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {conversationData.isBeginnerInvestor !== undefined && <div className="flex justify-between items-center p-6 bg-muted/30 rounded-xl border border-border/50">
                  <span className="font-semibold text-foreground">Erfarenhetsnivå:</span>
                  <Badge variant={conversationData.isBeginnerInvestor ? "secondary" : "default"} className="rounded-lg font-medium">
                    {conversationData.isBeginnerInvestor ? 'Nybörjare' : 'Erfaren'}
                  </Badge>
                </div>}
              
              {conversationData.investmentGoal && <div className="flex justify-between items-center p-6 bg-muted/30 rounded-xl border border-border/50">
                  <span className="font-semibold text-foreground">Investeringsmål:</span>
                  <span className="text-sm text-muted-foreground font-medium capitalize">
                    {conversationData.investmentGoal}
                  </span>
                </div>}
              
              {conversationData.timeHorizon && <div className="flex justify-between items-center p-6 bg-muted/30 rounded-xl border border-border/50">
                  <span className="font-semibold text-foreground">Tidshorisont:</span>
                  <span className="text-sm text-muted-foreground font-medium capitalize">
                    {conversationData.timeHorizon}
                  </span>
                </div>}
              
              {conversationData.riskTolerance && <div className="flex justify-between items-center p-6 bg-muted/30 rounded-xl border border-border/50">
                  <span className="font-semibold text-foreground">Risktolerans:</span>
                  <span className="text-sm text-muted-foreground font-medium capitalize">
                    {conversationData.riskTolerance}
                  </span>
                </div>}
              
              {conversationData.investmentStyle && <div className="flex justify-between items-center p-6 bg-muted/30 rounded-xl border border-border/50">
                  <span className="font-semibold text-foreground">Investeringsstil:</span>
                  <span className="text-sm text-muted-foreground font-medium capitalize">
                    {conversationData.investmentStyle}
                  </span>
                </div>}
              
              {conversationData.hasCurrentPortfolio !== undefined && <div className="flex justify-between items-center p-6 bg-muted/30 rounded-xl border border-border/50">
                  <span className="font-semibold text-foreground">Befintlig portfölj:</span>
                  <Badge variant={conversationData.hasCurrentPortfolio ? "default" : "secondary"} className="rounded-lg font-medium">
                    {conversationData.hasCurrentPortfolio ? 'Ja' : 'Nej'}
                  </Badge>
                </div>}
            </div>
          </CardContent>
        </Card>}

      {/* Risk Profile Summary */}
      {riskProfile.sector_interests && riskProfile.sector_interests.length > 0 && <Card className="border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              Sektorintressen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {riskProfile.sector_interests.map((sector, index) => <Badge key={index} variant="outline" className="capitalize px-4 py-2 rounded-lg font-medium border-primary/20 text-primary hover:bg-primary/10">
                  {sector}
                </Badge>)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default UserInvestmentAnalysis;