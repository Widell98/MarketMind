
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Edit2,
  Trash2,
  Wallet,
  Building2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import SmartHoldingSuggestions from './SmartHoldingSuggestions';
import { cn } from '@/lib/utils';
import { formatCurrency, resolveHoldingValue } from '@/utils/currencyUtils';
import type { HoldingPerformance } from '@/hooks/usePortfolioPerformance';

interface HoldingCardProps {
  holding: {
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
  };
  portfolioPercentage: number;
  performance?: HoldingPerformance;
  onDiscuss: (name: string, symbol?: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  showAISuggestions?: boolean;
  onRefreshPrice?: (symbol: string) => void;
  isUpdatingPrice?: boolean;
  refreshingTicker?: string | null;
}

const HoldingCard: React.FC<HoldingCardProps> = ({
  holding,
  portfolioPercentage,
  performance,
  onDiscuss,
  onEdit,
  onDelete,
  showAISuggestions = true,
  onRefreshPrice,
  isUpdatingPrice,
  refreshingTicker
}) => {
  const getHoldingIcon = () => {
    if (holding.holding_type === 'cash') return Wallet;
    if (holding.holding_type === 'stock') return Building2;
    return TrendingUp;
  };

  const Icon = getHoldingIcon();
  const isCash = holding.holding_type === 'cash';

  const {
    valueInSEK: displayValue,
    pricePerUnit: effectivePrice,
    priceCurrency: effectiveCurrency,
    pricePerUnitInSEK,
    quantity: normalizedQuantity,
  } = resolveHoldingValue(holding);

  const quantity = normalizedQuantity;
  const holdingPerformance = performance;
  const hasPerformanceData = Boolean(holdingPerformance);
  const investedValue = holdingPerformance?.investedValue ?? displayValue;
  const profit = holdingPerformance?.profit ?? 0;
  const profitPercentage = holdingPerformance?.profitPercentage ?? 0;
  const hasPurchasePrice = holdingPerformance?.hasPurchasePrice ?? (typeof holding.purchase_price === 'number' && holding.purchase_price > 0 && quantity > 0);
  const profitColor = profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-foreground';
  const profitPercentageColor = profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-muted-foreground';
  const trimmedSymbol = holding.symbol?.trim();
  const normalizedSymbol = trimmedSymbol ? trimmedSymbol.toUpperCase() : undefined;
  const isRefreshing = Boolean(
    isUpdatingPrice && refreshingTicker && normalizedSymbol && refreshingTicker === normalizedSymbol
  );

  const handleSuggestionAction = (suggestionId: string, action: string) => {
    // Handle suggestion actions here
    if (action === 'accept') {
      // Navigate to relevant action (buy more, sell, etc.)
      if (suggestionId.includes('_opportunity')) {
        onDiscuss(holding.name, holding.symbol);
      }
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">{holding.name}</h3>
                  {holding.symbol && (
                    onRefreshPrice && normalizedSymbol ? (
                      <button
                        type="button"
                        onClick={() => onRefreshPrice(normalizedSymbol)}
                        disabled={isUpdatingPrice}
                        className={cn(
                          badgeVariants({ variant: 'outline' }),
                          'text-xs font-mono inline-flex items-center gap-1 px-2 py-0.5 cursor-pointer transition-colors group hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        title="Uppdatera pris från Google Sheets"
                      >
                        {normalizedSymbol}
                        <RefreshCw
                          className={cn(
                            'w-3 h-3 text-muted-foreground transition-opacity duration-200',
                            isRefreshing ? 'opacity-100 animate-spin' : 'opacity-0 group-hover:opacity-100'
                          )}
                        />
                      </button>
                    ) : (
                      <Badge variant="outline" className="text-xs font-mono">
                        {holding.symbol}
                      </Badge>
                    )
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {holding.holding_type === 'cash' ? 'Kassa' : holding.holding_type}
                  </Badge>
                  {holding.sector && (
                    <span className="text-xs">{holding.sector}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Portfolio Percentage */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-foreground">
                {portfolioPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                av portfölj
              </div>
            </div>
          </div>

          {/* Value Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Värde:</span>
              <div className="font-semibold text-foreground">
                {formatCurrency(displayValue, 'SEK')}
              </div>
            </div>

            {!isCash && quantity > 0 && (
              <div>
                <span className="text-muted-foreground">Antal:</span>
                <div className="font-semibold text-foreground">
                  {quantity}
                </div>
              </div>
            )}

            {!isCash && (
              <div>
                <span className="text-muted-foreground">Investerat:</span>
                <div className="font-semibold text-foreground">
                  {formatCurrency(investedValue, 'SEK')}
                </div>
                {hasPerformanceData ? (
                  !hasPurchasePrice ? (
                    <div className="text-xs text-muted-foreground mt-1">
                      Köpkurs saknas – använder aktuellt värde.
                    </div>
                  ) : null
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    Beräknar avkastning...
                  </div>
                )}
              </div>
            )}

            {!isCash && (
              <div>
                <span className="text-muted-foreground">Avkastning:</span>
                {hasPerformanceData ? (
                  <>
                    <div className={cn('font-semibold', hasPurchasePrice ? profitColor : 'text-foreground')}>
                      {hasPurchasePrice
                        ? `${profit > 0 ? '+' : ''}${formatCurrency(profit, 'SEK')}`
                        : formatCurrency(0, 'SEK')}
                    </div>
                    {hasPurchasePrice ? (
                      <div className={cn('text-xs', profitPercentageColor)}>
                        {`${profit > 0 ? '+' : ''}${profitPercentage.toFixed(2)}%`}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Köpkurs saknas
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    Beräknar avkastning...
                  </div>
                )}
              </div>
            )}

            {!isCash && (
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Aktuellt pris:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {typeof effectivePrice === 'number' && Number.isFinite(effectivePrice) && effectivePrice > 0
                        ? (
                          <>
                            {formatCurrency(effectivePrice, effectiveCurrency)}
                            {effectiveCurrency !== 'SEK' && pricePerUnitInSEK !== null && pricePerUnitInSEK > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ≈ {formatCurrency(pricePerUnitInSEK, 'SEK')}
                              </span>
                            )}
                          </>
                        )
                        : 'Pris saknas'}
                    </span>
                  </div>
                </div>
                {!effectivePrice && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Pris saknas – uppdateras via Google Sheets.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min(portfolioPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isCash && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => onDiscuss(holding.name, holding.symbol)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Diskutera
                </Button>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => onEdit(holding.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
            
            {isCash && onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onEdit(holding.id)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Redigera
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(holding.id, holding.name)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* AI Suggestions */}
          {showAISuggestions && (
            <SmartHoldingSuggestions
              holdingId={holding.id}
              holdingName={holding.name}
              holdingType={holding.holding_type}
              currentValue={holding.current_value}
              portfolioPercentage={portfolioPercentage}
              onSuggestionAction={handleSuggestionAction}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HoldingCard;
