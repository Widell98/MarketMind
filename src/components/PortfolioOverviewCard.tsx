import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageSquare, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SummaryCard = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
  helperClassName: string;
};

interface PortfolioOverviewCardProps {
  portfolioValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  summaryCards: SummaryCard[];
  loading?: boolean;
  dayChangePercent?: number;
  dayChangeValue?: number;
  isPositiveDayChange?: boolean;
}

const PortfolioOverviewCard: React.FC<PortfolioOverviewCardProps> = ({
  portfolioValue,
  totalReturn,
  totalReturnPercentage,
  summaryCards,
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

  return (
    <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 to-card/70 p-4 shadow-lg sm:p-6">
      {/* Portfolio Value Hero Section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">Portföljvärde</p>
            {loading ? (
              <div className="h-12 w-48 bg-muted rounded-lg animate-pulse mb-2" />
            ) : (
              <h1 className="text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
                {portfolioValueFormatted} kr
              </h1>
            )}
            {loading ? (
              <div className="h-4 w-64 bg-muted rounded-md animate-pulse mt-2" />
            ) : (
              totalReturn !== 0 && (
                <p className={cn(
                  'mt-2 text-sm',
                  totalReturn >= 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                )}>
                  Total avkastning: {totalReturn >= 0 ? '+' : ''}{totalReturnFormatted} kr ({totalReturnPercentage >= 0 ? '+' : ''}{totalReturnPercentage.toFixed(2)}%)
                </p>
              )
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
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

      {/* Overview Cards Grid - Compact Design */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {summaryCards.map(({ icon: Icon, label, value, helper, helperClassName }) => (
          <Card
            key={label}
            className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] sm:p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate sm:text-sm">{label}</span>
            </div>
            {loading ? (
              <div className="h-6 w-3/4 bg-muted rounded-md animate-pulse mt-1" />
            ) : (
              <p className="text-xl font-semibold text-foreground sm:text-2xl">{value}</p>
            )}
            {loading ? (
              <div className="h-3 w-1/2 bg-muted rounded-md animate-pulse mt-1" />
            ) : (
              <p className={cn('mt-1 text-xs truncate', helperClassName)}>{helper}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PortfolioOverviewCard;
