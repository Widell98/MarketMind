import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, Search } from 'lucide-react';

export interface StockSearchOption {
  symbol: string;
  name?: string | null;
  currency?: string | null;
  price?: number | null;
  sector?: string | null;
  market?: string | null;
  source?: string | null;
}

export interface StockSelectionResult {
  symbol: string;
  name: string;
  currency?: string | null;
  price?: number | null;
  sector?: string | null;
  market?: string | null;
  source?: string | null;
}

interface StockReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStock?: { name?: string; symbol?: string | null } | null;
  suggestions?: StockSearchOption[];
  onConfirm: (selection: StockSelectionResult) => void;
}

const MAX_SUGGESTIONS = 40;

const StockReplacementDialog: React.FC<StockReplacementDialogProps> = ({
  open,
  onOpenChange,
  currentStock,
  suggestions = [],
  onConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualName, setManualName] = useState('');
  const [selectedOption, setSelectedOption] = useState<StockSelectionResult | null>(null);

  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedOption(null);
      setManualSymbol(currentStock?.symbol ?? '');
      setManualName(currentStock?.name ?? '');
    }
  }, [open, currentStock?.name, currentStock?.symbol]);

  const filteredSuggestions = useMemo(() => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return [];
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return suggestions.slice(0, MAX_SUGGESTIONS);
    }

    return suggestions
      .filter(option => {
        const symbolMatch = option.symbol?.toLowerCase().includes(term);
        const nameMatch = option.name?.toLowerCase().includes(term);
        return symbolMatch || nameMatch;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [searchTerm, suggestions]);

  const handleSelectOption = (option: StockSearchOption) => {
    const normalized: StockSelectionResult = {
      symbol: option.symbol.toUpperCase(),
      name: option.name?.trim() || option.symbol.toUpperCase(),
      currency: option.currency ?? null,
      price: option.price ?? null,
      sector: option.sector ?? null,
      market: option.market ?? null,
      source: option.source ?? null,
    };
    setSelectedOption(normalized);
    setManualSymbol(normalized.symbol);
    setManualName(normalized.name);
  };

  const canConfirm = Boolean(
    selectedOption || (manualSymbol.trim().length > 0 && (manualName.trim().length > 0 || manualSymbol.trim().length > 0))
  );

  const handleConfirm = () => {
    if (!canConfirm) {
      return;
    }

    const selection = selectedOption ?? {
      symbol: manualSymbol.trim().toUpperCase(),
      name: manualName.trim() || manualSymbol.trim().toUpperCase(),
    };

    onConfirm(selection);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Byt ut rekommenderad aktie</DialogTitle>
          <DialogDescription>
            Sök efter en ny aktie eller ange symbolen manuellt för att ersätta{' '}
            {currentStock?.name || currentStock?.symbol || 'innehavet'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sök i aktielistan
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Sök efter symbol eller bolagsnamn"
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="max-h-56 rounded-lg border">
            <div className="divide-y">
              {filteredSuggestions.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Inga träffar. Justera sökningen eller ange symbolen manuellt nedan.
                </p>
              ) : (
                filteredSuggestions.map(option => {
                  const isActive = selectedOption?.symbol === option.symbol.toUpperCase();

                  return (
                    <button
                      key={option.symbol}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-muted ${
                        isActive ? 'bg-muted/70' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {option.name || option.symbol}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{option.symbol}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof option.price === 'number' && Number.isFinite(option.price) && option.price > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            Pris: {option.price.toFixed(2)} {option.currency || ''}
                          </Badge>
                        )}
                        {option.sector && (
                          <Badge variant="outline" className="text-[10px]">
                            {option.sector}
                          </Badge>
                        )}
                        {isActive && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ange aktie manuellt
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={manualSymbol}
                onChange={event => {
                  setManualSymbol(event.target.value.toUpperCase());
                  setSelectedOption(null);
                }}
                placeholder="Symbol (t.ex. AAPL)"
              />
              <Input
                value={manualName}
                onChange={event => {
                  setManualName(event.target.value);
                  setSelectedOption(null);
                }}
                placeholder="Bolagsnamn"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Om aktien saknas i listan kan du ange symbol och namn manuellt.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Ersätt aktie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockReplacementDialog;
