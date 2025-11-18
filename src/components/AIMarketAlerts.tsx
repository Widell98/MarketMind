import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, TrendingUp, TrendingDown, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MarketAlert {
  id: string;
  title: string;
  content: string;
  alert_type: 'opportunity' | 'warning' | 'info';
  urgency: 'low' | 'medium' | 'high';
  confidence_score: number;
  impact_timeline: 'short' | 'medium' | 'long';
}

const AIMarketAlerts = () => {
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMarketAlerts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: { type: 'market_alerts', personalized: true }
      });

      if (error) {
        console.error('Error fetching market alerts:', error);
        setError('Kunde inte ladda marknadsvarningar');
        return;
      }

      if (data && Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Fel vid hämtning av marknadsvarningar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketAlerts();
  }, [user]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'info': return <Bell className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'warning': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTimelineEmoji = (timeline: string) => {
    switch (timeline) {
      case 'short': return '⚡';
      case 'medium': return '📈';
      case 'long': return '🎯';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            AI Marknadsvarningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-500" aria-hidden="true" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Analyserar marknaden...</span>
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
            <Bell className="w-4 h-4 text-blue-500" />
            AI Marknadsvarningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
            <Button size="sm" onClick={fetchMarketAlerts} variant="outline">
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
            <Bell className="w-4 h-4 text-blue-500" />
            AI Marknadsvarningar
            {alerts.length > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarketAlerts}
            className="text-xs px-2 py-1"
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'opacity-60' : ''}`} aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-4">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Inga aktiva varningar</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">AI övervakar marknaden kontinuerligt</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-1 mt-0.5">
                  {getAlertIcon(alert.alert_type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {alert.title}
                    </p>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-xs px-1.5 py-0.5 ${getAlertColor(alert.alert_type)}`}>
                        {alert.alert_type}
                      </Badge>
                      <Badge className={`text-xs px-1.5 py-0.5 ${getUrgencyColor(alert.urgency)}`}>
                        {alert.urgency}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {alert.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {getTimelineEmoji(alert.impact_timeline)} {alert.impact_timeline}-term
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">
                        {Math.round(alert.confidence_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Smart Marknadsövervakning
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            AI analyserar marknaden 24/7 och varnar för viktiga förändringar som påverkar din portfolio.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIMarketAlerts;
