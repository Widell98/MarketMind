
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InteractivePortfolio from '@/components/InteractivePortfolio';
import RealTimePortfolioData from '@/components/RealTimePortfolioData';
import AddHoldingDialog from '@/components/AddHoldingDialog';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity,
  Plus,
  Package,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';

interface PortfolioOverviewProps {
  portfolio: any;
  onQuickChat: (message: string) => void;
  onActionClick: (action: string) => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ 
  portfolio, 
  onQuickChat, 
  onActionClick 
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { addHolding } = useUserHoldings();

  const handleAddHolding = async (holdingData: any) => {
    const success = await addHolding(holdingData);
    if (success) {
      setShowAddDialog(false);
    }
    return success;
  };

  const stats = [
    {
      title: "Förväntad avkastning",
      value: portfolio?.expected_return ? `${portfolio.expected_return.toFixed(1)}%` : "Beräknas...",
      change: portfolio?.expected_return > 8 ? "+2.3%" : "-0.5%",
      trend: portfolio?.expected_return > 8 ? "up" : "down",
      icon: TrendingUp,
      description: "Årlig förväntad avkastning"
    },
    {
      title: "Riskpoäng",
      value: portfolio?.risk_score ? `${portfolio.risk_score.toFixed(1)}/10` : "Beräknas...",
      change: "Måttlig risk",
      trend: "neutral",
      icon: Target,
      description: "Portföljens risknivå"
    },
    {
      title: "Totalt värde",
      value: portfolio?.total_value ? `${Math.round(portfolio.total_value).toLocaleString('sv-SE')} kr` : "0 kr",
      change: "+1,234 kr",
      trend: "up",
      icon: DollarSign,
      description: "Nuvarande portföljvärde"
    },
    {
      title: "Diversifiering",
      value: portfolio?.recommended_stocks?.length ? `${portfolio.recommended_stocks.length} aktier` : "0 aktier",
      change: "Väldiversifierad",
      trend: "up", 
      icon: Activity,
      description: "Spridning över sektorer"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Real-time Portfolio Data */}
      <RealTimePortfolioData />

      {/* Portfolio Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      {stat.title}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold truncate">
                      {stat.value}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {stat.trend === "up" && <TrendingUp className="w-3 h-3 text-green-600" />}
                  {stat.trend === "down" && <TrendingDown className="w-3 h-3 text-red-600" />}
                  {stat.trend === "neutral" && <Activity className="w-3 h-3 text-yellow-600" />}
                  <span className={`font-medium ${
                    stat.trend === "up" ? "text-green-600" : 
                    stat.trend === "down" ? "text-red-600" : 
                    "text-yellow-600"
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interactive Portfolio Management */}
      <InteractivePortfolio 
        portfolio={portfolio} 
        onQuickChat={onQuickChat}
      />

      {/* Quick Add Button */}
      <Card className="w-full">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold">Lägg till innehav</h3>
              <p className="text-sm text-muted-foreground">
                Lägg till dina nuvarande aktier och fonder för komplett portföljspårning
              </p>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Lägg till innehav
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Status Alert */}
      {(!portfolio?.recommended_stocks || portfolio.recommended_stocks.length === 0) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Kom igång:</strong> Skapa en riskprofil för att få AI-rekommendationer och 
            börja bygga din portfölj.
          </AlertDescription>
        </Alert>
      )}

      <AddHoldingDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddHolding}
      />
    </div>
  );
};

export default PortfolioOverview;
