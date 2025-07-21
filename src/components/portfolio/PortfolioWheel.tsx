
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, RefreshCw, Info } from 'lucide-react';

interface PortfolioWheelProps {
  portfolio: any;
  actualHoldings: any[];
}

const PortfolioWheel: React.FC<PortfolioWheelProps> = ({ portfolio, actualHoldings }) => {
  const [view, setView] = useState<'recommended' | 'actual'>('recommended');
  
  const colors = {
    stocks: '#3B82F6',
    bonds: '#10B981',
    real_estate: '#F59E0B',
    cash: '#6B7280',
    commodities: '#8B5CF6',
    crypto: '#EF4444'
  };

  const getRecommendedData = () => {
    if (!portfolio?.asset_allocation) return [];
    
    return Object.entries(portfolio.asset_allocation).map(([asset, percentage]) => ({
      name: asset.replace('_', ' ').toUpperCase(),
      value: percentage as number,
      color: colors[asset as keyof typeof colors] || '#6B7280'
    }));
  };

  const getActualData = () => {
    const sectorMap = new Map<string, number>();
    let totalValue = 0;
    
    actualHoldings.forEach(holding => {
      const value = holding.current_value || 0;
      const sector = holding.sector || 'Övriga';
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
      totalValue += value;
    });

    return Array.from(sectorMap.entries()).map(([sector, value], index) => ({
      name: sector,
      value: Math.round((value / totalValue) * 100),
      color: Object.values(colors)[index % Object.values(colors).length]
    }));
  };

  const data = view === 'recommended' ? getRecommendedData() : getActualData();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value}% av portföljen
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="w-5 h-5 text-primary" />
            Portföljhjul
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={view === 'recommended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('recommended')}
              className="h-8"
            >
              Rekommenderad
            </Button>
            <Button
              variant={view === 'actual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('actual')}
              className="h-8"
            >
              Faktisk
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Center Info */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {data.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {view === 'recommended' ? 'Tillgångar' : 'Sektorer'}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium truncate">{item.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {item.value}%
              </Badge>
            </div>
          ))}
        </div>

        {/* Info Panel */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">
              {view === 'recommended' ? 'AI-rekommendationer' : 'Dina nuvarande innehav'}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {view === 'recommended' 
              ? 'Baserat på din riskprofil och investeringsmål'
              : 'Faktisk fördelning av dina innehav'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioWheel;
