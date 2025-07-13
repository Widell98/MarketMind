import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Target, 
  Activity,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
  Zap
 } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { getNormalizedValue, calculateTotalPortfolioValue, formatCurrency } from '@/utils/currencyUtils';

interface PortfolioKeyMetricsProps {
  portfolio?: any;
}

const PortfolioKeyMetrics: React.FC<PortfolioKeyMetricsProps> = ({ portfolio }) => {
  const { actualHoldings } = useUserHoldings();

  // Calculate real portfolio metrics based on actual holdings
  const calculatePortfolioMetrics = () => {
    if (!actualHoldings || actualHoldings.length === 0) {
      return {
        totalValue: 0,
        diversificationScore: 0,
        riskScore: 0,
        riskAdjustedReturn: 0,
        volatilityRating: 'Låg',
        sectorCount: 0,
        marketCount: 0,
        averageReturn: 0,
        sharpeRatio: 0
      };
    }

    // Filter actual holdings only
    const realHoldings = actualHoldings.filter(h => h.holding_type !== 'recommendation');
    // Calculate total value in SEK for fair comparison across currencies
    const totalValue = calculateTotalPortfolioValue(realHoldings);
    
    // Calculate diversification score based on holdings distribution
    const sectorMap = new Map<string, number>();
    const marketMap = new Map<string, number>();
    
    realHoldings.forEach(holding => {
      const sector = holding.sector || 'Unknown';
      const market = holding.market || holding.currency || 'Unknown';
      // Normalize value to SEK for fair comparison
      const normalizedValue = getNormalizedValue(holding);
      
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + normalizedValue);
      marketMap.set(market, (marketMap.get(market) || 0) + normalizedValue);
    });

    // Diversification score: penalize concentration
    const sectorConcentration = Math.max(...Array.from(sectorMap.values())) / totalValue;
    const diversificationScore = Math.min(100, Math.max(0, 
      (1 - sectorConcentration) * 100 + 
      (sectorMap.size - 1) * 10 + 
      (marketMap.size - 1) * 5
    ));

    // Calculate estimated returns and risk using normalized values
    const estimatedReturns = realHoldings.map(holding => {
      // Simple estimation based on sector and purchase vs current value (normalized to SEK)
      const purchaseValue = (holding.purchase_price || 0) * (holding.quantity || 0);
      const normalizedPurchaseValue = purchaseValue > 0 ? getNormalizedValue({...holding, current_value: purchaseValue}) : 0;
      const currentNormalizedValue = getNormalizedValue(holding);
      
      if (normalizedPurchaseValue > 0) {
        return ((currentNormalizedValue - normalizedPurchaseValue) / normalizedPurchaseValue) * 100;
      }
      return 0;
    });

    const averageReturn = estimatedReturns.length > 0 
      ? estimatedReturns.reduce((a, b) => a + b, 0) / estimatedReturns.length 
      : 0;

    // Risk score based on sector diversity and volatility estimates
    const riskScore = Math.min(10, Math.max(1,
      5 + (sectorConcentration * 3) - (sectorMap.size * 0.5) + (Math.abs(averageReturn) * 0.1)
    ));

    // Risk-adjusted return (simplified Sharpe-like ratio)
    const riskAdjustedReturn = riskScore > 0 ? averageReturn / riskScore : 0;

    // Sharpe ratio estimation
    const returnVariance = estimatedReturns.length > 1 
      ? estimatedReturns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / (estimatedReturns.length - 1)
      : 0;
    const volatility = Math.sqrt(returnVariance);
    const sharpeRatio = volatility > 0 ? (averageReturn - 2) / volatility : 0; // Assuming 2% risk-free rate

    const volatilityRating = volatility < 5 ? 'Låg' : volatility < 15 ? 'Medel' : 'Hög';

    return {
      totalValue: Math.round(totalValue),
      diversificationScore: Math.round(diversificationScore),
      riskScore: Math.round(riskScore * 10) / 10,
      riskAdjustedReturn: Math.round(riskAdjustedReturn * 100) / 100,
      volatilityRating,
      sectorCount: sectorMap.size,
      marketCount: marketMap.size,
      averageReturn: Math.round(averageReturn * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100
    };
  };

  const metrics = calculatePortfolioMetrics();

  const getScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (percentage >= 60) return <Activity className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return 'text-green-600';
    if (risk <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReturnIcon = (returnValue: number) => {
    if (returnValue > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (returnValue < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Key Performance Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Nyckeltal
          </CardTitle>
          <CardDescription>Realtidsberäknade värden från dina innehav</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Portfolio Value */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Portföljvärde</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{formatCurrency(metrics.totalValue)}</div>
              <div className="text-xs text-muted-foreground">{actualHoldings.filter(h => h.holding_type !== 'recommendation').length} innehav</div>
            </div>
          </div>

          {/* Risk-Adjusted Return */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Riskjusterad avkastning</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold flex items-center gap-1 ${getScoreColor(Math.abs(metrics.riskAdjustedReturn), 5)}`}>
                {metrics.riskAdjustedReturn}%
                {getReturnIcon(metrics.riskAdjustedReturn)}
              </div>
              <div className="text-xs text-muted-foreground">Avkastning per riskenhet</div>
            </div>
          </div>

          {/* Sharpe Ratio */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Sharpe-kvot</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${getScoreColor(Math.abs(metrics.sharpeRatio), 2)}`}>
                {metrics.sharpeRatio}
              </div>
              <div className="text-xs text-muted-foreground">Risk/avkastning-förhållande</div>
            </div>
          </div>

          {/* Average Return */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Genomsnittlig avkastning</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold flex items-center gap-1 ${getScoreColor(Math.abs(metrics.averageReturn), 10)}`}>
                {metrics.averageReturn > 0 ? '+' : ''}{metrics.averageReturn}%
                {getReturnIcon(metrics.averageReturn)}
              </div>
              <div className="text-xs text-muted-foreground">Estimerad årlig avkastning</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk & Diversification Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-orange-600" />
            Risk & Diversifiering
          </CardTitle>
          <CardDescription>Analys av portföljens riskprofil och spridning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diversification Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Diversifieringspoäng</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getScoreColor(metrics.diversificationScore)}`}>
                  {metrics.diversificationScore}/100
                </span>
                {getScoreIcon(metrics.diversificationScore)}
              </div>
            </div>
            <Progress value={metrics.diversificationScore} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {metrics.sectorCount} sektorer, {metrics.marketCount} marknader
            </div>
          </div>

          {/* Risk Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Riskpoäng</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getRiskColor(metrics.riskScore)}`}>
                  {metrics.riskScore}/10
                </span>
                {getScoreIcon(10 - metrics.riskScore, 10)}
              </div>
            </div>
            <Progress value={(10 - metrics.riskScore) * 10} className="h-2" />
            <div className="text-xs text-muted-foreground">
              Lägre värde = lägre risk
            </div>
          </div>

          {/* Volatility Rating */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Volatilitet</span>
            </div>
            <div className="text-right">
              <Badge variant={
                metrics.volatilityRating === 'Låg' ? 'default' : 
                metrics.volatilityRating === 'Medel' ? 'secondary' : 'destructive'
              }>
                {metrics.volatilityRating}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Prisfluktuationer</div>
            </div>
          </div>

          {/* Portfolio Health Summary */}
          <div className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">Portföljhälsa</div>
            <div className="text-xs text-muted-foreground space-y-1">
              {metrics.diversificationScore >= 70 ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Bra diversifiering
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="w-3 h-3" />
                  Kan förbättra diversifiering
                </div>
              )}
              
              {metrics.riskScore <= 6 ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Kontrollerad risk
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  Hög risk - överväg ombalansering
                </div>
              )}
              
              {metrics.sharpeRatio > 0.5 ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Bra risk/avkastning-förhållande
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Activity className="w-3 h-3" />
                  Kan optimera risk/avkastning
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioKeyMetrics;