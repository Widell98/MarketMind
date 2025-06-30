
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Plus,
  MessageCircle,
  BarChart3,
  Eye,
  Star,
  Building2
} from 'lucide-react';
import { Portfolio } from '@/hooks/usePortfolio';

interface PortfolioOverviewProps {
  portfolio: Portfolio | null;
  onQuickChat: (message: string) => void;
  onActionClick: (action: string) => void;
}

const PortfolioOverview = ({ portfolio, onQuickChat, onActionClick }: PortfolioOverviewProps) => {
  const [selectedStock, setSelectedStock] = useState<any>(null);

  if (!portfolio) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-muted">
          <PieChart className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Ingen aktiv portfölj</h3>
        <p className="text-muted-foreground mb-4">Skapa din första portfölj för att komma igång</p>
        <Button onClick={() => onActionClick('create-portfolio')}>
          Skapa Portfölj
        </Button>
      </div>
    );
  }

  const assetAllocation = portfolio.asset_allocation || {};
  const recommendedStocks = Array.isArray(portfolio.recommended_stocks) ? portfolio.recommended_stocks : [];

  const handleStockClick = (stock: any) => {
    setSelectedStock(selectedStock?.symbol === stock.symbol ? null : stock);
  };

  const handleAnalyzeStock = (stock: any) => {
    onQuickChat(`NEW_SESSION:${stock.name} Analys:Ge mig en detaljerad analys av ${stock.name} (${stock.symbol}). Inkludera nuvarande marknadsposition, tillväxtpotential och hur det passar min portfölj.`);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Totalt Värde</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {portfolio.total_value?.toLocaleString('sv-SE')} SEK
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Förväntad avkastning: {portfolio.expected_return?.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Riskpoäng</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {portfolio.risk_score}/10
            </div>
            <Progress 
              value={(portfolio.risk_score || 0) * 10} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Innehav</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {recommendedStocks.length}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Rekommenderade aktier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            Tillgångsfördelning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(assetAllocation).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {value}%
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {key === 'stocks' ? 'Aktier' : 
                   key === 'bonds' ? 'Obligationer' :
                   key === 'real_estate' ? 'Fastigheter' :
                   key === 'cash' ? 'Kontanter' : key}
                </div>
                <Progress value={value} className="mt-2 h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI-Recommended Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              AI-Rekommenderade Innehav
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {recommendedStocks.length} aktier
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recommendedStocks.length > 0 ? (
            <div className="space-y-3">
              {recommendedStocks.map((stock, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{stock.name}</h3>
                          {stock.symbol && (
                            <Badge variant="outline" className="text-xs">
                              {stock.symbol}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stock.sector} • Allokering: {stock.allocation}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStockClick(stock)}
                        className="h-8 px-3"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Detaljer
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAnalyzeStock(stock)}
                        className="h-8 px-3"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Analysera
                      </Button>
                    </div>
                  </div>
                  
                  {selectedStock?.symbol === stock.symbol && (
                    <div className="mt-4 pt-4 border-t bg-muted/30 rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Sektor</p>
                          <p className="font-semibold">{stock.sector}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Rekommenderad Allokering</p>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{stock.allocation}%</p>
                            <Progress value={stock.allocation} className="flex-1 h-2" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Status</p>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            AI Rekommenderad
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => onQuickChat(`Berätta mer om ${stock.name} och varför den passar min riskprofil`)}
                          >
                            <Info className="w-3 h-3 mr-1" />
                            Varför rekommenderad?
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => onQuickChat(`Jämför ${stock.name} med andra alternativ i ${stock.sector} sektorn`)}
                          >
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Jämför alternativ
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => onQuickChat(`Vad är riskerna med att investera i ${stock.name}?`)}
                          >
                            <Target className="w-3 h-3 mr-1" />
                            Analysera risker
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">AI-Optimerad Portfölj</h4>
                    <p className="text-sm text-blue-700">
                      Dessa aktier är noggrant utvalda baserat på din riskprofil, investeringsmål och tidshorisont. 
                      Klicka på "Analysera" för djupare insikter om varje aktie.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="font-medium text-muted-foreground mb-2">Inga rekommendationer ännu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Skapa en riskprofil för att få personliga aktieförsalg
              </p>
              <Button onClick={() => onActionClick('create-risk-profile')} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Skapa Riskprofil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Snabbåtgärder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => onQuickChat('Analysera min portföljbalans och föreslå förbättringar')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Portföljanalys
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => onQuickChat('Vilka risker finns i min nuvarande portfölj?')}
            >
              <Target className="w-4 h-4 mr-2" />
              Riskbedömning
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => onQuickChat('Föreslå nya investeringsmöjligheter baserat på min profil')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Nya möjligheter
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => onQuickChat('Hjälp mig rebalansera min portfölj')}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Rebalansering
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
