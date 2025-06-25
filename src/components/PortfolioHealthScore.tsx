
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Target, 
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PortfolioHealthScoreProps {
  portfolio: any;
}

const PortfolioHealthScore: React.FC<PortfolioHealthScoreProps> = ({ portfolio }) => {
  // Calculate health metrics
  const calculateHealthScore = () => {
    let score = 0;
    const checks = [];

    // Diversification check (based on number of holdings)
    const holdingCount = portfolio?.recommended_stocks?.length || 0;
    if (holdingCount >= 8) {
      score += 20;
      checks.push({ name: 'Diversifiering', status: 'good', value: `${holdingCount} innehav` });
    } else {
      checks.push({ name: 'Diversifiering', status: 'warning', value: `${holdingCount} innehav` });
    }

    // Risk assessment
    const riskScore = portfolio?.risk_score || 0;
    if (riskScore <= 6) {
      score += 25;
      checks.push({ name: 'Riskkontroll', status: 'good', value: `${riskScore}/10` });
    } else if (riskScore <= 8) {
      score += 15;
      checks.push({ name: 'Riskkontroll', status: 'warning', value: `${riskScore}/10` });
    } else {
      checks.push({ name: 'Riskkontroll', status: 'danger', value: `${riskScore}/10` });
    }

    // Expected return check
    const expectedReturn = portfolio?.expected_return || 0;
    if (expectedReturn >= 8) {
      score += 25;
      checks.push({ name: 'Förväntad avkastning', status: 'good', value: `${expectedReturn}%` });
    } else if (expectedReturn >= 5) {
      score += 15;
      checks.push({ name: 'Förväntad avkastning', status: 'warning', value: `${expectedReturn}%` });
    } else {
      checks.push({ name: 'Förväntad avkastning', status: 'danger', value: `${expectedReturn}%` });
    }

    // Asset allocation balance
    const allocation = portfolio?.asset_allocation || {};
    const hasBalancedAllocation = Object.keys(allocation).length >= 3;
    if (hasBalancedAllocation) {
      score += 15;
      checks.push({ name: 'Balanserad allokering', status: 'good', value: 'Ja' });
    } else {
      checks.push({ name: 'Balanserad allokering', status: 'warning', value: 'Nej' });
    }

    // Recent rebalancing
    const lastRebalanced = portfolio?.last_rebalanced_at;
    const isRecentlyRebalanced = lastRebalanced && 
      new Date(lastRebalanced) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    if (isRecentlyRebalanced) {
      score += 15;
      checks.push({ name: 'Senaste ombalansering', status: 'good', value: 'Inom 3 månader' });
    } else {
      checks.push({ name: 'Senaste ombalansering', status: 'warning', value: 'Över 3 månader' });
    }

    return { score: Math.min(score, 100), checks };
  };

  const { score, checks } = calculateHealthScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <Activity className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <Activity className="w-4 h-4 text-yellow-600" />;
      case 'danger': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          {getScoreIcon(score)}
          <span>Portfolio Health Score</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Omfattande analys av din portföljs hälsa och prestanda
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="space-y-4 sm:space-y-6">
          {/* Overall Score */}
          <div className="text-center space-y-2 sm:space-y-3">
            <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${getScoreColor(score)}`}>
              {score}/100
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Progress value={score} className="h-2 sm:h-3" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                {score >= 80 ? 'Utmärkt portföljhälsa' : 
                 score >= 60 ? 'God portföljhälsa med förbättringsmöjligheter' : 
                 'Portföljen behöver uppmärksamhet'}
              </p>
            </div>
          </div>

          {/* Health Checks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {checks.map((check, index) => (
              <div
                key={index}
                className={`p-2 sm:p-3 rounded-lg border ${getStatusColor(check.status)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium">{check.name}</span>
                  {getStatusIcon(check.status)}
                </div>
                <span className="text-xs text-muted-foreground">{check.value}</span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-medium text-xs sm:text-sm">Förbättringsförslag</h4>
            <div className="space-y-1 sm:space-y-2">
              {score < 80 && (
                <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                  <span>Överväg att ombalansera portföljen för bättre diversifiering</span>
                </div>
              )}
              {checks.find(c => c.name === 'Riskkontroll' && c.status !== 'good') && (
                <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                  <span>Minska risken genom att diversifiera mellan sektorer</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                <span>Använd AI-chatten för personliga rekommendationer</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioHealthScore;
