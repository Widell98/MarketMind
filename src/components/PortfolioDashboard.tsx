
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, AlertCircle, PieChart, TrendingUp } from 'lucide-react';
import { Portfolio, PortfolioRecommendation } from '@/hooks/usePortfolio';

interface PortfolioDashboardProps {
  portfolio: Portfolio;
  recommendations: PortfolioRecommendation[];
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolio, recommendations }) => {
  const getRiskColor = (score: number | null) => {
    if (!score) return 'bg-gray-400';
    if (score <= 3) return 'bg-green-500';
    if (score <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskLabel = (score: number | null) => {
    if (!score) return 'Unknown';
    if (score <= 3) return 'Low Risk';
    if (score <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  const getAssetIcon = (asset: string) => {
    switch (asset) {
      case 'stocks':
        return '📈';
      case 'bonds':
        return '🏛️';
      case 'real_estate':
        return '🏠';
      case 'cash':
        return '💰';
      default:
        return '📊';
    }
  };

  const getAssetColor = (asset: string) => {
    switch (asset) {
      case 'stocks':
        return 'bg-blue-500';
      case 'bonds':
        return 'bg-green-500';
      case 'real_estate':
        return 'bg-orange-500';
      case 'cash':
        return 'bg-gray-500';
      default:
        return 'bg-purple-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Level Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">Portfolio Risk Assessment</CardTitle>
            <CardDescription>Your portfolio's risk profile and tolerance</CardDescription>
          </div>
          <Target className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold">{portfolio.risk_score || 'N/A'}</div>
            <div className="flex flex-col space-y-1">
              <Badge className={`${getRiskColor(portfolio.risk_score)} text-white w-fit`}>
                {getRiskLabel(portfolio.risk_score)}
              </Badge>
              <span className="text-sm text-muted-foreground">Risk score (1-10 scale)</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Risk Level</span>
              <span>{portfolio.risk_score || 0}/10</span>
            </div>
            <Progress value={(portfolio.risk_score || 0) * 10} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Asset Allocation - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Asset Allocation
          </CardTitle>
          <CardDescription>Your portfolio distribution across different asset classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress Bars */}
            <div className="space-y-4">
              {Object.entries(portfolio.asset_allocation || {}).map(([asset, percentage]) => (
                <div key={asset} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getAssetIcon(asset)}</span>
                      <span className="capitalize font-medium">{asset.replace('_', ' ')}</span>
                    </div>
                    <span className="font-bold">{percentage}%</span>
                  </div>
                  <Progress value={percentage as number} className="h-3" />
                </div>
              ))}
            </div>
            
            {/* Asset Cards */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(portfolio.asset_allocation || {}).map(([asset, percentage]) => (
                <div key={asset} className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getAssetColor(asset)}`}></div>
                    <span className="text-sm font-medium capitalize">{asset.replace('_', ' ')}</span>
                  </div>
                  <div className="text-2xl font-bold">{percentage}%</div>
                  <div className="text-xs text-muted-foreground">
                    {asset === 'stocks' && 'Growth potential'}
                    {asset === 'bonds' && 'Stable income'}
                    {asset === 'real_estate' && 'Inflation hedge'}
                    {asset === 'cash' && 'Liquidity buffer'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Recommendations */}
      {portfolio.recommended_stocks && portfolio.recommended_stocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Recommended Stocks
            </CardTitle>
            <CardDescription>AI-selected stocks based on your risk profile and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.recommended_stocks.map((stock: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-lg">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                    {stock.allocation && (
                      <Badge variant="outline">{stock.allocation}%</Badge>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Sector:</span> {stock.sector}
                  </div>
                  {stock.reason && (
                    <div className="text-xs text-muted-foreground mt-2 italic">{stock.reason}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Personalized advice from your AI advisor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{rec.title}</h4>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioDashboard;
