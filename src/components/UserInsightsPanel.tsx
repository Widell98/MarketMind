import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Brain, RefreshCw, Crown, Building2, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();

  const isPremiumUser = subscription?.subscribed;

  const loadSavedInsights = async () => {
    if (!user) {
      await fetchGeneralInsights();
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
      } else {
        // No saved insights, load general ones
        await fetchGeneralInsights();
      }
    } catch (error) {
      console.error('Error loading saved insights:', error);
      await fetchGeneralInsights();
    }
  };

  const fetchGeneralInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: { 
          type: 'market_sentiment',
          personalized: false,
          forceRefresh: false
        }
      });

      if (error) {
        console.error('Error fetching general insights:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        setInsights(data);
        setLastUpdated(new Date().toLocaleString('sv-SE'));
      }
    } catch (error) {
      console.error('Error fetching general insights:', error);
    }
  };

  const handleRefresh = async () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att uppdatera AI-insikter.",
        variant: "destructive",
      });
      return;
    }

    if (!isPremiumUser) {
      toast({
        title: "Premium krävs",
        description: "Uppgradera till Premium för att uppdatera AI-insikter.",
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
          description: "Kunde inte uppdatera AI-insikter. Försök igen senare.",
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

  useEffect(() => {
    loadSavedInsights();
  }, [user]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'risk_warning': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'rebalancing': return <Target className="w-4 h-4 text-blue-600" />;
      case 'recommendation': return <Building2 className="w-4 h-4 text-purple-600" />;
      default: return <Lightbulb className="w-4 h-4 text-yellow-600" />;
    }
  };

  const renderInsightContent = (insight: AIInsight) => {
    if (insight.insight_type === 'recommendation') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-sm leading-tight text-purple-800 dark:text-purple-200">
              {insight.title}
            </h4>
          </div>
          
          <div className="flex items-center gap-2">
            {insight.isin && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 font-mono">
                {insight.isin}
              </Badge>
            )}
            {insight.key_factors && insight.key_factors.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {insight.key_factors[0]}
                </span>
              </div>
            )}
            {insight.fee && (
              <span className="text-xs text-gray-500">
                Avgift: {insight.fee}
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {insight.content}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-start gap-2 mb-2">
          {getInsightIcon(insight.insight_type)}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight">{insight.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {insight.insight_type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed break-words">
          {insight.content}
        </p>
        {insight.key_factors && insight.key_factors.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {insight.key_factors.slice(0, 3).map((factor, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
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
    <Card className="h-fit w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Brain className="w-5 h-5 text-purple-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">AI-Insikter & Rekommendationer</CardTitle>
              <CardDescription className="text-xs">
                {user ? 'Personliga investeringsinsikter' : 'Allmänna marknadsinsikter'}
                {lastUpdated && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Senast uppdaterad: {lastUpdated}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="text-xs shrink-0 w-8 h-8 p-0"
            variant="outline"
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Uppdaterar AI-insikter...</p>
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-3">
            {insights.slice(0, 4).map((insight) => (
              <div key={insight.id} className="p-3 bg-muted/50 rounded-lg border">
                {renderInsightContent(insight)}
              </div>
            ))}
            
            {!isPremiumUser && (
              <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <Crown className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                <p className="text-xs text-blue-700 mb-2 font-medium">
                  Uppgradera till Premium för att uppdatera AI-insikter
                </p>
                <p className="text-xs text-blue-600">
                  Få tillgång till färska AI-analyser och personliga rekommendationer
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              Inga AI-insikter tillgängliga än
            </p>
            <div className="w-full max-w-sm mx-auto">
              {isPremiumUser && user ? (
                <Button 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="w-full"
                >
                  <Brain className="w-3 h-3 mr-2" />
                  Generera insikter
                </Button>
              ) : (
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <Crown className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                  <p className="text-xs text-blue-700 font-medium">
                    {!user ? 'Logga in för AI-insikter' : 'Premium krävs för att generera AI-insikter'}
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
