
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Shield, DollarSign, PieChart } from 'lucide-react';
import { usePortfolioInsights } from '@/hooks/usePortfolioInsights';
import { useUserHoldings } from '@/hooks/useUserHoldings';

interface Portfolio {
  id: string;
  portfolio_name: string;
  asset_allocation: any;
  recommended_stocks: any[];
  total_value: number;
  expected_return: number;
  risk_score: number;
  created_at: string;
}

interface EnhancedPortfolioDashboardProps {
  portfolio: Portfolio;
  recommendations: any[];
}

const EnhancedPortfolioDashboard: React.FC<EnhancedPortfolioDashboardProps> = ({ 
  portfolio, 
  recommendations 
}) => {
  const { insights, unreadCount, criticalInsights } = usePortfolioInsights();
  const { holdings } = useUserHoldings();

  const allocationColors = {
    stocks: '#3B82F6',
    bonds: '#10B981', 
    real_estate: '#F59E0B',
    cash: '#6B7280',
    commodities: '#8B5CF6',
    crypto: '#EF4444'
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const totalHoldingsValue = holdings.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
  const targetProgress = portfolio.total_value ? (totalHoldingsValue / portfolio.total_value) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Översikt Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Portföljvärde</p>
                <p className="text-2xl font-bold">{totalHoldingsValue.toLocaleString()} SEK</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Förväntad avkastning</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold">{portfolio.expected_return || 0}%</p>
                  {getTrendIcon(portfolio.expected_return || 0)}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Riskpoäng</p>
                <p className="text-2xl font-bold">{portfolio.risk_score || 0}/10</p>
              </div>
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Varningar</p>
                <p className="text-2xl font-bold text-red-600">{criticalInsights.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portföljkarta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Tillgångsfördelning
            </CardTitle>
            <CardDescription>Rekommenderad allokering vs nuvarande</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.asset_allocation && Object.entries(portfolio.asset_allocation).map(([asset, percentage]) => (
                <div key={asset} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{asset.replace('_', ' ')}</span>
                    <span>{percentage}%</span>
                  </div>
                  <Progress 
                    value={percentage as number} 
                    className="h-2"
                    style={{
                      '--progress-background': allocationColors[asset as keyof typeof allocationColors] || '#6B7280'
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Måluppfyllelse
            </CardTitle>
            <CardDescription>Progress mot dina investeringsmål</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Måluppfyllelse</span>
                  <span>{Math.min(100, targetProgress).toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(100, targetProgress)} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Nuvarande</p>
                  <p className="font-semibold">{totalHoldingsValue.toLocaleString()} SEK</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Målvärde</p>
                  <p className="font-semibold">{(portfolio.total_value || 0).toLocaleString()} SEK</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights och Varningar */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              AI Insights & Varningar
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} nya
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Automatiserade analyser av din portfölj</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight) => (
                <div 
                  key={insight.id} 
                  className={`p-3 border rounded-lg ${getSeverityColor(insight.severity)} ${
                    !insight.is_read ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.insight_type.replace('_', ' ')}
                      </Badge>
                      {insight.action_required && (
                        <Badge variant="destructive" className="text-xs">
                          Åtgärd krävs
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm opacity-90">{insight.description}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(insight.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rekommenderade Aktier */}
      {portfolio.recommended_stocks && portfolio.recommended_stocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rekommenderade Investeringar</CardTitle>
            <CardDescription>AI-genererade förslag baserat på din profil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.recommended_stocks.slice(0, 6).map((stock, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{stock.name || stock.symbol}</h4>
                      <p className="text-sm text-muted-foreground">{stock.sector}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {stock.allocation || '5'}%
                    </Badge>
                  </div>
                  {stock.reasoning && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {stock.reasoning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedPortfolioDashboard;
