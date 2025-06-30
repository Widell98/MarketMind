
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Brain, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
}

const UserInsightsPanel = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInsights = async (forceRefresh = false) => {
    if (!user) {
      await fetchGeneralInsights(forceRefresh);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: { 
          type: 'personalized_insights',
          personalized: true,
          forceRefresh: forceRefresh
        }
      });

      if (error) {
        console.error('Error fetching insights:', error);
        toast({
          title: "Fel",
          description: "Kunde inte hämta AI-insikter. Försök igen senare.",
          variant: "destructive",
        });
        return;
      }

      if (data && Array.isArray(data)) {
        setInsights(data);
        setLastUpdated(new Date().toLocaleString('sv-SE'));
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneralInsights = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: { 
          type: 'market_sentiment',
          personalized: false,
          forceRefresh: forceRefresh
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
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInsights(true); // Force refresh
    toast({
      title: "Uppdaterar insikter",
      description: "Hämtar nya AI-insikter...",
    });
  };

  useEffect(() => {
    fetchInsights(false); // Load cached insights initially
  }, [user]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'risk_warning': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'rebalancing': return <Target className="w-4 h-4 text-blue-600" />;
      default: return <Lightbulb className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <div>
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
            className="text-xs"
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
            <p className="text-sm text-muted-foreground">Hämtar AI-insikter...</p>
          </div>
        ) : insights.length > 0 ? (
          <>
            {insights.slice(0, 4).map((insight) => (
              <div key={insight.id} className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-start gap-2 mb-2">
                  {getInsightIcon(insight.insight_type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">{insight.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {insight.insight_type.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getConfidenceColor(insight.confidence_score)}`}>
                        {Math.round(insight.confidence_score * 100)}% säker
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
              </div>
            ))}
            
            {!user && (
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 mb-2">
                  Logga in för personaliserade AI-insikter
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              Inga AI-insikter tillgängliga än
            </p>
            <Button 
              size="sm" 
              onClick={() => fetchInsights(true)}
              disabled={loading}
            >
              <Brain className="w-3 h-3 mr-2" />
              {user ? 'Generera personliga insikter' : 'Ladda allmänna insikter'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserInsightsPanel;
