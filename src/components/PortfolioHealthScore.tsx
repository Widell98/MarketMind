
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioHealthScoreProps {
  totalValue: number;
  diversificationScore: number;
  riskScore: number;
  performanceScore: number;
  cashPercentage: number;
}

const PortfolioHealthScore: React.FC<PortfolioHealthScoreProps> = ({
  totalValue,
  diversificationScore,
  riskScore,
  performanceScore,
  cashPercentage
}) => {
  // Calculate overall health score
  const calculateHealthScore = () => {
    const scores = {
      diversification: diversificationScore,
      risk: riskScore,
      performance: performanceScore,
      cash: cashPercentage > 20 ? 60 : cashPercentage < 5 ? 80 : 100
    };

    const weights = {
      diversification: 0.3,
      risk: 0.25,
      performance: 0.25,
      cash: 0.2
    };

    return Math.round(
      scores.diversification * weights.diversification +
      scores.risk * weights.risk +
      scores.performance * weights.performance +
      scores.cash * weights.cash
    );
  };

  const healthScore = calculateHealthScore();

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Utmärkt', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950/20' };
    if (score >= 60) return { label: 'Bra', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950/20' };
    if (score >= 40) return { label: 'Okej', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-950/20' };
    return { label: 'Behöver förbättras', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950/20' };
  };

  const status = getHealthStatus(healthScore);

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return TrendingUp;
    if (score >= 40) return Info;
    return AlertTriangle;
  };

  const ScoreIcon = getScoreIcon(healthScore);

  const metrics = [
    {
      label: 'Diversifiering',
      score: diversificationScore,
      icon: Shield,
      description: 'Spridning av investeringar'
    },
    {
      label: 'Riskbalans',
      score: riskScore,
      icon: Heart,
      description: 'Risk vs avkastning'
    },
    {
      label: 'Utveckling',
      score: performanceScore,
      icon: TrendingUp,
      description: 'Senaste månadens utveckling'
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-blue-600/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Main Health Score */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              status.bg
            )}>
              <ScoreIcon className={cn("w-6 h-6", status.color)} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-foreground">
                  {healthScore}/100
                </span>
                <Badge className={cn("text-xs", status.bg, status.color)}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Portfolio Hälsa
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-xs">
            <Progress 
              value={healthScore} 
              className="h-2"
            />
          </div>

          {/* Mini Metrics */}
          <div className="hidden lg:flex items-center gap-4">
            {metrics.map((metric) => {
              const MetricIcon = metric.icon;
              const metricStatus = getHealthStatus(metric.score);
              
              return (
                <div key={metric.label} className="text-center">
                  <div className="flex items-center gap-1 mb-1">
                    <MetricIcon className="w-3 h-3 text-muted-foreground" />
                    <span className={cn("text-sm font-medium", metricStatus.color)}>
                      {metric.score}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioHealthScore;
