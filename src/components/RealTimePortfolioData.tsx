
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  RefreshCw,
  DollarSign,
  BarChart3,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { useUserHoldings } from '@/hooks/useUserHoldings';

const RealTimePortfolioData: React.FC = () => {
  const { actualHoldings, loading: holdingsLoading } = useUserHoldings();
  const { quotes, portfolioPerformance, loading, error, refreshData } = useRealTimeMarketData();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (actualHoldings.length > 0 && !holdingsLoading) {
      refreshData(actualHoldings);
      setLastRefresh(new Date());
    }
  }, [actualHoldings, holdingsLoading, refreshData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (actualHoldings.length > 0) {
        refreshData(actualHoldings);
        setLastRefresh(new Date());
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [actualHoldings, refreshData]);

  const handleManualRefresh = () => {
    if (actualHoldings.length > 0) {
      refreshData(actualHoldings);
      setLastRefresh(new Date());
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (holdingsLoading || actualHoldings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Realtids Portföljdata
          </CardTitle>
          <CardDescription>Aktuella värden på dina innehav</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {holdingsLoading ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Laddar innehav...</span>
              </div>
            ) : (
              <div>
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Lägg till aktier i dina innehav för att se realtidsdata</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Realtids Portföljdata
              </CardTitle>
              <CardDescription>
                Senast uppdaterad: {formatTime(lastRefresh)}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Uppdatera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {portfolioPerformance ? (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Totalt Värde</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(portfolioPerformance.totalValue)}
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Avkastning</span>
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {formatCurrency(portfolioPerformance.totalChange)}
                    <Badge variant={portfolioPerformance.totalChangePercent >= 0 ? "default" : "destructive"}>
                      {portfolioPerformance.totalChangePercent >= 0 ? '+' : ''}
                      {portfolioPerformance.totalChangePercent.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Dagens Förändring</span>
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {formatCurrency(portfolioPerformance.dailyChange)}
                    <Badge variant={portfolioPerformance.dailyChangePercent >= 0 ? "default" : "destructive"}>
                      {portfolioPerformance.dailyChangePercent >= 0 ? '+' : ''}
                      {portfolioPerformance.dailyChangePercent.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Historical Performance Chart */}
              {portfolioPerformance.historicalData.length > 0 && (
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Historisk Prestanda (30 dagar)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={portfolioPerformance.historicalData}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleDateString('sv-SE')}
                          formatter={(value: number) => [formatCurrency(value), 'Stängningskurs']}
                        />
                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4 mx-auto"></div>
                <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Stock Performance */}
      {Object.keys(quotes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Innehav Prestanda
            </CardTitle>
            <CardDescription>Realtidskurser för dina aktier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actualHoldings
                .filter(holding => quotes[holding.symbol])
                .map(holding => {
                  const quote = quotes[holding.symbol];
                  const totalValue = quote.price * (holding.quantity || 1);
                  const totalChange = quote.change * (holding.quantity || 1);
                  
                  return (
                    <div key={holding.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{holding.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {holding.quantity} aktier × {quote.price.toFixed(2)} SEK
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(totalValue)}</div>
                        <div className={`text-sm flex items-center gap-1 ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {quote.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatCurrency(Math.abs(totalChange))} ({Math.abs(quote.changePercent).toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimePortfolioData;
