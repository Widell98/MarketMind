
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import HoldingCard from './HoldingCard';
import SwipeableHoldingCard from './SwipeableHoldingCard';

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
  onDiscuss,
  onEdit,
  onDelete,
  onRefreshPrice,
  isUpdatingPrice,
  refreshingTicker
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Detect if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCollapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {holdings.length} innehav • {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-foreground">
              {groupPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              av portfölj
            </div>
          </div>
        </div>
        
        {/* Progress bar for group */}
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div 
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${Math.min(groupPercentage, 100)}%` }}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {holdings.map((holding) => {
              const computedValue = typeof holding.current_value === 'number'
                ? holding.current_value
                : 0;

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
        </CardContent>
      )}
    </Card>
  );
};

export default HoldingsGroupSection;
