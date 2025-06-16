
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle } from 'lucide-react';
import { Portfolio, PortfolioRecommendation } from '@/hooks/usePortfolio';

interface PortfolioDashboardProps {
  portfolio: Portfolio;
  recommendations: PortfolioRecommendation[];
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolio, recommendations }) => {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0 kr';
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolio.total_value)}</div>
            <p className="text-xs text-muted-foreground">
              Current portfolio value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio.expected_return ? `${portfolio.expected_return.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Annual expected return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{portfolio.risk_score || 'N/A'}</div>
              <Badge className={`${getRiskColor(portfolio.risk_score)} text-white`}>
                {getRiskLabel(portfolio.risk_score)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Risk score (1-10)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>How your portfolio is distributed across different asset classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(portfolio.asset_allocation || {}).map(([asset, percentage]) => (
              <div key={asset} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{asset.replace('_', ' ')}</span>
                  <span>{percentage}%</span>
                </div>
                <Progress value={percentage as number} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock Recommendations */}
      {portfolio.recommended_stocks && portfolio.recommended_stocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Stocks</CardTitle>
            <CardDescription>AI-selected stocks based on your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.recommended_stocks.map((stock: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="font-medium">{stock.name || stock.ticker}</div>
                  <div className="text-sm text-muted-foreground">{stock.ticker}</div>
                  {stock.reason && (
                    <div className="text-xs text-muted-foreground mt-1">{stock.reason}</div>
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
