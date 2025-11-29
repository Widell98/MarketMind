import React, { useState, useEffect } from 'react';
import { InvestmentGoal } from '@/hooks/useInvestmentGoals';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { differenceInMonths } from 'date-fns';
import { SmartSavingTip } from './SmartSavingTip';

interface ScenarioSimulatorProps {
  goal: InvestmentGoal;
}

export const ScenarioSimulator = ({ goal }: ScenarioSimulatorProps) => {
  const [monthlyContribution, setMonthlyContribution] = useState(1000); // Default assumption
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [annualReturn, setAnnualReturn] = useState(7); // Default 7%
  const [projectedAmount, setProjectedAmount] = useState(0);
  const [originalProjected, setOriginalProjected] = useState(0);

  useEffect(() => {
    calculateProjection();
  }, [monthlyContribution, extraMonthly, annualReturn, goal]);

  const calculateProjection = () => {
    const monthsRemaining = Math.max(1, differenceInMonths(new Date(goal.target_date), new Date()));
    const monthlyRate = annualReturn / 100 / 12;
    
    // Future Value of a Series formula for contributions + Compound Interest for current amount
    // FV = P * (1 + r)^n + PMT * (((1 + r)^n - 1) / r)
    
    const calculateFV = (monthly: number) => {
      const currentValCompound = goal.current_amount * Math.pow(1 + monthlyRate, monthsRemaining);
      const contributionsFV = monthly * ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate);
      return currentValCompound + contributionsFV;
    };

    setOriginalProjected(calculateFV(monthlyContribution));
    setProjectedAmount(calculateFV(monthlyContribution + extraMonthly));
  };

  const difference = projectedAmount - originalProjected;
  const isBetter = difference > 0;

  // Mock saving tip logic
  const showSavingTip = extraMonthly > 0 && extraMonthly <= 500;

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-muted-foreground">Extra månadssparande</Label>
            <span className="font-medium text-primary">+{extraMonthly} kr</span>
          </div>
          <Slider
            value={[extraMonthly]}
            min={0}
            max={5000}
            step={100}
            onValueChange={(vals) => setExtraMonthly(vals[0])}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-muted-foreground">Årlig avkastning</Label>
            <span className="font-medium text-primary">{annualReturn}%</span>
          </div>
          <Slider
            value={[annualReturn]}
            min={1}
            max={15}
            step={0.5}
            onValueChange={(vals) => setAnnualReturn(vals[0])}
            className="py-2"
          />
        </div>
      </div>

      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Prognos (original):</span>
            <span>{Math.round(originalProjected).toLocaleString()} kr</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-lg">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Ny prognos:
            </span>
            <span className={isBetter ? 'text-green-600 dark:text-green-400' : ''}>
              {Math.round(projectedAmount).toLocaleString()} kr
            </span>
          </div>
          {isBetter && (
            <div className="pt-2 border-t border-dashed border-border/50 text-xs text-muted-foreground text-center">
              Du kan nå målet <span className="text-foreground font-medium">snabbare</span> eller få <span className="text-green-600 font-medium">+{Math.round(difference).toLocaleString()} kr</span> extra!
            </div>
          )}
        </CardContent>
      </Card>

      {showSavingTip && (
        <SmartSavingTip
          type="fee"
          potentialSaving={200}
          message="Om du byter din dyraste fond mot en indexfond kan du spara ca 200 kr/mån i avgifter. Detta täcker nästan halva din ökning!"
          actionLabel="Analysera avgifter"
          actionUrl="/portfolio-implementation"
        />
      )}
    </div>
  );
};

