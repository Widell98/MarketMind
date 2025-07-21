
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Activity,
  Target,
  Loader2
} from 'lucide-react';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { formatCurrency } from '@/utils/currencyUtils';

const RealTimePortfolioData: React.FC = () => {
  const { 
    performance, 
    holdingsPerformance, 
    loading, 
    updating, 
    updatePrices 
  } = usePortfolioPerformance();

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Beräknar portföljdata...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Portföljöversikt
            </CardTitle>
            <CardDescription>
              Senast uppdaterad: {new Date(performance.lastUpdated).toLocaleString('sv-SE')}
            </CardDescription>
          </div>
          <Button 
            onClick={updatePrices} 
            disabled={updating}
            variant="outline"
            size="sm"
          >
            {updating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Uppdatera priser
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Value */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Totalt värde</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(performance.totalValue)}</div>
            </div>

            {/* Total Return */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Total avkastning</span>
              </div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${getChangeColor(performance.totalReturn)}`}>
                {performance.totalReturn > 0 ? '+' : ''}{formatCurrency(performance.totalReturn)}
                {getChangeIcon(performance.totalReturn)}
              </div>
              <div className={`text-sm ${getChangeColor(performance.totalReturnPercentage)}`}>
                {performance.totalReturnPercentage > 0 ? '+' : ''}{performance.totalReturnPercentage}%
              </div>
            </div>

            {/* Day Change */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Idag</span>
              </div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${getChangeColor(performance.dayChange)}`}>
                {performance.dayChange > 0 ? '+' : ''}{formatCurrency(performance.dayChange)}
                {getChangeIcon(performance.dayChange)}
              </div>
              <div className={`text-sm ${getChangeColor(performance.dayChangePercentage)}`}>
                {performance.dayChangePercentage > 0 ? '+' : ''}{performance.dayChangePercentage}%
              </div>
            </div>

            {/* Invested Amount */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Investerat</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(performance.totalInvested)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Performance */}
      {holdingsPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Innehav avkastning</CardTitle>
            <CardDescription>
              Detaljerad avkastning per innehav
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {holdingsPerformance.map((holding) => (
                <div key={holding.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{holding.name}</h4>
                      {holding.symbol && (
                        <Badge variant="outline" className="text-xs">
                          {holding.symbol}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(holding.currentValue)} / {formatCurrency(holding.investedValue)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {/* Total Performance */}
                    <div className={`flex items-center gap-1 ${getChangeColor(holding.profit)}`}>
                      <span className="font-medium">
                        {holding.profit > 0 ? '+' : ''}{formatCurrency(holding.profit)}
                      </span>
                      {getChangeIcon(holding.profit)}
                    </div>
                    <div className={`text-sm ${getChangeColor(holding.profitPercentage)}`}>
                      {holding.profitPercentage > 0 ? '+' : ''}{holding.profitPercentage.toFixed(2)}%
                    </div>
                    
                    {/* Day Change */}
                    <div className={`text-xs ${getChangeColor(holding.dayChange)}`}>
                      Idag: {holding.dayChange > 0 ? '+' : ''}{formatCurrency(holding.dayChange)}
                      ({holding.dayChangePercentage > 0 ? '+' : ''}{holding.dayChangePercentage.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Portföljsammanfattning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {holdingsPerformance.filter(h => h.profit > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Vinnande innehav</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {holdingsPerformance.filter(h => h.profit < 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Förlorande innehav</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {holdingsPerformance.length}
              </div>
              <div className="text-sm text-muted-foreground">Totalt antal innehav</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimePortfolioData;
