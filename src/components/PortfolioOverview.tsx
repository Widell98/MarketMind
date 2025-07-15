
import React from 'react';
import PortfolioKeyMetrics from './PortfolioKeyMetrics';
import CurrentHoldingsPrices from './CurrentHoldingsPrices';
import UserHoldingsManager from './UserHoldingsManager';
import AIRiskAssessment from './AIRiskAssessment';
import AIMarketingPanel from './AIMarketingPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { TrendingUp, Target, BarChart3, PieChart, MessageSquare, Plus, Settings, Brain, Zap, Shield, AlertTriangle } from 'lucide-react';

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
  const quickActions = [
    {
      icon: MessageSquare,
      label: 'Diskutera portfölj',
      action: () => onQuickChat('NEW_SESSION:Portföljdiskussion:Kan du analysera min nuvarande portfölj och ge rekommendationer?'),
      variant: 'default' as const
    },
    {
      icon: Plus,
      label: 'Lägg till innehav',
      action: () => onActionClick('add-holding'),
      variant: 'secondary' as const
    },
    {
      icon: Settings,
      label: 'Rebalansera',
      action: () => onQuickChat('NEW_SESSION:Rebalansering:Hjälp mig att rebalansera min portfölj baserat på min riskprofil'),
      variant: 'outline' as const
    }
  ];

  // Mock sector allocation data - replace with real data
  const sectorAllocation = [
    { sector: 'Teknologi', percentage: 35, amount: 350000 },
    { sector: 'Finans', percentage: 25, amount: 250000 },
    { sector: 'Konsument', percentage: 20, amount: 200000 },
    { sector: 'Industrials', percentage: 15, amount: 150000 },
    { sector: 'Hälsovård', percentage: 5, amount: 50000 }
  ];

  const SectorExposureCard = () => (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <CardTitle className="text-sm sm:text-base">Sektorexponering</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            Balanserad
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Fördelning av dina investeringar per sektor
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 sm:space-y-3">
          {sectorAllocation.map((sector, index) => (
            <div key={index} className="space-y-1 sm:space-y-1.5">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="font-medium truncate">{sector.sector}</span>
                <span className="text-muted-foreground flex-shrink-0">{sector.percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                <div 
                  className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${sector.percentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {sector.amount.toLocaleString('sv-SE')} SEK
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const RiskDiversificationCard = () => (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <CardTitle className="text-sm sm:text-base">Risk & Diversifiering</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Måttlig Risk
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Riskanalys och diversifieringsstatus
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-primary">7.2</div>
              <div className="text-xs text-muted-foreground">Risk Score</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-primary">85%</div>
              <div className="text-xs text-muted-foreground">Diversifierad</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span>Väl diversifierad över sektorer</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <span>Överexponering mot teknik (35%)</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span>Bra geografisk spridning</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionsCard = () => (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <CardTitle className="text-sm sm:text-base">Snabbåtgärder för portfölj</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Vanliga åtgärder för din portfölj
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.action}
              className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
            >
              <action.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Portfolio Key Metrics - Always first */}
      <PortfolioKeyMetrics />
      
      {/* Main Content Grid - Mobile: 1 column, Desktop: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Sector Exposure - Now higher in hierarchy */}
          <SectorExposureCard />
          
          {/* Current Holdings Prices */}
          <CurrentHoldingsPrices />
          
          {/* AI Insights & Recommendations */}
          <AIMarketingPanel />
        </div>
        
        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Your Current Holdings */}
          <UserHoldingsManager />
          
          {/* AI-Recommended Holdings */}
          <AIRiskAssessment />
          
          {/* Risk & Diversification - Now lower in hierarchy */}
          <RiskDiversificationCard />
          
          {/* Quick Actions */}
          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;
