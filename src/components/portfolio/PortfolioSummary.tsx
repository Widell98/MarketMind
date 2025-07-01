
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Calendar,
  Activity
} from 'lucide-react';

interface PortfolioSummaryProps {
  portfolio: any;
  onQuickAction: (action: string) => void;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ 
  portfolio, 
  onQuickAction 
}) => {
  const totalValue = portfolio?.total_value || 0;
  const expectedReturn = portfolio?.expected_return || 0;
  const riskScore = portfolio?.risk_score || 0;
  const holdings = portfolio?.recommended_stocks || [];

  const performanceColor = expectedReturn >= 0 ? 'text-green-600' : 'text-red-600';
  const performanceIcon = expectedReturn >= 0 ? TrendingUp : TrendingDown;
  const PerformanceIcon = performanceIcon;

  return (
    <div className="space-y-4">
      {/* Portföljöversikt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Portföljöversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {totalValue.toLocaleString('sv-SE')} kr
              </div>
              <div className="text-sm text-muted-foreground">Totalt värde</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${performanceColor}`}>
                <PerformanceIcon className="w-5 h-5" />
                {expectedReturn > 0 ? '+' : ''}{expectedReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Förväntad avkastning</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {riskScore.toFixed(1)}/10
              </div>
              <div className="text-sm text-muted-foreground">Risknivå</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {holdings.length}
              </div>
              <div className="text-sm text-muted-foreground">Innehav</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aktuella innehav */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Dina innehav</CardTitle>
          <CardDescription>Aktuell fördelning av din portfölj</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {holdings.slice(0, 5).map((holding: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{holding.symbol || `Aktie ${index + 1}`}</div>
                  <div className="text-sm text-muted-foreground">
                    {holding.sector || 'Okänd sektor'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{holding.allocation}%</div>
                  <Badge variant="outline" className="text-xs">
                    {holding.expected_return > 0 ? '+' : ''}{holding.expected_return}%
                  </Badge>
                </div>
              </div>
            ))}
            
            {holdings.length > 5 && (
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => onQuickAction('view_all_holdings')}
              >
                Visa alla {holdings.length} innehav
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioSummary;
