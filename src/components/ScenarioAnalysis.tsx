
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Target,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ScenarioAnalysisProps {
  portfolio: any;
}

const ScenarioAnalysis: React.FC<ScenarioAnalysisProps> = ({ portfolio }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scenarios, setScenarios] = useState([
    {
      name: 'Bull Market',
      probability: 30,
      impact: 25.5,
      description: 'Stark ekonomisk tillväxt, låg inflation',
      timeframe: '12 månader',
      factors: ['Stark BNP-tillväxt', 'Låga räntor', 'Högt förtroende']
    },
    {
      name: 'Bear Market',
      probability: 20,
      impact: -18.3,
      description: 'Recession, hög inflation, geopolitisk osäkerhet',
      timeframe: '12 månader', 
      factors: ['Recession', 'Höga räntor', 'Handelskrig']
    },
    {
      name: 'Sideways Market',
      probability: 35,
      impact: 4.2,
      description: 'Stabil men låg tillväxt, måttlig volatilitet',
      timeframe: '12 månader',
      factors: ['Stabil tillväxt', 'Måttlig inflation', 'Neutral centralbankspolitik']
    },
    {
      name: 'Black Swan',
      probability: 15,
      impact: -32.1,
      description: 'Oförutsedd kris, marknadspanik',
      timeframe: '6 månader',
      factors: ['Oförutsedd händelse', 'Marknadspanik', 'Likviditetskris']
    }
  ]);

  const stressTestData = [
    { test: 'Räntechock +3%', impact: -12.5, sector: 'Finans', explanation: 'Högre räntor påverkar finanssektorn negativt' },
    { test: 'Oljepris +50%', impact: 8.2, sector: 'Energi', explanation: 'Högre oljepriser gynnar energibolag' },
    { test: 'USD -20%', impact: 15.3, sector: 'Export', explanation: 'Svagare dollar gynnar exportföretag' },
    { test: 'VIX +100%', impact: -22.1, sector: 'Alla', explanation: 'Hög volatilitet påverkar alla sektorer negativt' },
    { test: 'Inflation +2%', impact: -8.7, sector: 'Konsument', explanation: 'Hög inflation minskar konsumenternas köpkraft' }
  ];

  const projectionData = [
    { month: 'Nu', conservative: 100000, likely: 100000, optimistic: 100000 },
    { month: '3M', conservative: 98000, likely: 103000, optimistic: 108000 },
    { month: '6M', conservative: 95000, likely: 106000, optimistic: 118000 },
    { month: '12M', conservative: 88000, likely: 112000, optimistic: 135000 },
    { month: '18M', conservative: 85000, likely: 118000, optimistic: 155000 },
    { month: '24M', conservative: 82000, likely: 125000, optimistic: 175000 }
  ];

  const runScenarioAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const getImpactColor = (impact: number) => {
    if (impact > 10) return 'text-green-600';
    if (impact > 0) return 'text-green-500';
    if (impact > -10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />;
    return <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />;
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span>Scenarioanalys</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runScenarioAnalysis}
            disabled={isAnalyzing}
            className="text-xs"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            {isAnalyzing ? 'Analyserar...' : 'Uppdatera'}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Avancerad scenarioanalys och stresstester för din portfölj
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <Tabs defaultValue="scenarios" className="w-full">
          <div className="w-full overflow-x-auto mb-3 sm:mb-4">
            <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-3 sm:w-full h-auto p-1">
              <TabsTrigger value="scenarios" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-20 sm:min-w-0">Scenarier</TabsTrigger>
              <TabsTrigger value="stress" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-20 sm:min-w-0">Stresstester</TabsTrigger>
              <TabsTrigger value="projections" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-20 sm:min-w-0">Projektioner</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="scenarios" className="mt-2 sm:mt-4 focus-visible:outline-none">
            <div className="space-y-3 sm:space-y-4">
              {scenarios.map((scenario, index) => (
                <Card key={index} className="border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 space-y-2 sm:space-y-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm sm:text-base">{scenario.name}</h4>
                        <Badge 
                          variant={scenario.impact > 0 ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {scenario.impact > 0 ? '+' : ''}{scenario.impact}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span>{scenario.probability}% sannolikhet</span>
                        {getImpactIcon(scenario.impact)}
                      </div>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                      {scenario.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Sannolikhet</span>
                        <span>{scenario.probability}%</span>
                      </div>
                      <Progress value={scenario.probability} className="h-1.5 sm:h-2" />
                    </div>
                    
                    <div className="mt-2 sm:mt-3">
                      <div className="text-xs text-muted-foreground mb-1">Nyckelfaktorer:</div>
                      <div className="flex flex-wrap gap-1">
                        {scenario.factors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stress" className="mt-2 sm:mt-4 focus-visible:outline-none">
            <div className="space-y-3 sm:space-y-4">
              {stressTestData.map((test, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs sm:text-sm truncate">{test.test}</h4>
                      <Badge variant="outline" className="text-xs flex-shrink-0">{test.sector}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{test.explanation}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className={`text-sm sm:text-base font-medium ${getImpactColor(test.impact)}`}>
                      {test.impact > 0 ? '+' : ''}{test.impact}%
                    </div>
                    {getImpactIcon(test.impact)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="projections" className="mt-2 sm:mt-4 focus-visible:outline-none">
            <div className="space-y-3 sm:space-y-4">
              <div className="h-48 sm:h-60 md:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toLocaleString()} SEK`, '']}
                      labelFormatter={(label) => `Tidsperiod: ${label}`}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="optimistic" 
                      stackId="1" 
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.1} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conservative" 
                      stackId="1" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.1} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="likely" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded flex-shrink-0"></div>
                  <span>Mest sannolikt</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500/20 border border-green-500 rounded flex-shrink-0"></div>
                  <span>Optimistiskt</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500/20 border border-red-500 rounded flex-shrink-0"></div>
                  <span>Konservativt</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScenarioAnalysis;
