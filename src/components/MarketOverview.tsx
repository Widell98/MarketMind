
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

const MarketOverview = () => {
  const marketData = [
    {
      name: "OMXS30",
      value: "2,485.6",
      change: "+1.2%",
      trend: "up",
      icon: TrendingUp
    },
    {
      name: "S&P 500",
      value: "4,756.5",
      change: "+0.8%",
      trend: "up",
      icon: TrendingUp
    },
    {
      name: "DAX",
      value: "16,234.7",
      change: "-0.3%",
      trend: "down",
      icon: TrendingDown
    },
    {
      name: "NASDAQ",
      value: "14,893.2",
      change: "+1.5%",
      trend: "up",
      icon: TrendingUp
    }
  ];

  return (
    <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Marknadsöversikt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {marketData.map((market) => (
          <div key={market.name} className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                market.trend === 'up' 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <market.icon className={`w-4 h-4 ${
                  market.trend === 'up' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {market.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {market.value}
                </div>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium ${
                market.trend === 'up'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {market.change}
            </Badge>
          </div>
        ))}
        
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <DollarSign className="w-3 h-3" />
            <span>Senast uppdaterad: {new Date().toLocaleTimeString('sv-SE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketOverview;
