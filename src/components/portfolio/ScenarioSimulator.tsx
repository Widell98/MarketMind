
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ScenarioSimulatorProps {
  currentValue: number;
  monthlyContribution: number;
  expectedReturn: number;
  timeHorizon: number;
}

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  currentValue,
  monthlyContribution,
  expectedReturn,
  timeHorizon
}) => {
  const [marketCrashYear, setMarketCrashYear] = useState([5]);
  const [crashSeverity, setCrashSeverity] = useState([-30]);
  const [recoveryYears, setRecoveryYears] = useState([2]);
  const [activeScenario, setActiveScenario] = useState<'normal' | 'optimistic' | 'crash'>('normal');

  const calculateScenario = (scenario: 'normal' | 'optimistic' | 'crash') => {
    const data = [];
    let value = currentValue;
    const annualContribution = monthlyContribution * 12;
    
    for (let year = 0; year <= timeHorizon; year++) {
      let yearlyReturn = expectedReturn;
      
      if (scenario === 'optimistic') {
        yearlyReturn = expectedReturn + 3;
      } else if (scenario === 'crash' && year === marketCrashYear[0]) {
        yearlyReturn = crashSeverity[0];
      } else if (scenario === 'crash' && year > marketCrashYear[0] && year <= marketCrashYear[0] + recoveryYears[0]) {
        // Recovery phase
        yearlyReturn = expectedReturn + (15 - (year - marketCrashYear[0]) * 5);
      }
      
      value = value * (1 + yearlyReturn / 100) + annualContribution;
      
      data.push({
        year,
        value: Math.round(value),
        scenario: scenario
      });
    }
    
    return data;
  };

  const scenarios = {
    normal: calculateScenario('normal'),
    optimistic: calculateScenario('optimistic'),
    crash: calculateScenario('crash')
  };

  const finalValues = {
    normal: scenarios.normal[scenarios.normal.length - 1].value,
    optimistic: scenarios.optimistic[scenarios.optimistic.length - 1].value,
    crash: scenarios.crash[scenarios.crash.length - 1].value
  };

  const scenarioButtons = [
    { id: 'normal', label: 'Normal', color: 'bg-blue-500', icon: TrendingUp },
    { id: 'optimistic', label: 'Optimistisk', color: 'bg-green-500', icon: TrendingUp },
    { id: 'crash', label: 'Marknadskrasch', color: 'bg-red-500', icon: TrendingDown }
  ];

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calculator className="w-5 h-5 text-primary" />
          Scenario Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Selection */}
        <div className="flex gap-2 flex-wrap">
          {scenarioButtons.map(({ id, label, color, icon: Icon }) => (
            <Button
              key={id}
              variant={activeScenario === id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveScenario(id as any)}
              className={`flex items-center gap-2 ${
                activeScenario === id ? `${color} text-white` : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Crash Scenario Controls */}
        {activeScenario === 'crash' && (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Krasch-inställningar</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Krasch år: {marketCrashYear[0]}</label>
                <Slider
                  value={marketCrashYear}
                  onValueChange={setMarketCrashYear}
                  max={timeHorizon - 1}
                  min={1}
                  step={1}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Krasch-svårighetsgrad: {crashSeverity[0]}%</label>
                <Slider
                  value={crashSeverity}
                  onValueChange={setCrashSeverity}
                  max={-10}
                  min={-50}
                  step={5}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Återhämtning (år): {recoveryYears[0]}</label>
                <Slider
                  value={recoveryYears}
                  onValueChange={setRecoveryYears}
                  max={5}
                  min={1}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scenarios[activeScenario]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                formatter={(value: number) => [
                  `${value.toLocaleString('sv-SE')} SEK`,
                  'Portföljvärde'
                ]}
                labelFormatter={(label) => `År ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={scenarioButtons.find(s => s.id === activeScenario)?.color.replace('bg-', '#')}
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(finalValues).map(([scenario, value]) => (
            <div key={scenario} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {value.toLocaleString('sv-SE')} SEK
              </div>
              <div className="text-sm text-muted-foreground capitalize">
                {scenario === 'normal' ? 'Normal' : 
                 scenario === 'optimistic' ? 'Optimistisk' : 'Krasch'}
              </div>
              <Badge 
                variant={scenario === activeScenario ? 'default' : 'secondary'}
                className="mt-2"
              >
                {((value - currentValue) / currentValue * 100).toFixed(1)}% tillväxt
              </Badge>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Insikter</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Månadsvis sparande: {monthlyContribution.toLocaleString('sv-SE')} SEK</li>
            <li>• Förväntad årlig avkastning: {expectedReturn}%</li>
            <li>• Tidshorisont: {timeHorizon} år</li>
            <li>• Skillnad optimistisk vs krasch: {((finalValues.optimistic - finalValues.crash) / 1000000).toFixed(1)}M SEK</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioSimulator;
