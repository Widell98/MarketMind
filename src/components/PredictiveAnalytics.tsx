
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  BarChart3, 
  Calendar,
  Activity,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PredictiveAnalyticsProps {
  portfolioId?: string;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ portfolioId }) => {
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration - in real implementation, this would come from AI analysis
  const mockPredictions = {
    shortTerm: {
      probability: 75,
      direction: 'up',
      expectedReturn: 3.2,
      confidence: 'medium',
      timeframe: '1 månad'
    },
    mediumTerm: {
      probability: 68,
      direction: 'up', 
      expectedReturn: 8.5,
      confidence: 'high',
      timeframe: '6 månader'
    },
    longTerm: {
      probability: 82,
      direction: 'up',
      expectedReturn: 24.7,
      confidence: 'high',
      timeframe: '2 år'
    }
  };

  const mockScenarios = [
    {
      name: 'Optimistiskt',
      probability: 25,
      return: 35.2,
      description: 'Stark marknadstillväxt, positiva nyheter'
    },
    {
      name: 'Mest sannolikt',
      probability: 50,
      return: 24.7,
      description: 'Normal marknadsvolatilitet'
    },
    {
      name: 'Pessimistiskt',
      probability: 25,
      return: 8.3,
      description: 'Marknadskorrigering, ekonomisk osäkerhet'
    }
  ];

  const mockProjectionData = [
    { month: 'Jan', projected: 100000, upper: 105000, lower: 95000 },
    { month: 'Feb', projected: 102000, upper: 108000, lower: 96000 },
    { month: 'Mar', projected: 105000, upper: 112000, lower: 98000 },
    { month: 'Apr', projected: 108000, upper: 116000, lower: 100000 },
    { month: 'Maj', projected: 111000, upper: 120000, lower: 102000 },
    { month: 'Jun', projected: 115000, upper: 125000, lower: 105000 },
  ];

  const generatePredictions = async () => {
    setLoading(true);
    // Simulate AI analysis
    setTimeout(() => {
      setPredictions(mockPredictions);
      setLoading(false);
    }, 2000);
  };

  useEffect(() => {
    if (portfolioId) {
      generatePredictions();
    }
  }, [portfolioId]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Prediktiv Analys - AI Fas 4
        </CardTitle>
        <CardDescription>
          AI-baserade prognoser och scenarioanalyser för din portfölj
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse text-purple-600" />
            <p>AI analyserar marknadsdata och genererar prognoser...</p>
          </div>
        ) : predictions ? (
          <Tabs defaultValue="predictions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="predictions">Prognoser</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarier</TabsTrigger>
              <TabsTrigger value="projections">Projektioner</TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(predictions).map(([key, pred]: [string, any]) => (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {pred.timeframe}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Riktning</span>
                          <div className="flex items-center gap-1">
                            {getDirectionIcon(pred.direction)}
                            <span className="text-sm font-medium">
                              {pred.direction === 'up' ? 'Uppgång' : 'Nedgång'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Förväntad avkastning</span>
                          <span className="text-sm font-medium text-green-600">
                            +{pred.expectedReturn}%
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sannolikhet</span>
                            <span className="text-sm font-medium">{pred.probability}%</span>
                          </div>
                          <Progress value={pred.probability} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tillförlitlighet</span>
                          <Badge variant="outline" className={getConfidenceColor(pred.confidence)}>
                            {pred.confidence === 'high' ? 'Hög' : pred.confidence === 'medium' ? 'Medium' : 'Låg'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="scenarios" className="mt-4">
              <div className="space-y-4">
                {mockScenarios.map((scenario, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{scenario.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {scenario.probability}% sannolikhet
                          </span>
                          <Badge variant={
                            scenario.return > 30 ? 'default' :
                            scenario.return > 15 ? 'secondary' : 'outline'
                          }>
                            +{scenario.return}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {scenario.description}
                      </p>
                      <Progress value={scenario.probability * 2} className="h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="projections" className="mt-4">
              <div className="space-y-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockProjectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: any) => [`${value.toLocaleString()} SEK`, '']}
                        labelFormatter={(label) => `Månad: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="upper" 
                        stackId="1" 
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.1} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lower" 
                        stackId="1" 
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.1} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Förväntad utveckling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/20 border border-green-500 rounded"></div>
                    <span>Optimistiskt scenario</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded"></div>
                    <span>Pessimistiskt scenario</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">Inga prognoser genererade än</p>
            <Button onClick={generatePredictions} disabled={loading}>
              <Brain className="w-4 h-4 mr-2" />
              Generera AI-prognoser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalytics;
