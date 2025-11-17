
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Target, RefreshCw } from 'lucide-react';
import { useSupabaseNewsFeed } from '@/hooks/useSupabaseNewsFeed';
import type { MomentumItem } from '@/hooks/useSupabaseNewsFeed';

interface MarketMomentumProps {
  items?: MomentumItem[];
  loading?: boolean;
  error?: string | null;
  onRefetch?: () => void;
  sectionId?: string;
}

const MarketMomentum: React.FC<MarketMomentumProps> = ({ items, loading, error, onRefetch, sectionId }) => {
  const shouldUseHook = items === undefined;
  const {
    data: momentumData,
    loading: hookLoading,
    error: hookError,
    refetch: hookRefetch,
  } = useSupabaseNewsFeed('momentum', { enabled: shouldUseHook });

  const visibleItems = (items ?? momentumData).slice(0, 4);
  const isLoading = loading ?? hookLoading;
  const errorMessage = error ?? hookError;
  const refetchHandler = onRefetch ?? hookRefetch;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-500 flex-shrink-0" />;
      default: return <Target className="w-3 h-3 text-yellow-500 flex-shrink-0" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'bearish': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'positive': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'stable': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    }
  };

  if (isLoading) {
    return (
      <Card id={sectionId} className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            Marknadsmomentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Laddar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card id={sectionId} className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            Marknadsmomentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2 break-words">{errorMessage}</p>
            <Button size="sm" onClick={refetchHandler} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id={sectionId} className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <span className="truncate">Marknadsmomentum</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchHandler}
            className="text-xs px-2 py-1 flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleItems.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
              {getTrendIcon(item.trend)}
            </div>
            <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 break-words overflow-wrap-anywhere line-clamp-2 flex-1">
                  {item.title}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`text-xs font-medium whitespace-nowrap ${getTrendColor(item.trend)}`}>
                    {item.change}
                  </span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 whitespace-nowrap">
                    {item.timeframe}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 break-words overflow-wrap-anywhere line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              {item.sentiment && (
                <Badge className={`text-xs px-1.5 py-0.5 w-fit ${getSentimentColor(item.sentiment)}`}>
                  {item.sentiment}
                </Badge>
              )}
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Marknadssammanfattning
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 break-words overflow-wrap-anywhere leading-relaxed">
            Baserat på aktuell data och marknadsanalys. Uppdateras regelbundet för att ge dig den senaste informationen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketMomentum;
