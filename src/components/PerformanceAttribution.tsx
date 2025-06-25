
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

interface PerformanceAttributionProps {
  portfolio: any;
}

const PerformanceAttribution: React.FC<PerformanceAttributionProps> = ({ portfolio }) => {
  // Mock performance data - in real implementation, this would come from actual portfolio performance
  const performanceData = [
    { sector: 'Technology', contribution: 2.3, weight: 35, color: '#3b82f6' },
    { sector: 'Healthcare', contribution: 1.1, weight: 20, color: '#10b981' },
    { sector: 'Finance', contribution: 0.8, weight: 25, color: '#f59e0b' },
    { sector: 'Energy', contribution: -0.3, weight: 10, color: '#ef4444' },
    { sector: 'Consumer', contribution: 0.6, weight: 10, color: '#8b5cf6' },
  ];

  const monthlyPerformance = [
    { month: 'Jan', portfolio: 2.1, benchmark: 1.8 },
    { month: 'Feb', portfolio: -0.5, benchmark: -0.2 },
    { month: 'Mar', portfolio: 3.2, benchmark: 2.9 },
    { month: 'Apr', portfolio: 1.8, benchmark: 2.1 },
    { month: 'Maj', portfolio: 2.5, benchmark: 1.9 },
    { month: 'Jun', portfolio: 1.2, benchmark: 1.5 },
  ];

  const totalReturn = performanceData.reduce((sum, item) => sum + item.contribution, 0);
  const benchmarkReturn = 1.2; // Mock benchmark return

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span>Performance Attribution</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Detaljerad analys av portföljens prestanda per sektor och tillgång
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="space-y-4 sm:space-y-6">
          {/* Overall Performance Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Total Avkastning</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-gray-600">
                {benchmarkReturn > 0 ? '+' : ''}{benchmarkReturn.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Benchmark</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg col-span-2 sm:col-span-1">
              <div className={`text-lg sm:text-xl font-bold ${(totalReturn - benchmarkReturn) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(totalReturn - benchmarkReturn) > 0 ? '+' : ''}{(totalReturn - benchmarkReturn).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Alpha</div>
            </div>
          </div>

          {/* Sector Attribution */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium text-xs sm:text-sm flex items-center gap-2">
              <PieChart className="w-3 h-3 sm:w-4 sm:h-4" />
              Sektoranalys
            </h4>
            <div className="space-y-2">
              {performanceData.map((sector, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: sector.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate">{sector.sector}</div>
                      <div className="text-xs text-muted-foreground">{sector.weight}% vikt</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={sector.contribution >= 0 ? "default" : "destructive"} 
                      className="text-xs"
                    >
                      {sector.contribution >= 0 ? '+' : ''}{sector.contribution.toFixed(1)}%
                    </Badge>
                    {sector.contribution >= 0 ? 
                      <TrendingUp className="w-3 h-3 text-green-600" /> : 
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Performance Chart */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium text-xs sm:text-sm flex items-center gap-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              Månadsvis prestanda
            </h4>
            <div className="h-48 sm:h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPerformance} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [`${value}%`, name === 'portfolio' ? 'Din portfölj' : 'Benchmark']}
                    labelFormatter={(label) => `Månad: ${label}`}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="portfolio" fill="#3b82f6" name="portfolio" />
                  <Bar dataKey="benchmark" fill="#6b7280" name="benchmark" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-medium text-xs sm:text-sm">Nyckelinsikter</h4>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Technology-sektorn bidrar mest till portföljens prestanda</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Portföljen överträffar benchmark med {(totalReturn - benchmarkReturn).toFixed(1)} procentenheter</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Överväg att minska exponeringen mot Energy-sektorn</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceAttribution;
