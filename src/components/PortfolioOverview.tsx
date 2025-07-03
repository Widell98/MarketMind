
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  PieChart, 
  Lightbulb, 
  MessageSquare,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
import { UserPortfolio } from '@/hooks/usePortfolio';
import CurrentHoldingsPrices from '@/components/CurrentHoldingsPrices';
import UserHoldingsManager from '@/components/UserHoldingsManager';
import PortfolioValueOverview from '@/components/PortfolioValueOverview';

interface PortfolioOverviewProps {
  portfolio: UserPortfolio | null;
  onQuickChat: (message: string) => void;
  onActionClick: (action: string) => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolio,
  onQuickChat,
  onActionClick
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const quickChatOptions = [
    {
      id: 'portfolio-analysis',
      title: 'Analysera min portfölj',
      description: 'Få en djupgående analys av din nuvarande portfölj',
      icon: <BarChart3 className="w-4 h-4" />,
      message: 'NEW_SESSION:Portfolio Analysis:Kan du analysera min nuvarande portfölj och ge mig feedback på diversifiering, risk och möjliga förbättringar?'
    },
    {
      id: 'market-outlook',
      title: 'Marknadsläge',
      description: 'Diskutera aktuellt marknadsläge',
      icon: <TrendingUp className="w-4 h-4" />,
      message: 'NEW_SESSION:Market Analysis:Vad är ditt perspektiv på det nuvarande marknadsläget och hur påverkar det min investeringsstrategi?'
    },
    {
      id: 'stock-recommendations',
      title: 'Aktierekommendationer',
      description: 'Få personliga aktieförslag',
      icon: <Target className="w-4 h-4" />,
      message: 'NEW_SESSION:Stock Recommendations:Baserat på min riskprofil och nuvarande innehav, vilka aktier skulle du rekommendera för min portfölj?'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Strategy Card */}
      {portfolio && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{portfolio.portfolio_name}</CardTitle>
                <CardDescription className="text-base">
                  AI-genererad strategi baserad på din riskprofil
                </CardDescription>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Risk: {portfolio.risk_score}/10
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">
                    Förväntad avkastning: {((portfolio.expected_return || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    Skapad: {new Date(portfolio.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">
                    Status: {portfolio.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {quickChatOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onQuickChat(option.message)}
                    className="flex items-center gap-2 text-xs"
                  >
                    {option.icon}
                    {option.title}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Portföljvärde
          </TabsTrigger>
          <TabsTrigger value="prices" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Aktuella Priser
          </TabsTrigger>
          <TabsTrigger value="holdings" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Hantera Innehav
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PortfolioValueOverview />
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <CurrentHoldingsPrices />
        </TabsContent>

        <TabsContent value="holdings" className="space-y-4">
          <UserHoldingsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioOverview;
