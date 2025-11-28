
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import HoldingCard from './HoldingCard';
import SwipeableHoldingCard from './SwipeableHoldingCard';
import { formatCurrency, resolveHoldingValue } from '@/utils/currencyUtils';
import type { HoldingPerformance } from '@/hooks/usePortfolioPerformance';

interface Holding {
  id: string;
  name: string;
  symbol?: string;
  holding_type: string;
  current_value: number;
  quantity?: number;
  purchase_price?: number;
  sector?: string;
  currency: string;
  current_price_per_unit?: number;
  price_currency?: string;
}

interface HoldingsGroupSectionProps {
  title: string;
  holdings: Holding[];
  totalValue: number;
  groupPercentage: number;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  holdingPerformanceMap?: Record<string, HoldingPerformance>;
  onDiscuss: (name: string, symbol?: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onRefreshPrice?: (symbol: string) => void;
  isUpdatingPrice?: boolean;
  refreshingTicker?: string | null;
}

const HoldingsGroupSection: React.FC<HoldingsGroupSectionProps> = ({
  title,
  holdings,
  totalValue,
  groupPercentage,
  isCollapsible = true,
  defaultExpanded = true,
  holdingPerformanceMap,
  onDiscuss,
  onEdit,
  onDelete,
  onRefreshPrice,
  isUpdatingPrice,
  refreshingTicker
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  const totalPages = Math.max(1, Math.ceil(holdings.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentHoldings = holdings.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [holdings.length]);

  const handlePageChange = (direction: 'prev' | 'next') => {
    setCurrentPage((prev) => {
      if (direction === 'prev') {
        return Math.max(1, prev - 1);
      }
      return Math.min(totalPages, prev + 1);
    });
  };

  // Detect if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Card className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {isCollapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {holdings.length} innehav • {formatCurrency(totalValue, 'SEK')}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-base sm:text-lg font-bold text-foreground">
              {groupPercentage.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              av portfölj
            </div>
          </div>
        </div>
        
        {/* Progress bar for group */}
        <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 mt-2">
          <div 
            className="bg-primary rounded-full h-1.5 sm:h-2 transition-all duration-300"
            style={{ width: `${Math.min(groupPercentage, 100)}%` }}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {currentHoldings.map((holding) => {
              const { valueInSEK: computedValue } = resolveHoldingValue(holding);
              const holdingPerformance = holdingPerformanceMap?.[holding.id];

              const holdingPercentage = totalValue > 0
                ? (computedValue / totalValue) * groupPercentage
                : 0;

              // Use swipeable cards on mobile, regular cards on desktop
              if (isMobile) {
                return (
                  <SwipeableHoldingCard
                    key={holding.id}
                    holding={holding}
                    portfolioPercentage={holdingPercentage}
                    holdingPerformance={holdingPerformance}
                    onDiscuss={onDiscuss}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRefreshPrice={onRefreshPrice}
                    isUpdatingPrice={isUpdatingPrice}
                    refreshingTicker={refreshingTicker}
                    isMobile={true}
                  />
                );
              }

              return (
                <HoldingCard
                  key={holding.id}
                  holding={holding}
                  portfolioPercentage={holdingPercentage}
                  performance={holdingPerformance}
                  onDiscuss={onDiscuss}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRefreshPrice={onRefreshPrice}
                  isUpdatingPrice={isUpdatingPrice}
                  refreshingTicker={refreshingTicker}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visar {startIndex + 1}-{Math.min(endIndex, holdings.length)} av {holdings.length} innehav
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm"
                >
                  Föregående
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Sida {currentPage} av {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage === totalPages}
                  className="text-xs sm:text-sm"
                >
                  Nästa
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default HoldingsGroupSection;
