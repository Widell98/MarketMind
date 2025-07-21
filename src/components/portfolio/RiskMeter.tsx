
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

interface RiskMeterProps {
  sectorExposure: Array<{
    sector: string;
    value: number;
    percentage: number;
    holdingsCount: number;
  }>;
  holdings: Array<{
    name: string;
    symbol?: string;
    sector?: string;
    value: number;
    percentage: number;
  }>;
  totalValue: number;
}

type RiskLevel = 'low' | 'medium' | 'high';

const RiskMeter: React.FC<RiskMeterProps> = ({
  sectorExposure,
  holdings,
  totalValue
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sectors' | 'concentration'>('overview');

  // Calculate various risk metrics
  const calculateRiskMetrics = () => {
    // Concentration risk (based on single holding percentage)
    const maxHoldingPercentage = Math.max(...holdings.map(h => h.percentage));
    const concentrationRisk: RiskLevel = maxHoldingPercentage > 20 ? 'high' : 
                            maxHoldingPercentage > 10 ? 'medium' : 'low';

    // Sector concentration risk
    const maxSectorPercentage = Math.max(...sectorExposure.map(s => s.percentage));
    const sectorConcentrationRisk: RiskLevel = maxSectorPercentage > 40 ? 'high' : 
                                   maxSectorPercentage > 25 ? 'medium' : 'low';

    // Diversification score (based on number of holdings and sectors)
    const holdingsCount = holdings.length;
    const sectorsCount = sectorExposure.length;
    const diversificationScore = Math.min(100, (holdingsCount * 3) + (sectorsCount * 10));

    // Overall risk score (0-100, where 100 is highest risk)
    const overallRiskScore = (
      (concentrationRisk === 'high' ? 40 : concentrationRisk === 'medium' ? 20 : 10) +
      (sectorConcentrationRisk === 'high' ? 30 : sectorConcentrationRisk === 'medium' ? 15 : 5) +
      (100 - diversificationScore) * 0.3
    );

    return {
      concentrationRisk,
      sectorConcentrationRisk,
      diversificationScore,
      overallRiskScore: Math.min(100, overallRiskScore),
      maxHoldingPercentage,
      maxSectorPercentage,
      holdingsCount,
      sectorsCount
    };
  };

  const metrics = calculateRiskMetrics();

  const getRiskColor = (risk: RiskLevel) => {
    return risk === 'high' ? 'text-red-600 bg-red-50 border-red-200' :
           risk === 'medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
           'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskLevel = (score: number): RiskLevel => {
    return score > 70 ? 'high' : score > 40 ? 'medium' : 'low';
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (metrics.concentrationRisk === 'high') {
      recommendations.push({
        type: 'warning',
        message: `Din största position utgör ${metrics.maxHoldingPercentage.toFixed(1)}% av portföljen. Överväg att minska exponeringen.`
      });
    }

    if (metrics.sectorConcentrationRisk === 'high') {
      recommendations.push({
        type: 'warning',
        message: `Överexponering mot en sektor (${metrics.maxSectorPercentage.toFixed(1)}%). Diversifiera över fler sektorer.`
      });
    }

    if (metrics.holdingsCount < 10) {
      recommendations.push({
        type: 'info',
        message: 'Överväg att öka antalet innehav för bättre diversifiering.'
      });
    }

    if (metrics.sectorsCount < 5) {
      recommendations.push({
        type: 'info',
        message: 'Lägg till innehav från fler sektorer för att minska sektorrisken.'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="w-5 h-5 text-primary" />
          Risk Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'Översikt', icon: Activity },
            { id: 'sectors', label: 'Sektorer', icon: TrendingUp },
            { id: 'concentration', label: 'Koncentration', icon: AlertTriangle }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(id as any)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Overall Risk Score */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold mb-2" style={{
                color: getRiskLevel(metrics.overallRiskScore) === 'high' ? '#dc2626' :
                       getRiskLevel(metrics.overallRiskScore) === 'medium' ? '#d97706' : '#059669'
              }}>
                {metrics.overallRiskScore.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Risk Score (0-100)</div>
              <Badge className={getRiskColor(getRiskLevel(metrics.overallRiskScore))}>
                {getRiskLevel(metrics.overallRiskScore) === 'high' ? 'Hög Risk' :
                 getRiskLevel(metrics.overallRiskScore) === 'medium' ? 'Medel Risk' : 'Låg Risk'}
              </Badge>
            </div>

            {/* Risk Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Koncentrationsrisk</h4>
                <Badge className={getRiskColor(metrics.concentrationRisk)}>
                  {metrics.concentrationRisk === 'high' ? 'Hög' :
                   metrics.concentrationRisk === 'medium' ? 'Medel' : 'Låg'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Största position: {metrics.maxHoldingPercentage.toFixed(1)}%
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Sektordiversifiering</h4>
                <Badge className={getRiskColor(metrics.sectorConcentrationRisk)}>
                  {metrics.sectorConcentrationRisk === 'high' ? 'Hög Risk' :
                   metrics.sectorConcentrationRisk === 'medium' ? 'Medel Risk' : 'Låg Risk'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.sectorsCount} sektorer
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Diversifieringspoäng</h4>
                <div className="mb-2">
                  <Progress value={metrics.diversificationScore} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {metrics.diversificationScore.toFixed(0)}/100
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Portföljstorlek</h4>
                <div className="text-lg font-semibold text-foreground">
                  {metrics.holdingsCount} innehav
                </div>
                <p className="text-sm text-muted-foreground">
                  Rekommenderat: 15-25 innehav
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sectors Tab */}
        {activeTab === 'sectors' && (
          <div className="space-y-4">
            {sectorExposure.map((sector, index) => (
              <div key={sector.sector} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{sector.sector}</span>
                  <Badge variant={sector.percentage > 25 ? 'destructive' : 'secondary'}>
                    {sector.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={sector.percentage} className="h-2 mb-1" />
                <div className="text-sm text-muted-foreground">
                  {sector.holdingsCount} innehav • {sector.value.toLocaleString('sv-SE')} SEK
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Concentration Tab */}
        {activeTab === 'concentration' && (
          <div className="space-y-4">
            <h4 className="font-semibold">Största positioner</h4>
            {holdings
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 10)
              .map((holding, index) => (
                <div key={holding.name} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-medium">{holding.name}</span>
                      {holding.symbol && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({holding.symbol})
                        </span>
                      )}
                    </div>
                    <Badge variant={holding.percentage > 10 ? 'destructive' : 'secondary'}>
                      {holding.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={holding.percentage} className="h-2 mb-1" />
                  <div className="text-sm text-muted-foreground">
                    {holding.value.toLocaleString('sv-SE')} SEK
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Rekommendationer</h4>
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                    rec.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <p className={`text-sm ${
                    rec.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {rec.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskMeter;
