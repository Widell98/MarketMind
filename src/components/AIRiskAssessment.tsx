
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, TrendingUp, Zap, RefreshCw, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface RiskInsight {
  id: string;
  title: string;
  content: string;
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high';
  actionable_steps?: string[];
}

const AIRiskAssessment = () => {
  const [riskInsights, setRiskInsights] = useState<RiskInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchRiskAssessment = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: { type: 'risk_assessment', personalized: true }
      });

      if (error) {
        console.error('Error fetching risk assessment:', error);
        setError('Kunde inte ladda riskbedömning');
        return;
      }

      if (data && Array.isArray(data)) {
        setRiskInsights(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Fel vid hämtning av riskbedömning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskAssessment();
  }, [user]);

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Shield className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Shield className="w-4 h-4 text-green-500" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4 text-orange-500" />
            AI Riskbedömning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Analyserar risker...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4 text-orange-500" />
            AI Riskbedömning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
            <Button size="sm" onClick={fetchRiskAssessment} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4 text-orange-500" />
            AI Riskbedömning
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRiskAssessment}
            className="text-xs px-2 py-1"
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {riskInsights.map((insight) => (
          <div key={insight.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1 mt-0.5">
                {getRiskIcon(insight.risk_level)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {insight.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs px-1.5 py-0.5 ${getRiskColor(insight.risk_level)}`}>
                      {insight.risk_level}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {Math.round(insight.confidence_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {insight.content}
                </p>
                {insight.actionable_steps && insight.actionable_steps.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Rekommendationer:</p>
                    <ul className="space-y-1">
                      {insight.actionable_steps.slice(0, 2).map((step, index) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
              AI-Powered Risk Analysis
            </span>
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Personlig riskanalys baserad på din portfoljo och aktuella marknadsförhållanden. Uppdateras dagligen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRiskAssessment;
