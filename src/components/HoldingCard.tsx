
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Wallet,
  Building2,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  const [isLogoError, setIsLogoError] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

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
  const trimmedSymbol = holding.symbol?.trim();
  const normalizedSymbol = trimmedSymbol ? trimmedSymbol.toUpperCase() : undefined;
  const isRefreshing = Boolean(
    isUpdatingPrice && refreshingTicker && normalizedSymbol && refreshingTicker === normalizedSymbol
  );
  const logoUrl = !isCash && normalizedSymbol ? `https://financialmodelingprep.com/image-stock/${normalizedSymbol}.png` : null;

  React.useEffect(() => {
    setIsLogoError(false);
  }, [normalizedSymbol]);

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
    <Card className="hover:shadow-md transition-all duration-200 rounded-xl border border-border/60">
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header */}
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

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{holding.name}</h3>
                {holding.symbol && (
                  onRefreshPrice && normalizedSymbol ? (
                    <button
                      type="button"
                      onClick={() => onRefreshPrice(normalizedSymbol)}
                      disabled={isUpdatingPrice}
                      className={cn(
                        badgeVariants({ variant: 'outline' }),
                        'text-[11px] font-mono inline-flex items-center gap-1 px-2 py-0.5 cursor-pointer transition-colors group hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      title="Uppdatera livepris"
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
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {holding.symbol}
                    </Badge>
                  )
                )}
              </div>

              {holding.sector && <p className="text-xs text-muted-foreground line-clamp-1">{holding.sector}</p>}
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                {portfolioPercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">av portfölj</div>
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
                <DropdownMenuItem onClick={() => onDelete(holding.id, holding.name)} className="gap-2 text-red-600 focus:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  Ta bort
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!isCash && (
                  <DropdownMenuItem onClick={() => onDiscuss(holding.name, holding.symbol)} className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Diskutera
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Value & performance */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              {formatCurrency(displayValue, 'SEK')}
            </div>

            {!isCash && (
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold',
                  hasPerformanceData && hasPurchasePrice
                    ? profit > 0
                      ? 'bg-green-100 text-green-700'
                      : profit < 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-muted text-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {hasPerformanceData && hasPurchasePrice ? (
                  <span>
                    {`${profit > 0 ? '+' : ''}${profitPercentage.toFixed(2)}% (${profit > 0 ? '+' : ''}${formatCurrency(profit, 'SEK')})`}
                  </span>
                ) : (
                  <span className="text-xs font-medium">Prisdata saknas</span>
                )}
              </div>
            )}
          </div>

          {!isCash && (quantity > 0 || (typeof effectivePrice === 'number' && effectivePrice > 0)) && (
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
              {quantity > 0 && <span>{quantity} st</span>}
              {quantity > 0 && typeof effectivePrice === 'number' && effectivePrice > 0 && <span>•</span>}
              {typeof effectivePrice === 'number' && effectivePrice > 0 && (
                <span>
                  {formatCurrency(effectivePrice, effectiveCurrency)}
                </span>
              )}
            </div>
          )}
        </div>

        {!isCash && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
              onClick={() => onDiscuss(holding.name, holding.symbol)}
            >
              Diskutera
            </button>
          </div>
        )}

        {/* Details toggle */}
        <div className="pt-1 border-t border-border/80">
          <button
            type="button"
            className="w-full text-left text-sm text-blue-700 hover:text-blue-800 flex items-center justify-between py-1.5"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            <span className="font-medium">{showDetails ? 'Dölj detaljer' : 'Visa mer'}</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showDetails && (
            <div className="pt-2 space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Investerat</p>
                  <p className="font-semibold text-foreground">{formatCurrency(investedValue, 'SEK')}</p>
                  {hasPerformanceData && !hasPurchasePrice && (
                    <p className="text-xs text-muted-foreground">Köpkurs saknas – använder aktuellt värde.</p>
                  )}
                </div>

                {!isCash && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Aktuellt pris</p>
                    <p className="font-semibold text-foreground">
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
                    </p>
                    {!effectivePrice && (
                      <p className="text-xs text-muted-foreground">Pris saknas – uppdatera för att hämta live-pris.</p>
                    )}
                    {isRefreshing && (
                      <p className="text-xs text-muted-foreground">Hämtar live-pris...</p>
                    )}
                  </div>
                )}

                {!isCash && quantity > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Antal</p>
                    <p className="font-semibold text-foreground">{quantity}</p>
                  </div>
                )}

                {holding.sector && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Sektor</p>
                    <p className="font-semibold text-foreground">{holding.sector}</p>
                  </div>
                )}
              </div>

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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HoldingCard;
