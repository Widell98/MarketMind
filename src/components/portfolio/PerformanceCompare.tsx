
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';

interface PerformanceCompareProps {
  performance: any;
  benchmarkData?: any[];
}

const PerformanceCompare: React.FC<PerformanceCompareProps> = ({ 
  performance, 
  benchmarkData = [] 
}) => {
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');

  // Mock data for demonstration
  const mockData = [
    { name: 'Jan', portfolio: 2.4, benchmark: 1.8, target: 3.0 },
    { name: 'Feb', portfolio: 3.1, benchmark: 2.3, target: 3.5 },
    { name: 'Mar', portfolio: 2.8, benchmark: 2.1, target: 3.2 },
    { name: 'Apr', portfolio: 4.2, benchmark: 3.1, target: 4.0 },
    { name: 'Maj', portfolio: 3.8, benchmark: 2.9, target: 4.2 },
    { name: 'Jun', portfolio: 5.1, benchmark: 3.6, target: 4.5 },
  ];

  const stats = [
    {
      label: 'Total avkastning',
      value: performance.totalReturnPercentage,
      format: (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`,
      trend: performance.totalReturnPercentage > 0 ? 'up' : 'down',
      color: performance.totalReturnPercentage > 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Dagsförändring',
      value: performance.dayChangePercentage,
      format: (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`,
      trend: performance.dayChangePercentage > 0 ? 'up' : 'down',
      color: performance.dayChangePercentage > 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Investerat kapital',
      value: performance.investedPercentage,
      format: (val: number) => `${val.toFixed(1)}%`,
      trend: 'neutral',
      color: 'text-blue-600'
    },
    {
      label: 'Kassa',
      value: performance.cashPercentage,
      format: (val: number) => `${val.toFixed(1)}%`,
      trend: 'neutral',
      color: 'text-gray-600'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}%
            </p>
          ))}
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
            <TrendingUp className="w-5 h-5 text-primary" />
            Prestandajämförelse
          </CardTitle>
          <div className="flex gap-2">
            {(['1M', '3M', '6M', '1Y'] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(period)}
                className="h-8"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                {stat.trend === 'neutral' && <Target className="w-4 h-4 text-blue-600" />}
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <div className={`text-lg font-bold ${stat.color}`}>
                {stat.format(stat.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Performance Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
              <Line 
                type="monotone" 
                dataKey="portfolio" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Din portfölj"
              />
              <Line 
                type="monotone" 
                dataKey="benchmark" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Benchmark"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#F59E0B" 
                strokeWidth={2}
                strokeDasharray="2 2"
                name="Mål"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Goals */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Prestationsmål
          </h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Årlig avkastning</span>
                <span className="text-sm text-muted-foreground">7.5% / 8.0%</span>
              </div>
              <Progress value={93.75} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Risk-justerad avkastning</span>
                <span className="text-sm text-muted-foreground">1.2 / 1.5</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Diversifiering</span>
                <span className="text-sm text-muted-foreground">8.5 / 10</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">+5.1%</div>
            <div className="text-sm text-blue-700">Din portfölj</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">+3.6%</div>
            <div className="text-sm text-green-700">OMXS30</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-2xl font-bold text-amber-600">+1.5%</div>
            <div className="text-sm text-amber-700">Överavkastning</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceCompare;
