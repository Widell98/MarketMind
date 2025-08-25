import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Brain, RefreshCw, Crown, Building2, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreditsIndicator from '@/components/CreditsIndicator';

interface AIInsight {
  id: string;
  title: string;
  content: string;
  confidence_score: number;
  insight_type: string;
  key_factors?: string[];
  impact_timeline?: string;
  isin?: string;
  fee?: string;
}

interface UserAIInsight {
  id: string;
  user_id: string;
  insight_type: string;
  is_personalized: boolean;
  insights_data: AIInsight[];
  created_at: string;
  updated_at: string;
}

const UserInsightsPanel = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const { user } = useAuth();
  const { subscription, checkUsageLimit } = useSubscription();
  const { toast } = useToast();

  const isPremiumUser = subscription?.subscribed;

  const loadSavedInsights = async () => {
    if (!user) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('insight_type', 'personalized_insights')
        .eq('is_personalized', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading saved insights:', error);
        return;
      }

      if (data && data.insights_data) {
        // Cast the jsonb data to our expected type
        const insightsData = data.insights_data as unknown as AIInsight[];
        setInsights(insightsData);
        setLastUpdated(new Date(data.updated_at).toLocaleString('sv-SE'));
      }
    } catch (error) {
      console.error('Error loading saved insights:', error);
    }
  };

  const handleRefresh = async () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att hämta AI-insikter.",
        variant: "destructive",
      });
      return;
    }

    if (!checkUsageLimit('insights')) {
      toast({
        title: "Credits slut",
        description: "Du har förbrukat dina 5 dagliga credits. Uppgradera till Premium för obegränsad användning.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: { 
          type: 'personalized_insights',
          personalized: true,
          forceRefresh: true
        }
      });

      if (error) {
        console.error('Error refreshing insights:', error);
        toast({
          title: "Fel",
          description: "Kunde inte hämta AI-insikter. Försök igen senare.",
          variant: "destructive",
        });
        return;
      }

      if (data && Array.isArray(data)) {
        // Save insights to database
        const { error: saveError } = await supabase
          .from('user_ai_insights')
          .upsert({
            user_id: user.id,
            insight_type: 'personalized_insights',
            is_personalized: true,
            insights_data: data,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,insight_type,is_personalized'
          });

        if (saveError) {
          console.error('Error saving insights:', saveError);
        }

        setInsights(data);
        setLastUpdated(new Date().toLocaleString('sv-SE'));
        setHasInitialLoad(true);
        toast({
          title: "Insikter uppdaterade",
          description: "AI-insikterna har uppdaterats med ny data.",
        });
      }
    } catch (error) {
      console.error('Error refreshing insights:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Only load saved insights on mount, don't fetch new ones
  useEffect(() => {
    if (user) {
      loadSavedInsights().then(() => setHasInitialLoad(true));
    } else {
      setHasInitialLoad(true);
    }
  }, [user]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'risk_warning': return <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'rebalancing': return <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'recommendation': return <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const renderInsightContent = (insight: AIInsight) => {
    if (insight.insight_type === 'recommendation') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-medium text-sm leading-tight text-blue-800 dark:text-blue-200">
              {insight.title}
            </h4>
          </div>
          
          <div className="flex items-center gap-2">
            {insight.isin && (
              <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-mono">
                {insight.isin}
              </Badge>
            )}
            {insight.key_factors && insight.key_factors.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {insight.key_factors[0]}
                </span>
              </div>
            )}
            {insight.fee && (
              <span className="text-xs text-muted-foreground">
                Avgift: {insight.fee}
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.content}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-start gap-3 mb-3">
          {getInsightIcon(insight.insight_type)}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight mb-2">{insight.title}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {insight.insight_type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed break-words">
          {insight.content}
        </p>
        {insight.key_factors && insight.key_factors.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {insight.key_factors.slice(0, 3).map((factor, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <Card className="h-fit w-full border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-card">
      <CardHeader className="pb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold">AI-Insikter & Rekommendationer</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {user ? 'Personliga investeringsinsikter' : 'Allmänna marknadsinsikter'} • Kostar 1 credit
                {lastUpdated && (
                  <span className="block text-xs text-muted-foreground mt-2">
                    Senast uppdaterad: {lastUpdated}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditsIndicator type="insights" showUpgrade={false} />
            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="w-9 h-9 p-0 rounded-lg"
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 bg-muted/30 rounded-xl border border-border/50">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-muted-foreground">Hämtar AI-insikter...</p>
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            {insights.slice(0, 4).map((insight) => (
              <div key={insight.id} className="p-6 bg-muted/30 rounded-xl border border-border/50 hover:shadow-sm transition-shadow">
                {renderInsightContent(insight)}
              </div>
            ))}
            
            {!isPremiumUser && (
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-medium">
                  Uppgradera till Premium för att uppdatera AI-insikter
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Få tillgång till färska AI-analyser och personliga rekommendationer
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-border/50">
            <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-blue-600/50 dark:text-blue-400/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {hasInitialLoad ? 'Inga AI-insikter tillgängliga' : 'Klicka på uppdatera för att hämta AI-insikter (kostar 1 credit)'}
            </p>
            <div className="w-full max-w-sm mx-auto">
              {checkUsageLimit('insights') && user ? (
                <Button 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="w-full rounded-lg"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Hämta insikter (1 credit)
                </Button>
              ) : (
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {!user ? 'Logga in för AI-insikter' : 'Inga credits kvar idag - Uppgradera till Premium'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserInsightsPanel;
