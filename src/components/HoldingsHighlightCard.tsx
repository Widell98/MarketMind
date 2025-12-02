import React from 'react';
import { Card } from '@/components/ui/card';

type HoldingsHighlightItem = {
  id: string;
  name: string;
  symbol?: string | null;
  percentLabel: string;
  valueLabel?: string;
  isPositive?: boolean;
};

interface HoldingsHighlightCardProps {
  title: string;
  icon: React.ReactNode;
  iconColorClass: string;
  items: HoldingsHighlightItem[];
  emptyText?: string;
}

const HoldingsHighlightCard: React.FC<HoldingsHighlightCardProps> = ({
  title,
  icon,
  iconColorClass,
  items,
  emptyText = 'Ingen data ännu',
}) => {
  return (
    <Card className="rounded-3xl border border-border/60 bg-white/90 p-3 shadow-sm dark:bg-slate-950/60 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 ${iconColorClass}`}>
          {icon}
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-sm">
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="divide-y divide-border/60">
          {items.map((item, index) => (
            <div key={item.id} className="py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {item.symbol && (
                      <span className="rounded-full bg-muted/60 px-2 py-0.5 font-semibold uppercase tracking-wide text-[11px] text-muted-foreground">
                        {item.symbol}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold sm:text-base ${item.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {item.percentLabel}
                  </div>
                  {item.valueLabel && (
                    <div className="mt-0.5 text-xs font-semibold text-muted-foreground">{item.valueLabel}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default HoldingsHighlightCard;
