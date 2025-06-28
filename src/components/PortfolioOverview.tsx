
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Target,
  Zap,
  Brain,
  AlertTriangle,
  Shield,
  Plus,
  Edit3,
  MessageCircle
} from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUserHoldings } from '@/hooks/useUserHoldings';

interface PortfolioOverviewProps {
  portfolio: any;
  onQuickChat?: (message: string) => void;
  onActionClick?: (action: string) => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ 
  portfolio, 
  onQuickChat, 
  onActionClick 
}) => {
  const { holdings, loading } = useUserHoldings();

  const insights = [
    {
      type: 'opportunity',
      icon: <TrendingUp className="w-4 h-4 text-green-600" />,
      title: 'Stark prestanda',
      description: 'Din portfölj har presterat bättre än marknaden med +8.2% i år',
      action: 'Se detaljerad analys'
    },
    {
      type: 'warning',
      icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
      title: 'Rebalanseringsmöjlighet',
      description: 'Dina tech-aktier har vuxit och utgör nu 35% av portföljen',
      action: 'Visa förslag'
    },
    {
      type: 'info',
      icon: <Target className="w-4 h-4 text-blue-600" />,
      title: 'Diversifiering',
      description: 'Bra spridning över olika sektorer och geografiska marknader',
      action: 'Utforska mer'
    }
  ];

  const formatCurrency = (amount: number | null | undefined, currency: string = 'SEK') => {
    if (!amount) return '0 kr';
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency === 'SEK' ? 'SEK' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getHoldingTypeColor = (type: string) => {
    const colors = {
      stock: 'bg-blue-100 text-blue-800',
      fund: 'bg-green-100 text-green-800',
      crypto: 'bg-purple-100 text-purple-800',
      bonds: 'bg-yellow-100 text-yellow-800',
      real_estate: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getHoldingTypeLabel = (type: string) => {
    const labels = {
      stock: 'Aktie',
      fund: 'Fond',
      crypto: 'Krypto',
      bonds: 'Obligation',
      real_estate: 'Fastighet',
      other: 'Övrigt'
    };
    return labels[type as keyof typeof labels] || 'Övrigt';
  };

  // Get AI-recommended stocks from portfolio data
  const recommendedStocks = portfolio?.recommended_stocks || [];

  const handleStockChat = (stockName: string, stockSymbol?: string) => {
    const message = `Berätta om ${stockName}${stockSymbol ? ` (${stockSymbol})` : ''}. Varför rekommenderas denna aktie för min portfölj? Vad är fördelarna och riskerna?`;
    onQuickChat && onQuickChat(message);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riskjusterad avkastning</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.34</div>
            <p className="text-xs text-muted-foreground">
              Sharpe ratio (bra balans)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversifiering</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Välspridd över sektorer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riskpoäng</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio?.risk_score || 6}/10</div>
            <p className="text-xs text-muted-foreground">
              Måttlig risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI-Recommended Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI-Rekommenderade Innehav
              </CardTitle>
              <CardDescription>Aktier som AI-advisorn rekommenderar för din portfölj</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickChat && onQuickChat("Varför rekommenderas just dessa aktier för min portfölj? Förklara logiken bakom valen.")}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Förklara val</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickChat && onQuickChat("Föreslå alternativa aktier som skulle passa min portfölj och riskprofil")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Alternativ</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Laddar rekommendationer...</p>
            </div>
          ) : recommendedStocks.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga AI-rekommendationer ännu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Skapa din riskprofil för att få personliga aktieförslag från AI-advisorn
              </p>
              <Button
                onClick={() => onQuickChat && onQuickChat("Hjälp mig att få aktieförslag genom att analysera min riskprofil")}
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Få AI-rekommendationer
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Företag</TableHead>
                    <TableHead>Sektor</TableHead>
                    <TableHead>Rekommenderad vikt</TableHead>
                    <TableHead>Motivering</TableHead>
                    <TableHead className="text-right">Diskutera</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendedStocks.map((stock: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{stock.name || stock.symbol}</div>
                          {stock.symbol && stock.name && (
                            <div className="text-sm text-muted-foreground">{stock.symbol}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getHoldingTypeColor('stock')}>
                          {stock.sector || 'Teknologi'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {stock.weight ? `${stock.weight}%` : '5-10%'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {stock.reasoning || 'Passar din riskprofil och diversifiering'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStockChat(stock.name || stock.symbol, stock.symbol)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Diskutera</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Current Holdings */}
      {holdings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Dina Nuvarande Innehav</CardTitle>
                <CardDescription>Aktier och fonder du redan äger</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickChat && onQuickChat("Jämför mina nuvarande innehav med AI-rekommendationerna. Vad borde jag köpa, sälja eller behålla?")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Jämför</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Innehav</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Värde</TableHead>
                    <TableHead className="text-right">Diskutera</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.slice(0, 5).map((holding) => (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{holding.name}</div>
                          {holding.symbol && (
                            <div className="text-sm text-muted-foreground">{holding.symbol}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getHoldingTypeColor(holding.holding_type)}>
                          {getHoldingTypeLabel(holding.holding_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(holding.current_value, holding.currency)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStockChat(holding.name, holding.symbol)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Diskutera</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Brain className="w-5 h-5 text-purple-600" />
            AI-insikter och rekommendationer
          </CardTitle>
          <CardDescription>
            Personaliserade förslag baserat på din portfölj och marknadstrender
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {insight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base mb-1">{insight.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">{insight.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickChat && onQuickChat(`Berätta mer om: ${insight.title}`)}
                  className="text-xs"
                >
                  {insight.action}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="w-5 h-5 text-blue-600" />
            Snabbåtgärder för portfölj
          </CardTitle>
          <CardDescription>
            AI-assisterade funktioner för att optimera din portfölj
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Analysera alla AI-rekommendationer och förklara varför de passar min portfölj")}
            >
              <Brain className="w-4 h-4 text-purple-600" />
              <div>
                <div className="font-medium text-sm">Förklara AI-val</div>
                <div className="text-xs text-muted-foreground">Motivering bakom rekommendationer</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Vilka aktier borde jag köpa först baserat på AI-rekommendationerna och min budget?")}
            >
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-sm">Köpordning</div>
                <div className="text-xs text-muted-foreground">Prioritera investeringar</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Jämför AI-rekommendationerna med mina nuvarande innehav. Vad borde jag sälja?")}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Portföljjämförelse</div>
                <div className="text-xs text-muted-foreground">Nuvarande vs. rekommenderat</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Berätta vilka risker som finns i de AI-rekommenderade aktierna")}
            >
              <Shield className="w-4 h-4 text-red-600" />
              <div>
                <div className="font-medium text-sm">Riskanalys</div>
                <div className="text-xs text-muted-foreground">Identifiera risker</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Föreslå alternativa aktier som inte finns i AI-rekommendationerna men som skulle passa min profil")}
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <div>
                <div className="font-medium text-sm">Alternativa val</div>
                <div className="text-xs text-muted-foreground">Utforska andra möjligheter</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onActionClick && onActionClick('rebalance')}
            >
              <Target className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-sm">Rebalansering</div>
                <div className="text-xs text-muted-foreground">Optimera fördelningen</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
