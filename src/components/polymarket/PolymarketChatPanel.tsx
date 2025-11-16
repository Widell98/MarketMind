import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PolymarketMarket } from '@/types/polymarket';
import { AlertTriangle, CalendarClock, Coins, Flame, Link as LinkIcon, X } from 'lucide-react';

interface PolymarketChatPanelProps {
  market: PolymarketMarket;
  onClear?: () => void;
}

const PolymarketChatPanel: React.FC<PolymarketChatPanelProps> = ({ market, onClear }) => {
  const closingDate = market.closeTime ? new Date(market.closeTime) : null;

  return (
    <aside className="hidden h-full flex-col gap-4 border-l border-ai-border/60 bg-ai-surface-muted/40 p-4 lg:flex">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-primary/80">Polymarket</p>
          <h3 className="text-base font-semibold leading-tight text-foreground">{market.question}</h3>
          {market.description && (
            <p className="text-xs text-ai-text-muted line-clamp-3">{market.description}</p>
          )}
        </div>
        {onClear && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Card className="space-y-3 border-ai-border/70 bg-ai-surface">
        <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
          {market.categories.slice(0, 3).map((category) => (
            <Badge key={category} variant="outline" className="border-primary/20 bg-primary/5 text-xs font-medium text-primary">
              {category}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 px-3 text-[13px] text-ai-text-muted">
          {closingDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-4 w-4 text-primary" />
              Stänger {closingDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Coins className="h-4 w-4 text-amber-500" />
            Likviditet {Math.round(market.liquidity).toLocaleString('sv-SE')} $
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-4 w-4 text-rose-500" />
            Volym 24h {Math.round(market.volume24h).toLocaleString('sv-SE')} $
          </span>
        </div>

        <div className="space-y-2 px-3 pb-3">
          <p className="text-xs font-semibold uppercase text-ai-text-muted">Ledande utfall</p>
          {market.outcomes.slice(0, 3).map((outcome) => (
            <div
              key={outcome.id}
              className="flex items-center justify-between rounded-lg border border-ai-border/50 bg-ai-surface-muted/30 px-3 py-2"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{outcome.name}</p>
                <p className="text-xs text-ai-text-muted">Sannolikhet {Math.round(outcome.probability * 100)}%</p>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 text-xs font-semibold">
                {outcome.price.toFixed(2)}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 border-ai-border/70 bg-amber-500/10 px-3 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-semibold">Endast analys</span>
        </div>
        <ul className="space-y-1 text-[13px] leading-relaxed">
          <li>• Ingen orderläggning eller riktiga bets utförs via chatten.</li>
          <li>• Ge endast research och risk-/reward-analys baserat på marknadsdatan.</li>
          <li>• Notera användarens val så att de kan sparas i portföljen.</li>
        </ul>
        {market.url && (
          <Button variant="link" asChild className="h-auto px-0 text-primary">
            <a href={market.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold">
              <LinkIcon className="h-4 w-4" />
              Visa på Polymarket
            </a>
          </Button>
        )}
      </Card>
    </aside>
  );
};

export default PolymarketChatPanel;
