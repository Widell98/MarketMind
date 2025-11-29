import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { InvestmentGoal } from '@/hooks/useInvestmentGoals';
import { Target, Calendar, TrendingUp, Pencil, Trash2, Calculator, Link } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScenarioSimulator } from './ScenarioSimulator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Milestones } from './Milestones';

interface GoalCardProps {
  goal: InvestmentGoal;
  onEdit: (goal: InvestmentGoal) => void;
  onDelete: (id: string) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const current = goal.current_amount || 0;
  const target = goal.target_amount || 1; // Avoid division by zero
  const progress = Math.min((current / target) * 100, 100);
  
  // Handle invalid dates gracefully
  let timeLeft = '';
  try {
    timeLeft = formatDistanceToNow(new Date(goal.target_date), { locale: sv, addSuffix: true });
  } catch (e) {
    timeLeft = 'Okänt datum';
  }
  
  return (
    <Card className={`hover:shadow-lg transition-shadow border-l-4 h-full flex flex-col ${goal.linked_to_portfolio ? 'border-l-blue-500 bg-blue-50/20 dark:bg-blue-900/10' : 'border-l-primary'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2 truncate pr-2">
          {goal.linked_to_portfolio ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Link className="w-5 h-5 text-blue-500 shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Kopplad till portföljvärde</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Target className="w-5 h-5 text-primary shrink-0" />
          )}
          <span className="truncate">{goal.name}</span>
        </CardTitle>
        <div className="flex gap-1 shrink-0">
          <Dialog open={isSimulating} onOpenChange={setIsSimulating}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <Calculator className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Simulator: {goal.name}</DialogTitle>
              </DialogHeader>
              <ScenarioSimulator goal={goal} />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={() => onEdit(goal)} className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(goal.id)} className="h-8 w-8 text-destructive hover:text-destructive/90">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>{goal.current_amount?.toLocaleString('sv-SE') || '0'} kr</span>
            <span className="text-muted-foreground">av {goal.target_amount?.toLocaleString('sv-SE') || '0'} kr</span>
          </div>
          <Progress value={progress} className={`h-2 ${goal.linked_to_portfolio ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`} indicatorClassName={goal.linked_to_portfolio ? 'bg-blue-500' : ''} />
          
          <Milestones progress={progress} />
          
          <p className="text-xs text-right text-muted-foreground pt-4">{Math.round(progress)}% klart</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t mt-auto">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Mål: {timeLeft}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium capitalize">{goal.priority} prio</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
