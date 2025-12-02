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
  const isNegativeVariant = iconColorClass?.includes('red');
  const cardBackground = isNegativeVariant
    ? 'bg-gradient-to-br from-white/95 via-white to-red-50/30 dark:from-slate-950/80 dark:via-slate-950/90 dark:to-red-950/10'
    : 'bg-gradient-to-br from-white/95 via-white to-emerald-50/30 dark:from-slate-950/80 dark:via-slate-950/90 dark:to-emerald-950/10';
  const accentHalo = isNegativeVariant
    ? 'bg-red-100/40 dark:bg-red-900/20'
    : 'bg-emerald-100/40 dark:bg-emerald-900/20';
  const accentSurface = isNegativeVariant
    ? 'bg-red-50 text-red-700 ring-red-100/80 dark:bg-red-900/30 dark:text-red-200'
    : 'bg-emerald-50 text-emerald-700 ring-emerald-100/80 dark:bg-emerald-900/30 dark:text-emerald-200';
  const accentLabel = isNegativeVariant ? 'text-red-600 dark:text-red-200' : 'text-emerald-600 dark:text-emerald-200';

  return (
    <Card className={`relative overflow-hidden rounded-3xl border border-border/60 p-4 shadow-sm backdrop-blur sm:p-5 ${cardBackground}`}>
      <div className={`absolute right-6 top-6 h-24 w-24 rounded-full blur-3xl ${accentHalo}`} aria-hidden />
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ring-1 ${accentSurface} ${iconColorClass}`}>
          {icon}
        </div>
        <div>
          <p className={`text-xs font-medium uppercase tracking-wide ${accentLabel}`}>Översikt</p>
          <h3 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{title}</h3>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="divide-y divide-border/60">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground sm:text-base">{item.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {item.symbol && (
                    <span className="rounded-full bg-muted/60 px-2 py-0.5 font-semibold uppercase tracking-wide text-[11px] text-muted-foreground">
                      {item.symbol}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold sm:text-base ${
                    item.isPositive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-red-50 text-red-700 ring-1 ring-red-100'
                  }`}
                >
                  {item.percentLabel}
                </div>
                {item.valueLabel && (
                  <div className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">{item.valueLabel}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default HoldingsHighlightCard;
