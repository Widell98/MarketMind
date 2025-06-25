
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

const MarketMomentum = () => {
  const momentumData = [
    {
      id: '1',
      title: 'Tech-sektorn stiger',
      description: 'Stark utveckling för svenska tech-bolag',
      trend: 'up' as const,
      change: '+2.4%',
      timeframe: '24h'
    },
    {
      id: '2',
      title: 'Högt institutionellt intresse',
      description: 'Ökade köp från storbanker',
      trend: 'up' as const,
      change: '+15%',
      timeframe: 'Vecka'
    },
    {
      id: '3',
      title: 'Volatilitet minskar',
      description: 'Stabilare marknadsrörelser',
      trend: 'neutral' as const,
      change: '-8%',
      timeframe: 'Månad'
    },
    {
      id: '4',
      title: 'AI-aktier i fokus',
      description: 'Stark efterfrågan på AI-relaterade bolag',
      trend: 'up' as const,
      change: '+5.2%',
      timeframe: '3 dagar'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return <Target className="w-3 h-3 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-500" />
          Marknadsmomentu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {momentumData.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-2">
            <div className="flex items-center gap-1 mt-0.5">
              {getTrendIcon(item.trend)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${getTrendColor(item.trend)}`}>
                    {item.change}
                  </span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {item.timeframe}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Marknadsstämning
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Allmänt optimistisk stämning med fokus på tillväxtaktier och tech-sektorn.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketMomentum;
