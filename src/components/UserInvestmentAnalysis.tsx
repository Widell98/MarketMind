import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
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

const UserInvestmentAnalysis = ({ onUpdateProfile }: UserInvestmentAnalysisProps) => {
  const { riskProfile, loading: riskLoading, clearRiskProfile } = useRiskProfile();
  const { activePortfolio, loading: portfolioLoading } = usePortfolio();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

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
        return (
          <h3 key={index} className="text-lg font-bold text-green-700 dark:text-green-300 mt-4 mb-2 pb-1 border-b-2 border-green-200 dark:border-green-700">
            {sectionName.trim()} ({percentage}%)
          </h3>
        );
      }

      // Check for other markdown headers
      const headerMatch = line.match(/^(#+)\s*(.+)/);
      if (headerMatch) {
        const [, hashes, title] = headerMatch;
        const level = hashes.length;
        
        if (level === 1) {
          return (
            <h1 key={index} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">
              {title.trim()}
            </h1>
          );
        } else if (level === 2) {
          return (
            <h2 key={index} className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-5 mb-2">
              {title.trim()}
            </h2>
          );
        } else if (level === 3) {
          return (
            <h3 key={index} className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">
              {title.trim()}
            </h3>
          );
        }
      }

      // Regular text line
      if (line.trim()) {
        return (
          <p key={index} className="mb-2 leading-relaxed">
            {line.trim()}
          </p>
        );
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
        variant: "destructive",
      });
      return;
    }

    try {
      // First, clear AI recommendations from user_holdings
      const { error: holdingsError } = await supabase
        .from('user_holdings')
        .delete()
        .eq('user_id', user.id)
        .eq('holding_type', 'recommendation');

      if (holdingsError) {
        console.error('Error clearing AI recommendations:', holdingsError);
      }

      // Then clear the risk profile
      if (clearRiskProfile) {
        const success = await clearRiskProfile();
        if (success) {
          toast({
            title: "Profil återställd",
            description: "Din riskprofil och AI-rekommendationer har raderats.",
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
        variant: "destructive",
      });
    }
    
    setShowResetDialog(false);
  };

  const handleCreateNewProfile = () => {
    navigate('/portfolio-advisor');
  };

  if (riskLoading || portfolioLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-muted h-32 rounded-2xl"></div>
        <div className="animate-pulse bg-muted h-48 rounded-2xl"></div>
      </div>
    );
  }

  if (!riskProfile) {
    return (
      <div className="space-y-6">
        {/* No Profile State */}
        <Card className="border-dashed border-2 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Ingen riskprofil hittades</h3>
              <p className="text-base mb-6 max-w-md">
                Du behöver skapa en riskprofil för att få personliga investeringsrekommendationer och AI-analys.
              </p>
              <Button 
                onClick={handleCreateNewProfile}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Skapa ny riskprofil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
    <div className="space-y-6">
      <ResetProfileConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetProfile}
      />

      {/* Header with Update Profile Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 rounded-2xl border border-blue-200 dark:border-blue-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Din Investeringsanalys
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Personlig riskprofil och AI-genererad strategi
          </p>
        </div>
        {onUpdateProfile && (
          <Button
            onClick={() => setShowResetDialog(true)}
            variant="outline"
            className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Gör om profil
          </Button>
        )}
      </div>

      {/* Profile Summary */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 rounded-2xl shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Din Investeringsprofil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ålder</p>
                <p className="font-semibold">{riskProfile.age || 'Ej angiven'} år</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Erfarenhetsnivå</p>
                <p className="font-semibold">{getExperienceLabel(riskProfile.investment_experience || '')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risktolerans</p>
                <p className="font-semibold">{getRiskToleranceLabel(riskProfile.risk_tolerance || '')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tidshorisont</p>
                <p className="font-semibold">{getInvestmentHorizonLabel(riskProfile.investment_horizon || '')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Månadssparande</p>
                <p className="font-semibold">
                  {riskProfile.monthly_investment_amount 
                    ? `${riskProfile.monthly_investment_amount.toLocaleString()} SEK` 
                    : 'Ej angiven'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Riskkomfort</p>
                <div className="flex items-center gap-2">
                  <Progress value={(riskProfile.risk_comfort_level || 0) * 10} className="h-2 w-16" />
                  <span className="text-sm font-semibold">{riskProfile.risk_comfort_level || 0}/10</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Strategy */}
      {aiStrategy && (
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-950/20 dark:to-lime-950/20 rounded-2xl shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600" />
              AI-Genererad Investeringsstrategi
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                Personlig Analys
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="text-sm leading-relaxed">
                {formatAIStrategy(aiStrategy)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Context */}
      {conversationData && Object.keys(conversationData).length > 0 && (
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-2xl shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              Dina Svar från Konsultationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {conversationData.isBeginnerInvestor !== undefined && (
                <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="font-medium">Erfarenhetsnivå:</span>
                  <Badge variant={conversationData.isBeginnerInvestor ? "secondary" : "default"}>
                    {conversationData.isBeginnerInvestor ? 'Nybörjare' : 'Erfaren'}
                  </Badge>
                </div>
              )}
              
              {conversationData.investmentGoal && (
                <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="font-medium">Investeringsmål:</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {conversationData.investmentGoal}
                  </span>
                </div>
              )}
              
              {conversationData.timeHorizon && (
                <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="font-medium">Tidshorisont:</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {conversationData.timeHorizon}
                  </span>
                </div>
              )}
              
              {conversationData.riskTolerance && (
                <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="font-medium">Risktolerans:</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {conversationData.riskTolerance}
                  </span>
                </div>
              )}
              
              {conversationData.investmentStyle && (
                <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="font-medium">Investeringsstil:</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {conversationData.investmentStyle}
                  </span>
                </div>
              )}
              
              {conversationData.hasCurrentPortfolio !== undefined && (
                <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="font-medium">Befintlig portfölj:</span>
                  <Badge variant={conversationData.hasCurrentPortfolio ? "default" : "secondary"}>
                    {conversationData.hasCurrentPortfolio ? 'Ja' : 'Nej'}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Profile Summary */}
      {riskProfile.sector_interests && riskProfile.sector_interests.length > 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sektorintressen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {riskProfile.sector_interests.map((sector, index) => (
                <Badge key={index} variant="outline" className="capitalize px-3 py-1">
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
