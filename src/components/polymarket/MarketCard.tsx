import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PolymarketMarket } from '@/types/polymarket';
import { AlertTriangle, CalendarClock, Coins, Flame, Info, MessageSquare, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketCardProps {
  market: PolymarketMarket;
  onDiscuss?: (market: PolymarketMarket) => void;
  onSave?: (market: PolymarketMarket) => void;
  isSaved?: boolean;
  disabledReason?: string;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market, onDiscuss, onSave, isSaved, disabledReason }) => {
  const topOutcomes = market.outcomes.slice(0, 3);
  const closingDate = market.closeTime ? new Date(market.closeTime) : null;
  const interactionsDisabled = Boolean(disabledReason);

  return (
    <Card className="flex flex-col gap-4 border-border/70 bg-card/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {market.categories.slice(0, 3).map((category) => (
              <Badge key={category} variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-xs font-medium text-primary">
                {category}
              </Badge>
            ))}
          </div>
          <h3 className="text-lg font-semibold leading-snug text-foreground">{market.question}</h3>
          {market.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{market.description}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 text-right text-sm text-muted-foreground">
          {closingDate && (
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium">
              <CalendarClock className="h-4 w-4 text-primary" />
              Stänger {closingDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <Coins className="h-4 w-4 text-amber-500" />
              Likviditet {Math.round(market.liquidity).toLocaleString('sv-SE')} $
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Flame className="h-4 w-4 text-rose-500" />
              Volym 24h {Math.round(market.volume24h).toLocaleString('sv-SE')} $
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {topOutcomes.map((outcome) => (
          <div
            key={outcome.id}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{outcome.name}</p>
              <p className="text-xs text-muted-foreground">Sannolikhet {Math.round(outcome.probability * 100)}%</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 text-xs font-semibold">
              {outcome.price.toFixed(2)}
            </Badge>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="gap-2 rounded-full"
                onClick={() => onDiscuss?.(market)}
                disabled={interactionsDisabled}
              >
                <MessageSquare className="h-4 w-4" />
                Diskutera i chatten
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {interactionsDisabled ? disabledReason : 'Öppna AI-chatten med marknadsdetaljer'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          size="sm"
          variant={isSaved ? 'secondary' : 'outline'}
          className={cn('gap-2 rounded-full', isSaved ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400' : '')}
          onClick={() => onSave?.(market)}
          disabled={interactionsDisabled}
        >
          <Save className="h-4 w-4" />
          {isSaved ? 'Sparad i portfölj' : 'Spara till portfölj'}
        </Button>

        {market.url && (
          <Button size="sm" variant="ghost" className="rounded-full" asChild>
            <a href={market.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">
              Visa på Polymarket
            </a>
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="gap-2 rounded-full text-muted-foreground">
                <Info className="h-4 w-4" />
                Läs villkor
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              Marknadsdata är endast för analys; MarketMind placerar inte bets. Kontrollera lokala regler och notera att odds kan förändras.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {disabledReason && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          {disabledReason}
        </div>
      )}
    </Card>
  );
};

export const MarketCardSkeleton: React.FC = () => {
  return (
    <Card className="flex flex-col gap-4 border-border/70 bg-card/60 p-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <div key={key} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
    </Card>
  );
};

export default MarketCard;
