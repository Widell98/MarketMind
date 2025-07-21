
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScenarioSimulatorProps {
  portfolio?: any;
}

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ portfolio }) => {
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Marknadsfall',
      marketChange: -20,
      timeframe: 6,
      impact: -18.5,
      probability: 25
    },
    {
      id: 2,
      name: 'Bull Market',
      marketChange: 25,
      timeframe: 12,
      impact: 23.2,
      probability: 35
    },
    {
      id: 3,
      name: 'Recession',
      marketChange: -35,
      timeframe: 18,
      impact: -32.1,
      probability: 15
    }
  ]);

  const [customScenario, setCustomScenario] = useState({
    name: 'Anpassat scenario',
    marketChange: 0,
    timeframe: 12,
    sectorAdjustments: {
      tech: 0,
      finance: 0,
      healthcare: 0,
      energy: 0
    }
  });

  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async (scenario: any) => {
    setIsSimulating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      const baseValue = 1000000; // Mock portfolio value
      const impactValue = baseValue * (1 + scenario.marketChange / 100);
      const monthlyData = [];
      
      for (let i = 0; i <= scenario.timeframe; i++) {
        const progress = i / scenario.timeframe;
        const currentValue = baseValue + (impactValue - baseValue) * progress;
        monthlyData.push({
          month: i,
          value: Math.round(currentValue),
          change: ((currentValue - baseValue) / baseValue) * 100
        });
      }

      setSimulationResults({
        scenario: scenario.name,
        finalValue: impactValue,
        totalReturn: scenario.marketChange,
        monthlyData,
        riskMetrics: {
          maxDrawdown: Math.min(scenario.marketChange * 1.2, 0),
          volatility: Math.abs(scenario.marketChange) * 0.8,
          sharpeRatio: scenario.marketChange > 0 ? 1.2 : -0.5
        }
      });
      setIsSimulating(false);
    }, 2000);
  };

  const updateCustomScenario = (field: string, value: any) => {
    setCustomScenario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSectorAdjustment = (sector: string, value: number) => {
    setCustomScenario(prev => ({
      ...prev,
      sectorAdjustments: {
        ...prev.sectorAdjustments,
        [sector]: value
      }
    }));
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span>Scenario-simulator</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Analysera hur din portfölj påverkas av olika marknadsscenarier
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <Tabs defaultValue="predefined" className="w-full">
          <div className="w-full overflow-x-auto mb-3 sm:mb-4">
            <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-2 sm:w-full h-auto p-1">
              <TabsTrigger value="predefined" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-24 sm:min-w-0">Förberedda scenarier</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-24 sm:min-w-0">Anpassat scenario</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="predefined" className="mt-2 sm:mt-4 focus-visible:outline-none">
            <div className="space-y-3 sm:space-y-4">
              {scenarios.map((scenario) => (
                <Card key={scenario.id} className="border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 space-y-2 sm:space-y-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm sm:text-base">{scenario.name}</h4>
                        <Badge variant={scenario.impact > 0 ? "default" : "destructive"} className="text-xs">
                          {scenario.impact > 0 ? '+' : ''}{scenario.impact}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {scenario.timeframe} månader
                        </span>
                        {scenario.impact > 0 ? 
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" /> : 
                          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                        }
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Marknadsförändring: {scenario.marketChange > 0 ? '+' : ''}{scenario.marketChange}%
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runSimulation(scenario)}
                        disabled={isSimulating}
                        className="text-xs self-start sm:self-auto"
                      >
                        {isSimulating ? (
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1 sm:mr-2" />
                        ) : (
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        )}
                        Simulera
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-2 sm:mt-4 focus-visible:outline-none">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name" className="text-xs sm:text-sm">Scenarionamn</Label>
                  <Input
                    id="scenario-name"
                    value={customScenario.name}
                    onChange={(e) => updateCustomScenario('name', e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Tidsperiod (månader)</Label>
                  <Input
                    type="number"
                    value={customScenario.timeframe}
                    onChange={(e) => updateCustomScenario('timeframe', parseInt(e.target.value))}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs sm:text-sm">Allmän marknadsförändring: {customScenario.marketChange}%</Label>
                <Slider
                  value={[customScenario.marketChange]}
                  onValueChange={(value) => updateCustomScenario('marketChange', value[0])}
                  min={-50}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs sm:text-sm font-medium">Sektorspecifika justeringar</Label>
                
                {Object.entries(customScenario.sectorAdjustments).map(([sector, value]) => (
                  <div key={sector} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm capitalize">{sector}</span>
                      <span className="text-xs text-muted-foreground">{value > 0 ? '+' : ''}{value}%</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={(newValue) => updateSectorAdjustment(sector, newValue[0])}
                      min={-30}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={() => runSimulation({
                  name: customScenario.name,
                  marketChange: customScenario.marketChange,
                  timeframe: customScenario.timeframe
                })}
                disabled={isSimulating}
                className="w-full"
              >
                {isSimulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                Kör anpassad simulering
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {simulationResults && (
          <Card className="mt-4 sm:mt-6">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base">Simuleringsresultat: {simulationResults.scenario}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold">
                    {simulationResults.totalReturn > 0 ? '+' : ''}{simulationResults.totalReturn.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Total avkastning</div>
                </div>
                
                <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold">
                    {simulationResults.finalValue.toLocaleString()} SEK
                  </div>
                  <div className="text-xs text-muted-foreground">Slutvärde</div>
                </div>
                
                <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold">
                    {simulationResults.riskMetrics.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                </div>
              </div>

              <div className="h-48 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationResults.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toLocaleString()} SEK`, 'Portföljvärde']}
                      labelFormatter={(label) => `Månad ${label}`}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  {simulationResults.riskMetrics.maxDrawdown < -15 ? 
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  }
                  <span>Max drawdown: {simulationResults.riskMetrics.maxDrawdown.toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {simulationResults.riskMetrics.volatility > 20 ? 
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  }
                  <span>Volatilitet: {simulationResults.riskMetrics.volatility.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default ScenarioSimulator;
