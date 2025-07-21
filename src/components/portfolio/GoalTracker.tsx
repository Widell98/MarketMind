
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Calendar, TrendingUp, Plus, Edit2, Trash2 } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'retirement' | 'house' | 'travel' | 'emergency' | 'other';
  priority: 'high' | 'medium' | 'low';
}

interface GoalTrackerProps {
  currentPortfolioValue: number;
  monthlyContribution: number;
}

const GoalTracker: React.FC<GoalTrackerProps> = ({
  currentPortfolioValue,
  monthlyContribution
}) => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      name: 'Pension',
      targetAmount: 10000000,
      currentAmount: currentPortfolioValue * 0.6,
      targetDate: '2055-01-01',
      category: 'retirement',
      priority: 'high'
    },
    {
      id: '2',
      name: 'Köp hus',
      targetAmount: 2000000,
      currentAmount: currentPortfolioValue * 0.3,
      targetDate: '2027-01-01',
      category: 'house',
      priority: 'high'
    },
    {
      id: '3',
      name: 'Nödfond',
      targetAmount: 500000,
      currentAmount: currentPortfolioValue * 0.1,
      targetDate: '2025-01-01',
      category: 'emergency',
      priority: 'medium'
    }
  ]);

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const calculateTimeToGoal = (goal: Goal) => {
    const monthsLeft = Math.ceil(
      (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const monthsNeeded = Math.ceil(remainingAmount / monthlyContribution);
    
    return {
      monthsLeft,
      monthsNeeded,
      onTrack: monthsNeeded <= monthsLeft
    };
  };

  const getCategoryColor = (category: Goal['category']) => {
    const colors = {
      retirement: 'bg-purple-500',
      house: 'bg-blue-500',
      travel: 'bg-green-500',
      emergency: 'bg-red-500',
      other: 'bg-gray-500'
    };
    return colors[category];
  };

  const getCategoryIcon = (category: Goal['category']) => {
    // For simplicity, using the same icon - in a real app you'd have different icons
    return Target;
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    const colors = {
      high: 'text-red-600 bg-red-50 border-red-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[priority];
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="w-5 h-5 text-primary" />
            Mål Tracker
          </CardTitle>
          <Button
            onClick={() => setIsAddingGoal(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nytt mål
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal);
            const timeAnalysis = calculateTimeToGoal(goal);
            const CategoryIcon = getCategoryIcon(goal.category);
            
            return (
              <div key={goal.id} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getCategoryColor(goal.category)} flex items-center justify-center`}>
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{goal.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {goal.currentAmount.toLocaleString('sv-SE')} / {goal.targetAmount.toLocaleString('sv-SE')} SEK
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingGoal(goal)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Framsteg</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Måldatum: {new Date(goal.targetDate).toLocaleDateString('sv-SE')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className={timeAnalysis.onTrack ? 'text-green-600' : 'text-red-600'}>
                      {timeAnalysis.onTrack ? 'På rätt spår' : 'Behöver justering'}
                    </span>
                  </div>
                </div>
                
                {!timeAnalysis.onTrack && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      Du behöver spara {Math.ceil((goal.targetAmount - goal.currentAmount) / timeAnalysis.monthsLeft).toLocaleString('sv-SE')} SEK/månad 
                      för att nå målet i tid.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Sammanfattning</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Totalt målvärde:</span>
              <div className="font-semibold text-blue-900">
                {goals.reduce((sum, goal) => sum + goal.targetAmount, 0).toLocaleString('sv-SE')} SEK
              </div>
            </div>
            <div>
              <span className="text-blue-700">Aktuellt värde:</span>
              <div className="font-semibold text-blue-900">
                {goals.reduce((sum, goal) => sum + goal.currentAmount, 0).toLocaleString('sv-SE')} SEK
              </div>
            </div>
            <div>
              <span className="text-blue-700">Genomsnittligt framsteg:</span>
              <div className="font-semibold text-blue-900">
                {(goals.reduce((sum, goal) => sum + calculateProgress(goal), 0) / goals.length).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">Rekommendationer</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Prioritera mål med hög prioritet och kort tidshorisont</li>
            <li>• Överväg att öka ditt månatliga sparande för att nå målen snabbare</li>
            <li>• Granska och uppdatera dina mål regelbundet</li>
            <li>• Diversifiera dina investeringar baserat på tidshorisont</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalTracker;
