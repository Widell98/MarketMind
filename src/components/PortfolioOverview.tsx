import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Activity,
  Target,
  Zap,
  MessageSquare,
  Brain,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
  // Mock data for demonstration
  const performanceData = [
    { month: 'Jan', value: 95000 },
    { month: 'Feb', value: 98000 },
    { month: 'Mar', value: 102000 },
    { month: 'Apr', value: 108000 },
    { month: 'Maj', value: 105000 },
    { month: 'Jun', value: 112000 },
  ];

  const allocationData = [
    { name: 'Aktier', value: 60, color: '#3b82f6' },
    { name: 'Obligationer', value: 25, color: '#10b981' },
    { name: 'Fastigheter', value: 10, color: '#f59e0b' },
    { name: 'Råvaror', value: 5, color: '#ef4444' },
  ];

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt värde</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,125,430 SEK</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1 text-green-600" />
              +8.2% sedan årets början
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månadsavkastning</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+2.4%</div>
            <p className="text-xs text-muted-foreground">
              +24,350 SEK denna månad
            </p>
          </CardContent>
        </Card>
        
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
      </div>

      {/* Performance Chart and Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Portföljutveckling</CardTitle>
            <CardDescription>Värdutveckling senaste 6 månaderna</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => [`${value.toLocaleString()} SEK`, 'Värde']} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Tillgångsfördelning</CardTitle>
            <CardDescription>Aktuell allokering per tillgångsklass</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
            Snabbåtgärder
          </CardTitle>
          <CardDescription>
            Vanliga frågor och åtgärder för din portfölj
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onQuickChat && onQuickChat("Hur presterar min portfölj jämfört med marknaden? Kan du ge mig en detaljerad analys?")}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Prestationsanalys</div>
                <div className="text-xs text-muted-foreground">Jämför med marknaden</div>
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
            
            <Button
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => onActionClick && onActionClick('opportunity')}
            >
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <div>
                <div className="font-medium text-sm">Nya möjligheter</div>
                <div className="text-xs text-muted-foreground">Hitta investeringar</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
