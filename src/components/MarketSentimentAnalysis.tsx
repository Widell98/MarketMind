
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface SentimentData {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number;
  confidence: number;
  indicators: {
    name: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    description: string;
  }[];
  marketNews: {
    title: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    source: string;
  }[];
  lastUpdated: string;
}

const MarketSentimentAnalysis: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const { data: sentimentData, isLoading, error, refetch } = useQuery({
    queryKey: ['market-sentiment'],
    queryFn: async (): Promise<SentimentData> => {
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: {
          type: 'market_sentiment',
          includeNews: true,
          includeIndicators: true
        }
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'bearish':
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'bearish':
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return <Activity className="w-3 h-3 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-gray-600 mb-4">Kunde inte ladda marknadssentiment</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Market Sentiment
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getSentimentColor(sentimentData?.overall || 'neutral')}`}>
            {getSentimentIcon(sentimentData?.overall || 'neutral')}
            <span className="font-medium capitalize">
              {sentimentData?.overall || 'Neutral'}
            </span>
            <Badge variant="outline" className="bg-white">
              {sentimentData?.score || 0}%
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Förtroende: {sentimentData?.confidence || 0}%
          </p>
        </div>

        {/* Key Indicators */}
        {sentimentData?.indicators && sentimentData.indicators.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Nyckelindikatorer</h4>
            <div className="space-y-3">
              {sentimentData.indicators.map((indicator, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTrendIcon(indicator.trend)}
                    <div>
                      <p className="font-medium text-sm">{indicator.name}</p>
                      <p className="text-xs text-gray-600">{indicator.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {indicator.value > 0 ? '+' : ''}{indicator.value}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market News */}
        {sentimentData?.marketNews && sentimentData.marketNews.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Marknadsnyheter</h4>
            <div className="space-y-2">
              {sentimentData.marketNews.slice(0, 3).map((news, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h5 className="text-sm font-medium line-clamp-2">{news.title}</h5>
                    <Badge
                      variant="outline"
                      className={`ml-2 ${getSentimentColor(news.sentiment)} text-xs`}
                    >
                      {news.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{news.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Senast uppdaterad: {sentimentData?.lastUpdated ? new Date(sentimentData.lastUpdated).toLocaleTimeString('sv-SE') : 'Okänd'}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSentimentAnalysis;
