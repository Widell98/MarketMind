import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AllocationCardProps {
  investedPercentage: number;
  cashPercentage: number;
}

const AllocationCard: React.FC<AllocationCardProps> = ({ investedPercentage, cashPercentage }) => {
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const ProgressBar = ({ value, colorClass }: { value: number; colorClass: string }) => (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className={cn('h-full rounded-full transition-all duration-300', colorClass)}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );

  return (
    <Card className="rounded-3xl border border-border/60 bg-white/90 p-4 shadow-sm dark:bg-slate-950/60 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
          <span className="text-sm font-semibold">%</span>
        </div>
        <h3 className="text-lg font-semibold leading-tight text-foreground">Allokering</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm font-semibold text-foreground">
            <span>Investerat</span>
            <span>{formatPercent(investedPercentage)}</span>
          </div>
          <ProgressBar value={investedPercentage} colorClass="bg-slate-900 dark:bg-slate-100" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm font-semibold text-foreground">
            <span>Kontant</span>
            <span>{formatPercent(cashPercentage)}</span>
          </div>
          <ProgressBar value={cashPercentage} colorClass="bg-slate-400 dark:bg-slate-500" />
        </div>
      </div>
    </Card>
  );
};

export default AllocationCard;
