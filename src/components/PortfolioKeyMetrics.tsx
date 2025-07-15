
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
  DollarSign,
  Percent
 } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { getNormalizedValue, calculateTotalPortfolioValue, formatCurrency } from '@/utils/currencyUtils';

interface PortfolioKeyMetricsProps {
  portfolio?: any;
}

const PortfolioKeyMetrics: React.FC<PortfolioKeyMetricsProps> = ({ portfolio }) => {
  const { actualHoldings } = useUserHoldings();
  const { performance, loading: performanceLoading } = usePortfolioPerformance();

  // Calculate real portfolio metrics based on actual holdings
  const calculatePortfolioMetrics = () => {
    if (!actualHoldings || actualHoldings.length === 0) {
      return {
        totalValue: 0,
        totalInvested: 0,
        totalReturn: 0,
        totalReturnPercentage: 0,
        diversificationScore: 0,
        riskScore: 0,
        volatilityRating: 'Låg',
        sectorCount: 0,
        marketCount: 0,
        holdingsCount: 0
      };
    }

    // Filter actual holdings only
    const realHoldings = actualHoldings.filter(h => h.holding_type !== 'recommendation');
    const totalValue = calculateTotalPortfolioValue(realHoldings);
    
    // Calculate total invested amount
    let totalInvested = 0;
    realHoldings.forEach(holding => {
      const purchaseValue = (holding.purchase_price || 0) * (holding.quantity || 0);
      const normalizedPurchaseValue = purchaseValue > 0 ? getNormalizedValue({...holding, current_value: purchaseValue}) : 0;
      totalInvested += normalizedPurchaseValue;
    });

    // Calculate total return
    const totalReturn = totalValue - totalInvested;
    const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    
    // Calculate diversification score based on holdings distribution
    const sectorMap = new Map<string, number>();
    const marketMap = new Map<string, number>();
    
    realHoldings.forEach(holding => {
      const sector = holding.sector || 'Unknown';
      const market = holding.market || holding.currency || 'Unknown';
      const normalizedValue = getNormalizedValue(holding);
      
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + normalizedValue);
      marketMap.set(market, (marketMap.get(market) || 0) + normalizedValue);
    });

    // Diversification score: penalize concentration
    const sectorConcentration = totalValue > 0 ? Math.max(...Array.from(sectorMap.values())) / totalValue : 0;
    const diversificationScore = Math.min(100, Math.max(0, 
      (1 - sectorConcentration) * 100 + 
      (sectorMap.size - 1) * 10 + 
      (marketMap.size - 1) * 5
    ));

    // Risk score based on sector diversity and concentration
    const riskScore = Math.min(10, Math.max(1,
      5 + (sectorConcentration * 3) - (sectorMap.size * 0.5)
    ));

    const volatilityRating = sectorConcentration > 0.6 ? 'Hög' : sectorConcentration > 0.4 ? 'Medel' : 'Låg';

    return {
      totalValue: Math.round(totalValue),
      totalInvested: Math.round(totalInvested),
      totalReturn: Math.round(totalReturn),
      totalReturnPercentage: Math.round(totalReturnPercentage * 100) / 100,
      diversificationScore: Math.round(diversificationScore),
      riskScore: Math.round(riskScore * 10) / 10,
      volatilityRating,
      sectorCount: sectorMap.size,
      marketCount: marketMap.size,
      holdingsCount: realHoldings.length
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

  // Use performance data from the hook when available
  const displayMetrics = !performanceLoading && performance ? {
    totalValue: performance.totalValue,
    totalInvested: performance.totalInvested,
    totalReturn: performance.totalReturn,
    totalReturnPercentage: performance.totalReturnPercentage,
    dayChange: performance.dayChange,
    dayChangePercentage: performance.dayChangePercentage,
    ...metrics
  } : metrics;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Key Performance Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Portföljvärden
          </CardTitle>
          <CardDescription>Aktuella värden baserat på dina innehav</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Portfolio Value */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Totalt portföljvärde</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{formatCurrency(displayMetrics.totalValue)}</div>
              <div className="text-xs text-muted-foreground">{displayMetrics.holdingsCount} innehav</div>
            </div>
          </div>

          {/* Total Invested */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Totalt investerat</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{formatCurrency(displayMetrics.totalInvested)}</div>
              <div className="text-xs text-muted-foreground">Inköpsvärde</div>
            </div>
          </div>

          {/* Day Change (if available from performance data) */}
          {!performanceLoading && performance && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Dagens förändring</span>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold flex items-center gap-1 ${getScoreColor(Math.abs(performance.dayChangePercentage), 5)}`}>
                  {performance.dayChangePercentage > 0 ? '+' : ''}{performance.dayChangePercentage}%
                  {getReturnIcon(performance.dayChangePercentage)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {performance.dayChange > 0 ? '+' : ''}{formatCurrency(performance.dayChange)}
                </div>
              </div>
            </div>
          )}
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
                <span className={`text-lg font-bold ${getScoreColor(displayMetrics.diversificationScore)}`}>
                  {displayMetrics.diversificationScore}/100
                </span>
                {getScoreIcon(displayMetrics.diversificationScore)}
              </div>
            </div>
            <Progress value={displayMetrics.diversificationScore} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {displayMetrics.sectorCount} sektorer, {displayMetrics.marketCount} marknader
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
                <span className={`text-lg font-bold ${getRiskColor(displayMetrics.riskScore)}`}>
                  {displayMetrics.riskScore}/10
                </span>
                {getScoreIcon(10 - displayMetrics.riskScore, 10)}
              </div>
            </div>
            <Progress value={(10 - displayMetrics.riskScore) * 10} className="h-2" />
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
                displayMetrics.volatilityRating === 'Låg' ? 'default' : 
                displayMetrics.volatilityRating === 'Medel' ? 'secondary' : 'destructive'
              }>
                {displayMetrics.volatilityRating}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Koncentrationsrisk</div>
            </div>
          </div>

          {/* Portfolio Health Summary */}
          <div className="p-3 border rounded-lg">
            <div className="text-sm font-medium mb-2">Portföljhälsa</div>
            <div className="text-xs text-muted-foreground space-y-1">
              {displayMetrics.diversificationScore >= 70 ? (
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
              
              {displayMetrics.riskScore <= 6 ? (
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
              
              {displayMetrics.totalReturnPercentage > 0 ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Positiv avkastning
                </div>
              ) : displayMetrics.totalReturnPercentage < -10 ? (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  Stor förlust - överväg strategi
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Activity className="w-3 h-3" />
                  Neutral utveckling
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
