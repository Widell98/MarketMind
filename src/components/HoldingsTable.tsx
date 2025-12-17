import React from 'react';
import { isMarketOpen } from '@/utils/marketHours';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';
import { formatCurrency, resolveHoldingValue, convertToSEK } from '@/utils/currencyUtils';
import type { HoldingPerformance } from '@/hooks/usePortfolioPerformance';

// Lägg till 'lastPrice' i sorteringstyperna
type SortBy = 'name' | 'marketValue' | 'performance' | 'dailyChange' | 'share' | 'lastPrice';
type SortOrder = 'asc' | 'desc';

interface Holding {
  id: string;
  name: string;
  holding_type: string;
  current_value: number;
  currency: string;
  symbol?: string;
  quantity?: number;
  purchase_price?: number;
  current_price_per_unit?: number;
  price_currency?: string;
  base_currency?: string;
  dailyChangePercent?: number | null;
  dailyChangeValueSEK?: number | null;
  original_value?: number;
  original_currency?: string;
}

interface HoldingsTableProps {
  holdings: Holding[];
  onRefreshPrice?: (symbol: string) => void;
  onDiscuss?: (name: string, symbol?: string) => void;
  isUpdatingPrice?: boolean;
  refreshingTicker?: string | null;
  holdingPerformanceMap?: Record<string, HoldingPerformance>;
  totalPortfolioValue?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  onSort?: (column: SortBy) => void;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  onRefreshPrice,
  onDiscuss,
  isUpdatingPrice,
  refreshingTicker,
  holdingPerformanceMap,
  totalPortfolioValue,
  sortBy = 'name',
  sortOrder = 'asc',
  onSort
}) => {
  const formatRoundedCurrency = (amount: number, currency: string = 'SEK', decimals: number = 0) =>
    new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency,
      useGrouping: true,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(amount);

  const handleSort = (column: SortBy) => {
    if (onSort) {
      onSort(column);
    }
  };

  const SortableHeader = ({ 
    column, 
    children, 
    className 
  }: { 
    column: SortBy; 
    children: React.ReactNode;
    className?: string;
  }) => {
    const isActive = sortBy === column;
    return (
      <TableHead 
        className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
        onClick={(e) => {
          e.stopPropagation();
          handleSort(column);
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{children}</span>
          {isActive ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {/* Namn-kolumnen är lite bredare för att rymma både namn och knapp */}
          <SortableHeader column="name" className="min-w-[280px]">
            Namn
          </SortableHeader>
          
          {/* Ny kolumn: Senast (Kurs) */}
          <SortableHeader column="lastPrice" className="text-right">
            Senast
          </SortableHeader>

          <SortableHeader column="marketValue" className="text-right">
            Marknadsvärde
          </SortableHeader>
          
          <SortableHeader column="performance" className="text-right">
            Utveckling
          </SortableHeader>
          
          <SortableHeader column="dailyChange" className="text-right">
            Utveckling idag
          </SortableHeader>
          
          <SortableHeader column="share" className="text-right">
            Andel
          </SortableHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding) => {
          const {
            valueInSEK,
            quantity,
            priceCurrency,
          } = resolveHoldingValue(holding);

          const hasPurchasePriceFallback = typeof holding.purchase_price === 'number' && holding.purchase_price > 0 && quantity > 0;
          const purchaseValueOriginal = hasPurchasePriceFallback
            ? holding.purchase_price! * quantity
            : undefined;
          const purchaseValueSEK = purchaseValueOriginal !== undefined
            ? convertToSEK(purchaseValueOriginal, holding.base_currency || priceCurrency || holding.currency || 'SEK')
            : undefined;

          const performance = holdingPerformanceMap?.[holding.id];
          const hasPerformanceData = Boolean(performance);
          const profitLoss = performance?.profit ?? (purchaseValueSEK !== undefined ? valueInSEK - purchaseValueSEK : undefined);
          const profitPercentage = performance?.profitPercentage ?? (
            purchaseValueSEK !== undefined && purchaseValueSEK > 0
              ? ((valueInSEK - purchaseValueSEK) / purchaseValueSEK) * 100
              : undefined
          );
          const profitClass = profitLoss !== undefined && profitLoss !== 0
            ? profitLoss > 0
              ? 'text-green-600'
              : 'text-red-600'
            : 'text-foreground';

          const dailyChangePercent = typeof holding.dailyChangePercent === 'number'
            ? holding.dailyChangePercent
            : null;
          const dailyChangeValue = dailyChangePercent !== null
            ? typeof holding.dailyChangeValueSEK === 'number'
              ? holding.dailyChangeValueSEK
              : (valueInSEK * dailyChangePercent) / 100
            : null;
          const dailyChangeClass = dailyChangePercent !== null && dailyChangePercent !== 0
            ? dailyChangePercent > 0
              ? 'text-emerald-600'
              : 'text-red-600'
            : 'text-muted-foreground';

          const shareOfPortfolio = totalPortfolioValue && totalPortfolioValue > 0
            ? (valueInSEK / totalPortfolioValue) * 100
            : 0;

          const trimmedSymbol = holding.symbol?.trim();
          const normalizedSymbol = trimmedSymbol ? trimmedSymbol.toUpperCase() : undefined;
          const isRefreshing = Boolean(
            isUpdatingPrice && refreshingTicker && normalizedSymbol && refreshingTicker === normalizedSymbol
          );

          const isOpen = isMarketOpen(holding);
          
          // Hämta aktuellt pris för visning
          const currentPrice = holding.current_price_per_unit; 
          const displayCurrency = holding.currency || 'SEK';

          return (
            <TableRow key={holding.id}>
              {/* Namn & Diskutera-knapp */}
              <TableCell className="py-3 sm:py-3.5 align-middle">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-semibold text-[15px] leading-tight text-foreground break-words truncate">
                      {holding.name}
                    </span>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                      {onRefreshPrice && normalizedSymbol ? (
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
                        <span className="font-mono tracking-tight">{normalizedSymbol ?? '—'}</span>
                      )}
                      {isRefreshing && (
                        <span className="sr-only">Hämtar live-pris...</span>
                      )}
                      {quantity > 0 && (
                        <span className="text-muted-foreground">• {quantity} st</span>
                      )}
                    </div>
                  </div>

                  {/* Diskutera-knappen placerad här med flex-shrink-0 så den inte trycks ihop */}
                  {onDiscuss && (
                    <div className="flex-shrink-0 pl-4 border-l border-border/40">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDiscuss(holding.name, normalizedSymbol);
                        }}
                        className="h-8 px-3 text-xs font-normal text-muted-foreground border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-foreground transition-all hidden sm:inline-flex items-center gap-2 rounded-md shadow-sm bg-white dark:bg-transparent"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Diskutera
                      </Button>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Senast (Pris) */}
              <TableCell className="py-3 sm:py-3.5 text-right align-middle font-medium">
                {currentPrice 
                  ? formatRoundedCurrency(currentPrice, displayCurrency, 2) // Visar 2 decimaler
                  : '—'}
              </TableCell>

              {/* Marknadsvärde */}
              <TableCell className="py-3 sm:py-3.5 text-right align-middle">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-semibold leading-tight">{formatCurrency(valueInSEK, 'SEK')}</span>
                  {holding.original_value && holding.original_currency && (
                    <span className="text-[11px] text-muted-foreground">
                      {formatCurrency(holding.original_value, holding.original_currency)}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Utveckling */}
              <TableCell className="py-3 sm:py-3.5 text-right align-middle">
                {hasPerformanceData || profitLoss !== undefined ? (
                  <div className="inline-flex items-center justify-end gap-2 text-right">
                    <span className={cn('text-sm font-semibold', profitClass)}>
                      {profitLoss !== undefined
                        ? `${profitLoss > 0 ? '+' : ''}${formatRoundedCurrency(profitLoss, 'SEK')}`
                        : '—'}
                    </span>
                    <span className={cn('text-xs font-medium', profitClass)}>
                      {profitPercentage !== undefined
                        ? `${profitLoss !== undefined && profitLoss > 0 ? '+' : ''}${profitPercentage.toFixed(2)}%`
                        : '—'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              
              {/* Utveckling idag */}
              <TableCell className="py-3 sm:py-3.5 text-right align-middle">
                {isOpen && dailyChangePercent !== null ? (
                  <div className="inline-flex flex-col items-end text-right gap-0.5">
                    <span className={cn('text-sm font-semibold', dailyChangeClass)}>
                      {dailyChangeValue !== null
                        ? `${dailyChangeValue > 0 ? '+' : ''}${formatCurrency(dailyChangeValue, 'SEK')}`
                        : '—'}
                    </span>
                    <span className={cn('text-xs font-medium', dailyChangeClass)}>
                      {`${dailyChangePercent > 0 ? '+' : ''}${dailyChangePercent.toFixed(2)}%`}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground" title={!isOpen ? "Marknaden stängd" : undefined}>—</span>
                )}
              </TableCell>
              
              {/* Andel */}
              <TableCell className="py-3 sm:py-3.5 text-right align-middle">
                <span className="font-medium text-sm">
                  {totalPortfolioValue && totalPortfolioValue > 0
                    ? `${shareOfPortfolio.toFixed(1)}%`
                    : '—'}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default HoldingsTable;
