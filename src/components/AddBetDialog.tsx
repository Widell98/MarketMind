import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';
import type { PolymarketMarketDetail } from '@/types/polymarket';
import { usePredictionMarketBets, AddBetData } from '@/hooks/usePredictionMarketBets';

interface AddBetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  market: PolymarketMarketDetail | null;
  onSuccess?: () => void;
}

const AddBetDialog: React.FC<AddBetDialogProps> = ({
  isOpen,
  onClose,
  market,
  onSuccess
}) => {
  const { addBet, calculatePotentialPayout } = usePredictionMarketBets();
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or market changes
  useEffect(() => {
    if (isOpen && market) {
      // Set default outcome to first available (usually Yes)
      const defaultOutcome = market.outcomes?.[0]?.title || '';
      setSelectedOutcome(defaultOutcome);
      setBetAmount('');
      setNotes('');
    }
  }, [isOpen, market]);

  // Get selected outcome data
  const selectedOutcomeData = useMemo(() => {
    if (!market || !selectedOutcome) return null;
    return market.outcomes?.find(o => o.title.toLowerCase() === selectedOutcome.toLowerCase());
  }, [market, selectedOutcome]);

  // Calculate potential payout
  const potentialPayout = useMemo(() => {
    if (!selectedOutcomeData || !betAmount) return 0;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return 0;
    
    return calculatePotentialPayout(amount, selectedOutcomeData.price || 0, selectedOutcome);
  }, [selectedOutcomeData, betAmount, selectedOutcome, calculatePotentialPayout]);

  const potentialProfit = potentialPayout - (parseFloat(betAmount) || 0);
  const profitPercentage = betAmount && parseFloat(betAmount) > 0 
    ? ((potentialProfit / parseFloat(betAmount)) * 100).toFixed(1)
    : '0';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatOdds = (odds: number) => {
    return `${Math.round(odds * 100)}%`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!market || !selectedOutcomeData || !betAmount) {
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const betData: AddBetData = {
        prediction_market_id: market.id,
        market_question: market.question,
        bet_outcome: selectedOutcome,
        bet_odds: selectedOutcomeData.price || 0,
        bet_amount: amount,
        market_end_date: market.endDate || null,
        notes: notes.trim() || null,
      };

      const result = await addBet(betData);
      
      if (result) {
        setBetAmount('');
        setNotes('');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (error) {
      console.error('Error adding bet:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!market) {
    return null;
  }

  const availableOutcomes = market.outcomes || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lägg till bet</DialogTitle>
          <DialogDescription>
            Spara ditt bet på denna marknad till din portfölj
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Market Question (Read-only) */}
            <div>
              <Label>Marknad</Label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                {market.question}
              </div>
            </div>

            {/* Outcome Selection */}
            <div>
              <Label htmlFor="outcome">Outcome *</Label>
              <Select
                value={selectedOutcome}
                onValueChange={setSelectedOutcome}
                required
              >
                <SelectTrigger id="outcome" className="mt-1">
                  <SelectValue placeholder="Välj outcome" />
                </SelectTrigger>
                <SelectContent>
                  {availableOutcomes.map((outcome) => (
                    <SelectItem key={outcome.id} value={outcome.title}>
                      <div className="flex items-center justify-between w-full">
                        <span>{outcome.title}</span>
                        <Badge variant="outline" className="ml-2">
                          {formatOdds(outcome.price || 0)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOutcomeData && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nuvarande odds: {formatOdds(selectedOutcomeData.price || 0)}
                </p>
              )}
            </div>

            {/* Bet Amount */}
            <div>
              <Label htmlFor="bet-amount">Insatsbelopp (SEK) *</Label>
              <Input
                id="bet-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.00"
                required
                className="mt-1"
              />
            </div>

            {/* Potential Payout (Calculated) */}
            {betAmount && parseFloat(betAmount) > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Potentiell utbetalning</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(potentialPayout)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Potentiell vinst</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(potentialProfit)} (+{profitPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Anteckningar (valfritt)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Varför satsar du på detta outcome? Dina tankar..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedOutcome || !betAmount || parseFloat(betAmount) <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                'Lägg till bet'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBetDialog;


