import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { GoalCategory, InvestmentGoal } from '@/hooks/useInvestmentGoals';
import { DialogFooter } from '@/components/ui/dialog';

interface AddGoalFormProps {
  onSave: (goal: Omit<InvestmentGoal, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
  initialData?: InvestmentGoal;
  portfolioValue?: number;
}

export const AddGoalForm = ({ onSave, onCancel, initialData, portfolioValue = 0 }: AddGoalFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialData?.target_amount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(initialData?.current_amount?.toString() || '0');
  const [targetDate, setTargetDate] = useState(initialData?.target_date || '');
  const [category, setCategory] = useState<GoalCategory>(initialData?.category || 'savings');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(initialData?.priority || 'medium');
  const [linkedToPortfolio, setLinkedToPortfolio] = useState(initialData?.linked_to_portfolio || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave({
        name,
        target_amount: Number(targetAmount),
        current_amount: linkedToPortfolio ? 0 : Number(currentAmount), // If linked, current amount is dynamic
        target_date: targetDate,
        category,
        priority,
        linked_to_portfolio: linkedToPortfolio
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Målnamn</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="T.ex. Pension, Sommarstuga" 
          required 
        />
      </div>
      
      <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="linkedToPortfolio" 
            checked={linkedToPortfolio}
            onCheckedChange={(checked) => setLinkedToPortfolio(checked as boolean)}
          />
          <Label htmlFor="linkedToPortfolio" className="font-medium cursor-pointer">
            Koppla till min portfölj
          </Label>
        </div>
        <p className="text-xs text-muted-foreground ml-6">
          Om ikryssad kommer målets framsteg automatiskt följa värdet på din aktiva portfölj.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetAmount">Målbelopp (kr)</Label>
          <Input 
            id="targetAmount" 
            type="number" 
            value={targetAmount} 
            onChange={(e) => setTargetAmount(e.target.value)} 
            placeholder="1000000" 
            required 
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentAmount" className={linkedToPortfolio ? 'text-muted-foreground' : ''}>
            Nuvarande sparande (kr)
          </Label>
          <Input 
            id="currentAmount" 
            type="number" 
            value={linkedToPortfolio ? portfolioValue : currentAmount} 
            onChange={(e) => setCurrentAmount(e.target.value)} 
            placeholder={linkedToPortfolio ? "Hämtas från portfölj" : "0"} 
            required={!linkedToPortfolio}
            disabled={linkedToPortfolio}
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetDate">Måldatum</Label>
        <Input 
          id="targetDate" 
          type="date" 
          value={targetDate} 
          onChange={(e) => setTargetDate(e.target.value)} 
          required 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as GoalCategory)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Välj kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retirement">Pension</SelectItem>
              <SelectItem value="savings">Sparande</SelectItem>
              <SelectItem value="house">Boende</SelectItem>
              <SelectItem value="car">Bil</SelectItem>
              <SelectItem value="travel">Resa</SelectItem>
              <SelectItem value="other">Annat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="priority">Prioritet</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Välj prioritet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Hög</SelectItem>
              <SelectItem value="medium">Medel</SelectItem>
              <SelectItem value="low">Låg</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Avbryt
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sparar...' : 'Spara mål'}
        </Button>
      </DialogFooter>
    </form>
  );
};
