
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  ArrowRightLeft, 
  Lightbulb, 
  TrendingUp, 
  Shield, 
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface QuickActionPanelProps {
  onAction: (action: string) => void;
}

const QuickActionPanel: React.FC<QuickActionPanelProps> = ({ onAction }) => {
  const actions = [
    {
      id: 'optimize',
      title: 'Optimera portfölj',
      description: 'AI-förslag för förbättringar',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'rebalance',
      title: 'Rebalansera',
      description: 'Justera fördelningen',
      icon: ArrowRightLeft,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'analyze',
      title: 'Analys',
      description: 'Djup prestandaanalys',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'discover',
      title: 'Upptäck',
      description: 'Hitta nya möjligheter',
      icon: Lightbulb,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      id: 'risk',
      title: 'Risk-check',
      description: 'Utvärdera riskexponering',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      gradient: 'from-red-500 to-red-600'
    },
    {
      id: 'trends',
      title: 'Marknadstrender',
      description: 'Senaste marknadsinsikter',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Zap className="w-5 h-5 text-primary" />
          Snabbåtgärder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              className={`w-full justify-start h-auto p-4 ${action.bgColor} ${action.borderColor} hover:shadow-md transition-all duration-200 group`}
              onClick={() => onAction(action.id)}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-foreground">{action.title}</div>
                <div className="text-sm text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickActionPanel;
