import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageSquare, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MinimalPortfolioHeroProps {
  portfolioValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dayChangePercent?: number;
  dayChangeValue?: number;
  isPositiveDayChange?: boolean;
  loading?: boolean;
}

const MinimalPortfolioHero: React.FC<MinimalPortfolioHeroProps> = ({
  portfolioValue,
  totalReturn,
  totalReturnPercentage,
  dayChangePercent = 0,
  dayChangeValue = 0,
  isPositiveDayChange = true,
  loading = false,
}) => {
  const portfolioValueFormatted = portfolioValue.toLocaleString('sv-SE', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
  const totalReturnFormatted = totalReturn.toLocaleString('sv-SE', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });

  const dayChangePercentFormatted = dayChangePercent !== 0
    ? (isPositiveDayChange 
      ? `+${dayChangePercent.toFixed(2)}%` 
      : `${dayChangePercent.toFixed(2)}%`)
    : '0.00%';

  const dayChangeValueFormatted = dayChangeValue !== 0
    ? (dayChangeValue >= 0 
      ? `+${dayChangeValue.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`
      : `${dayChangeValue.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`)
    : '0,00 kr';

  return (
    <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 to-card/70 p-6 shadow-lg sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* Main Portfolio Info */}
        <div className="flex-1 space-y-4">
          {/* Portfolio Value */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Portföljvärde</p>
            {loading ? (
              <div className="h-16 w-64 bg-muted rounded-lg animate-pulse" />
            ) : (
              <h1 className="text-5xl font-bold text-foreground sm:text-6xl lg:text-7xl">
                {portfolioValueFormatted} kr
              </h1>
            )}
          </div>

          {/* Today's Development - Prominent */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Utveckling idag</p>
            {loading ? (
              <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-3">
                <span className={cn(
                  'text-3xl font-semibold sm:text-4xl',
                  isPositiveDayChange 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {dayChangePercentFormatted}
                </span>
                <span className={cn(
                  'text-xl font-medium sm:text-2xl',
                  isPositiveDayChange 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {dayChangeValueFormatted}
                </span>
              </div>
            )}
          </div>

          {/* Total Return - Secondary */}
          {!loading && totalReturn !== 0 && (
            <div>
              <p className={cn(
                'text-sm',
                totalReturn >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-600 dark:text-red-400'
              )}>
                Total avkastning: {totalReturn >= 0 ? '+' : ''}{totalReturnFormatted} kr ({totalReturnPercentage >= 0 ? '+' : ''}{totalReturnPercentage.toFixed(2)}%)
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-2 sm:flex-shrink-0">
          <Button asChild variant="outline" size="sm" className="w-full justify-center hover:bg-muted/50 sm:w-auto">
            <Link to="/ai-chatt">
              <MessageSquare className="mr-2 h-4 w-4" />
              AI Chat
            </Link>
          </Button>
          <Button asChild size="sm" className="w-full justify-center bg-primary hover:bg-primary/90 sm:w-auto">
            <Link to="/portfolio-implementation">
              <BarChart3 className="mr-2 h-4 w-4" />
              Min Portfölj
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MinimalPortfolioHero;

