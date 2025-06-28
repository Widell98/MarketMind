
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

      {/* Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Dina innehav</CardTitle>
              <CardDescription>Aktuella investeringar och positioner</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickChat && onQuickChat("Analysera mina nuvarande innehav och ge mig förslag på förbättringar")}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Analysera innehav</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickChat && onQuickChat("Hjälp mig att lägga till nya innehav i min portfölj")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Lägg till</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Laddar innehav...</p>
            </div>
          ) : holdings.length === 0 ? (
            <div className="text-center py-8">
              <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga innehav registrerade</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Lägg till dina investeringar för att få personliga AI-analyser
              </p>
              <Button
                onClick={() => onQuickChat && onQuickChat("Hjälp mig att registrera mina första innehav")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Lägg till första innehav
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Innehav</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Sektor</TableHead>
                    <TableHead className="text-right">Värde</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => (
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
                        <span className="text-sm">{holding.sector || 'Ej specificerad'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatCurrency(holding.current_value, holding.currency)}
                        </div>
                        {holding.quantity && (
                          <div className="text-sm text-muted-foreground">
                            {holding.quantity} st
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickChat && onQuickChat(`Analysera ${holding.name} och ge mig förslag på vad jag ska göra med denna position`)}
                          className="flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Analysera
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
            Snabbåtgärder för innehav
          </CardTitle>
          <CardDescription>
            AI-assisterade funktioner för att hantera din portfölj
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Hjälp mig att registrera ett nytt innehav i min portfölj")}
            >
              <Plus className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-sm">Lägg till innehav</div>
                <div className="text-xs text-muted-foreground">Registrera nya investeringar</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Analysera alla mina innehav och föreslå vilka jag borde sälja, köpa mer av eller behålla")}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Analysera portfölj</div>
                <div className="text-xs text-muted-foreground">Få AI-analys av innehav</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Föreslå nya investeringsmöjligheter baserat på min nuvarande portfölj och riskprofil")}
            >
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <div>
                <div className="font-medium text-sm">Nya möjligheter</div>
                <div className="text-xs text-muted-foreground">Hitta investeringar</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Berätta vilka risker som finns i min portfölj och hur jag kan minska dem")}
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
              onClick={() => onQuickChat && onQuickChat("Hjälp mig att uppdatera värdena på mina befintliga innehav")}
            >
              <Edit3 className="w-4 h-4 text-orange-600" />
              <div>
                <div className="font-medium text-sm">Uppdatera värden</div>
                <div className="text-xs text-muted-foreground">Justera portföljvärden</div>
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
