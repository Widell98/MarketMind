import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useInvestmentGoals, InvestmentGoal } from '@/hooks/useInvestmentGoals';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalForm } from '@/components/goals/AddGoalForm';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Target, BarChart3, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GoalsProps {
  embedded?: boolean;
}

const Goals = ({ embedded = false }: GoalsProps) => {
  const { goals, loading, addGoal, updateGoal, deleteGoal, portfolioValue } = useInvestmentGoals();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<InvestmentGoal | null>(null);

  const handleAIAnalysis = () => {
    // Navigate to chat with a pre-filled prompt about the goals
    const goalsSummary = goals.map(g => `${g.name}: ${g.current_amount}/${g.target_amount} kr till ${g.target_date}`).join(', ');
    const prompt = `Analysera mina investeringsmål: ${goalsSummary || 'Jag har inga mål än'}. Är de realistiska? Hur bör jag allokera min portfölj för att nå dem?`;
    
    navigate('/ai-chatt', { state: { initialMessage: prompt } });
  };

  const handleSaveGoal = async (goalData: Omit<InvestmentGoal, 'id' | 'created_at'>) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
    } else {
      await addGoal(goalData);
    }
    setIsDialogOpen(false);
    setEditingGoal(null);
  };

  const openEditDialog = (goal: InvestmentGoal) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingGoal(null);
  };

  const content = (
    <div className={`space-y-8 max-w-7xl ${embedded ? 'pt-4' : 'container mx-auto px-4 py-8'}`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
        <div className="space-y-2">
          {!embedded && <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Investeringsmål</h1>}
          <p className="text-lg text-muted-foreground max-w-2xl">
            Sätt upp tydliga mål för ditt sparande, spåra dina framsteg och låt AI hjälpa dig att nå dem snabbare.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={handleAIAnalysis} className="gap-2 flex-1 md:flex-none">
            <Sparkles className="w-4 h-4 text-primary" />
            AI-analys
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="gap-2 flex-1 md:flex-none bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Nytt mål
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Redigera mål' : 'Lägg till nytt mål'}</DialogTitle>
              </DialogHeader>
              <AddGoalForm 
                onSave={handleSaveGoal} 
                onCancel={() => setIsDialogOpen(false)}
                initialData={editingGoal || undefined}
                portfolioValue={portfolioValue}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard/Summary Section could go here */}
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/25">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Inga mål än</h3>
          <p className="text-muted-foreground mb-8 max-w-md">
            Börja med att sätta upp ditt första sparmål. Det kan vara allt från en buffert till pension eller en drömresa.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            Skapa ditt första mål
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onEdit={openEditDialog} 
              onDelete={deleteGoal} 
            />
          ))}
          
          {/* Add New Card (Empty State-ish) */}
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 border-2 border-dashed border-muted-foreground/20 rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all group"
          >
            <div className="bg-muted p-3 rounded-full mb-3 group-hover:bg-primary/10 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-foreground">Lägg till nytt mål</span>
          </button>
        </div>
      )}

      {/* CTA Section */}
      {goals.length > 0 && !embedded && (
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mt-1">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Koppla till din portfölj</h3>
              <p className="text-blue-700 dark:text-blue-300 max-w-xl mt-1">
                För att nå dina mål snabbare rekommenderar vi att du ser över din portföljallokering baserat på tidshorisonten för varje mål.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/portfolio-implementation')} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            Gå till portföljen <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return <Layout>{content}</Layout>;
};

export default Goals;

