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
  const { actualHoldings } = useUserHoldings();

  const allocationColors = {
    stocks: '#3B82F6',
    bonds: '#10B981', 
    real_estate: '#F59E0B',
    cash: '#6B7280',
    commodities: '#8B5CF6',
    crypto: '#EF4444'
  };

  // Calculate sector exposure from actual holdings ONLY (excluding AI recommendations)
  const calculateSectorExposure = () => {
    const sectorMap: { [key: string]: number } = {};
    
    // Filter out AI recommendations and only use actual holdings
    const actualHoldingsOnly = actualHoldings.filter(holding => 
      holding.holding_type !== 'recommendation'
    );
    
    const totalValue = actualHoldingsOnly.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
    
    if (totalValue === 0) return {};
    
    actualHoldingsOnly.forEach(holding => {
      const sector = holding.sector || 'Okänd';
      const value = holding.current_value || 0;
      sectorMap[sector] = (sectorMap[sector] || 0) + value;
    });

    // Convert to percentages
    const sectorExposure: { [key: string]: number } = {};
    Object.entries(sectorMap).forEach(([sector, value]) => {
      sectorExposure[sector] = Math.round((value / totalValue) * 100);
    });

    return sectorExposure;
  };

  // Calculate market exposure from actual holdings ONLY (excluding AI recommendations)
  const calculateMarketExposure = () => {
    const marketMap: { [key: string]: number } = {};
    
    // Filter out AI recommendations and only use actual holdings
    const actualHoldingsOnly = actualHoldings.filter(holding => 
      holding.holding_type !== 'recommendation'
    );
    
    const totalValue = actualHoldingsOnly.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
    
    if (totalValue === 0) return {};
    
    actualHoldingsOnly.forEach(holding => {
      const market = holding.market || 'Okänd marknad';
      const value = holding.current_value || 0;
      marketMap[market] = (marketMap[market] || 0) + value;
    });

    // Convert to percentages
    const marketExposure: { [key: string]: number } = {};
    Object.entries(marketMap).forEach(([market, value]) => {
      marketExposure[market] = Math.round((value / totalValue) * 100);
    });

    return marketExposure;
  };

  const sectorExposure = calculateSectorExposure();
  const marketExposure = calculateMarketExposure();

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />;
    if (value < 0) return <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />;
    return <div className="w-3 h-3 sm:w-4 sm:h-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Use actual holdings only for total value calculation
  const actualHoldingsOnly = actualHoldings.filter(holding => 
    holding.holding_type !== 'recommendation'
  );
  const totalHoldingsValue = actualHoldingsOnly.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
  const targetProgress = portfolio.total_value ? (totalHoldingsValue / portfolio.total_value) * 100 : 0;

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
      {/* Overview Cards - Mobile first responsive grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="min-h-0">
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Portföljvärde</p>
                <p className="text-sm sm:text-lg md:text-2xl font-bold truncate">{totalHoldingsValue.toLocaleString()} SEK</p>
              </div>
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0 self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Förväntad avkastning</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{portfolio.expected_return || 0}%</p>
                  {getTrendIcon(portfolio.expected_return || 0)}
                </div>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0 self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Riskpoäng</p>
                <p className="text-sm sm:text-lg md:text-2xl font-bold">{portfolio.risk_score || 0}/10</p>
              </div>
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-orange-600 flex-shrink-0 self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Varningar</p>
                <p className="text-sm sm:text-lg md:text-2xl font-bold text-red-600">{criticalInsights.length}</p>
              </div>
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-600 flex-shrink-0 self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio allocation, Sector exposure, and Market exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="w-full">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Tillgångsfördelning</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Rekommenderad allokering</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {portfolio.asset_allocation && Object.entries(portfolio.asset_allocation).map(([asset, percentage]) => (
                <div key={asset} className="space-y-1 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="capitalize truncate">{asset.replace('_', ' ')}</span>
                    <span className="flex-shrink-0 ml-2">{String(percentage)}%</span>
                  </div>
                  <Progress 
                    value={percentage as number} 
                    className="h-1.5 sm:h-2"
                    style={{
                      '--progress-background': allocationColors[asset as keyof typeof allocationColors] || '#6B7280'
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Sektorexponering</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Endast dina nuvarande innehav</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {Object.keys(sectorExposure).length > 0 ? (
                Object.entries(sectorExposure)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([sector, percentage]) => (
                    <div key={sector} className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="truncate max-w-[70%]">{sector}</span>
                        <span className="flex-shrink-0 ml-2">{percentage}%</span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-1.5 sm:h-2"
                      />
                    </div>
                  ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Inga nuvarande innehav att visa sektorexponering för
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Marknadsexponering</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Endast dina nuvarande innehav</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {Object.keys(marketExposure).length > 0 ? (
                Object.entries(marketExposure)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([market, percentage]) => (
                    <div key={market} className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="truncate max-w-[70%]">{market}</span>
                        <span className="flex-shrink-0 ml-2">{percentage}%</span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-1.5 sm:h-2"
                      />
                    </div>
                  ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Inga nuvarande innehav att visa marknadsexponering för
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Warnings - Better mobile layout */}
      {insights.length > 0 && (
        <Card className="w-full overflow-hidden">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-sm sm:text-base md:text-lg">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">AI Insights & Varningar</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} nya
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Automatiserade analyser av din portfölj</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              {insights.slice(0, 5).map((insight) => (
                <div 
                  key={insight.id} 
                  className={`p-2 sm:p-3 border rounded-lg overflow-hidden ${getSeverityColor(insight.severity)} ${
                    !insight.is_read ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 space-y-1 sm:space-y-0">
                    <h4 className="font-medium text-xs sm:text-sm pr-2 break-words">{insight.title}</h4>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
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
                  <p className="text-xs sm:text-sm opacity-90 break-words overflow-wrap-anywhere">{insight.description}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(insight.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Stocks - Mobile optimized grid with better text wrapping */}
      {portfolio.recommended_stocks && portfolio.recommended_stocks.length > 0 && (
        <Card className="w-full overflow-hidden">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">AI-Rekommenderade Investeringar</CardTitle>
            <CardDescription className="text-xs sm:text-sm">AI-genererade förslag baserat på din profil</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {portfolio.recommended_stocks.slice(0, 6).map((stock, index) => (
                <div key={index} className="p-2 sm:p-3 md:p-4 border rounded-lg hover:shadow-md transition-shadow overflow-hidden">
                  <div className="flex justify-between items-start mb-1 sm:mb-2 gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-xs sm:text-sm break-words overflow-wrap-anywhere line-clamp-2">{stock.name || stock.symbol}</h4>
                      <p className="text-xs text-muted-foreground break-words overflow-wrap-anywhere line-clamp-1">{stock.sector}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0 whitespace-nowrap">
                      {stock.allocation || '5'}%
                    </Badge>
                  </div>
                  {stock.reasoning && (
                    <p className="text-xs text-muted-foreground mt-1 sm:mt-2 break-words overflow-wrap-anywhere leading-relaxed">
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
