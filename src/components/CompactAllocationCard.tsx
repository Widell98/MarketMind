import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CompactAllocationCardProps {
  investedPercentage: number;
  cashPercentage: number;
}

const CompactAllocationCard: React.FC<CompactAllocationCardProps> = ({ investedPercentage, cashPercentage }) => {
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card className="rounded-2xl border border-border/60 bg-white/90 p-3 shadow-sm dark:bg-slate-950/60 sm:p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
          <span className="text-[10px] font-semibold">%</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">Allokering</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Investerat</span>
          <span className="font-semibold text-foreground">{formatPercent(investedPercentage)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-slate-900 dark:bg-slate-100 transition-all duration-300"
            style={{ width: `${Math.min(Math.max(investedPercentage, 0), 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Kontant</span>
          <span className="font-semibold text-foreground">{formatPercent(cashPercentage)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-slate-400 dark:bg-slate-500 transition-all duration-300"
            style={{ width: `${Math.min(Math.max(cashPercentage, 0), 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
};

export default CompactAllocationCard;







