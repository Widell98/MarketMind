
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PortfolioSummary from './portfolio/PortfolioSummary';
import QuickActions from './portfolio/QuickActions';
import InteractivePortfolio from './InteractivePortfolio';
import { Brain, BarChart3, Settings, TrendingUp } from 'lucide-react';

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
  const [refreshing, setRefreshing] = useState(false);

  const handleActionComplete = async (action: string, data?: any) => {
    setRefreshing(true);
    
    // Simulera datauppdatering
    setTimeout(() => {
      setRefreshing(false);
      onActionClick(action);
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'view_all_holdings':
        onQuickChat('Visa alla mina innehav med detaljerad information om varje position');
        break;
      default:
        onActionClick(action);
    }
  };

  if (!portfolio) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted">
            <Brain className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ingen aktiv portfölj</h3>
          <p className="text-muted-foreground mb-4">
            Skapa din första AI-genererade portfölj för att komma igång.
          </p>
          <Button onClick={() => onActionClick('create_portfolio')}>
            Skapa portfölj
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-1.5" />
            <span className="hidden xs:inline">Översikt</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4 mr-1.5" />
            <span className="hidden xs:inline">Åtgärder</span>
          </TabsTrigger>
          <TabsTrigger value="interactive" className="text-xs sm:text-sm">
            <Settings className="w-4 h-4 mr-1.5" />
            <span className="hidden xs:inline">Hantera</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PortfolioSummary 
            portfolio={portfolio}
            onQuickAction={handleQuickAction}
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <QuickActions 
            portfolio={portfolio}
            onActionComplete={handleActionComplete}
          />
        </TabsContent>

        <TabsContent value="interactive" className="space-y-4">
          <InteractivePortfolio 
            portfolio={portfolio}
            onQuickChat={onQuickChat}
          />
        </TabsContent>
      </Tabs>

      {refreshing && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Uppdaterar portfölj...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PortfolioOverview;
