
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatCurrency, resolveHoldingValue } from '@/utils/currencyUtils';
import type { HoldingPerformance } from '@/hooks/usePortfolioPerformance';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    dailyChangePercent?: number | null;
  };
  portfolioPercentage: number;
  performance?: HoldingPerformance;
  onDiscuss: (name: string, symbol?: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string, name: string) => void;
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
  const [isLogoError, setIsLogoError] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  const {
    valueInSEK: displayValue,
    pricePerUnit: effectivePrice,
    priceCurrency: effectiveCurrency,
    quantity: normalizedQuantity,
  } = resolveHoldingValue(holding);

  const quantity = normalizedQuantity;
  const holdingPerformance = performance;
  const hasPerformanceData = Boolean(holdingPerformance);
  const profit = holdingPerformance?.profit ?? 0;
  const profitPercentage = holdingPerformance?.profitPercentage ?? 0;
  const hasPurchasePrice = holdingPerformance?.hasPurchasePrice ?? (typeof holding.purchase_price === 'number' && holding.purchase_price > 0 && quantity > 0);
  const hasDailyChange = typeof holding.dailyChangePercent === 'number';
  const dailyChangePercent = holding.dailyChangePercent ?? null;
  const dailyChangeValue =
    hasDailyChange && dailyChangePercent !== null
      ? (displayValue * dailyChangePercent) / 100
      : null;
  const trimmedSymbol = holding.symbol?.trim();
  const normalizedSymbol = trimmedSymbol ? trimmedSymbol.toUpperCase() : undefined;
  const isRefreshing = Boolean(
    isUpdatingPrice && refreshingTicker && normalizedSymbol && refreshingTicker === normalizedSymbol
  );
  const logoUrl = !isCash && normalizedSymbol ? `https://financialmodelingprep.com/image-stock/${normalizedSymbol}.png` : null;

  React.useEffect(() => {
    setIsLogoError(false);
  }, [normalizedSymbol]);

  return (
    <Card className="hover:shadow-md transition-all duration-200 rounded-xl border border-border/60">
      <CardContent className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              {logoUrl && !isLogoError ? (
                <img
                  src={logoUrl}
                  alt={`${holding.name} logotyp`}
                  className="w-full h-full object-contain p-1 bg-white"
                  onError={() => setIsLogoError(true)}
                />
              ) : (
                <Icon className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground leading-tight truncate text-sm sm:text-base">{holding.name}</h3>
                {!isCash && quantity > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">{quantity} st</span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-foreground font-medium leading-tight">
                {normalizedSymbol ? (
                  onRefreshPrice ? (
                    <button
                      type="button"
                      onClick={() => onRefreshPrice(normalizedSymbol)}
                      disabled={isUpdatingPrice}
                      className="inline-flex items-center gap-1 px-0 py-0 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Uppdatera livepris"
                    >
                      {normalizedSymbol}
                      <RefreshCw
                        className={cn(
                          'w-3.5 h-3.5 transition-opacity duration-150',
                          isRefreshing ? 'opacity-100 animate-spin' : 'opacity-60'
                        )}
                      />
                    </button>
                  ) : (
                    <span>{normalizedSymbol}</span>
                  )
                ) : (
                  <span className="uppercase">{holding.holding_type}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                {portfolioPercentage.toFixed(1)}%
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
                  aria-label="Kortmeny"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Snabbåtgärder</DropdownMenuLabel>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(holding.id)} className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    Redigera
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(holding.id, holding.name)}
                  className="gap-2 text-red-600 focus:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Ta bort
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
              {formatCurrency(displayValue, 'SEK')}
            </div>

            {!isCash && hasDailyChange && dailyChangePercent !== null ? (
              <div className="flex flex-wrap items-center gap-2 font-semibold">
                <span className="text-muted-foreground text-sm font-medium">idag:</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1',
                    dailyChangePercent > 0
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : dailyChangePercent < 0
                        ? 'text-red-600 dark:text-red-500'
                        : 'text-muted-foreground'
                  )}
                >
                  {dailyChangePercent > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                  {dailyChangePercent < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                  <span>
                    {dailyChangePercent > 0 ? '+' : ''}
                    {dailyChangePercent.toFixed(2)}%
                  </span>
                </span>

                {dailyChangeValue !== null && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      dailyChangePercent > 0
                        ? 'text-emerald-600 dark:text-emerald-500'
                        : dailyChangePercent < 0
                          ? 'text-red-600 dark:text-red-500'
                          : 'text-muted-foreground'
                    )}
                  >
                    (
                    {dailyChangeValue > 0 ? '+' : ''}
                    {formatCurrency(dailyChangeValue, 'SEK')}
                    )
                  </span>
                )}
              </div>
            ) : null}
          </div>

        </div>

        {!isCash && (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground p-0 h-auto"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              {showDetails ? (
                <>
                  Dölj detaljer
                  <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                </>
              ) : (
                <>
                  Visa mer
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </>
              )}
            </Button>

            {showDetails && (
              <div className="space-y-3 pt-1 mt-2">
                {hasPerformanceData && hasPurchasePrice && (
                  <div className="flex flex-wrap items-center gap-2 font-semibold pb-3 border-b border-border">
                    <span className="text-muted-foreground text-sm font-medium">Total utveckling:</span>
                    <TooltipProvider delayDuration={120}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1',
                              profit > 0
                                ? 'text-emerald-600 dark:text-emerald-500'
                                : profit < 0
                                  ? 'text-red-600 dark:text-red-500'
                                  : 'text-muted-foreground'
                            )}
                          >
                            {profit > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : profit < 0 ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : null}
                            <span>
                              {`${profit > 0 ? '+' : ''}${profitPercentage.toFixed(2)}%`}
                            </span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs font-medium">
                          totala utveckling på innehav
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        profit > 0
                          ? 'text-emerald-600 dark:text-emerald-500'
                          : profit < 0
                            ? 'text-red-600 dark:text-red-500'
                            : 'text-muted-foreground'
                      )}
                    >
                      (
                      {profit > 0 ? '+' : ''}
                      {formatCurrency(profit, 'SEK')}
                      )
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  {typeof effectivePrice === 'number' && effectivePrice > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground text-sm font-medium">Kurs:</span>
                      <span className="text-foreground font-semibold">{formatCurrency(effectivePrice, effectiveCurrency)}</span>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    className="flex items-center gap-2 text-muted-foreground font-medium hover:text-foreground text-sm"
                    onClick={() => onDiscuss(holding.name, holding.symbol)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Diskutera
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HoldingCard;
