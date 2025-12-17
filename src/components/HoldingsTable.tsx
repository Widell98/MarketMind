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

// Uppdaterad sorteringstyp för att matcha kolumnerna så gott det går med befintlig logik
type SortBy = 'name' | 'marketValue' | 'performance' | 'dailyChange' | 'share';
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

  const formatPercent = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '—';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const handleSort = (column: SortBy) => {
    if (onSort) {
      onSort(column);
    }
  };

  // Helper för att rendera sorteringsbara headers
  const SortableHeader = ({ 
    column, 
    children, 
    className,
    disableSort = false
  }: { 
    column?: SortBy; 
    children: React.ReactNode;
    className?: string;
    disableSort?: boolean;
  }) => {
    if (disableSort || !column) {
      return <TableHead className={className}>{children}</TableHead>;
    }

    const isActive = sortBy === column;
    return (
      <TableHead 
        className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
        onClick={(e) => {
          e.stopPropagation();
          handleSort(column);
        }}
      >
        <div className={cn("flex items-center gap-1.5", className?.includes("text-right") && "justify-end")}>
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
          {/* 1. Namn */}
          <SortableHeader column="name" className="min-w-[200px]">
            Namn
          </SortableHeader>
          
          {/* 2. Antal */}
          <TableHead className="text-right whitespace-nowrap">Antal</TableHead>

          {/* 3. 1 dag % */}
          <SortableHeader column="dailyChange" className="text-right whitespace-nowrap">
            1 dag %
          </SortableHeader>

          {/* 4. Senast (Pris) */}
          <TableHead className="text-right whitespace-nowrap">Senast</TableHead>

          {/* 5. Inköpskurs (GAV) */}
          <TableHead className="text-right whitespace-nowrap">Inköpskurs</TableHead>

          {/* 6. Sedan köp kr (Avkastning SEK) */}
          <SortableHeader column="performance" className="text-right whitespace-nowrap">
            Sedan köp kr
          </SortableHeader>

          {/* 7. Sedan köp % (Avkastning %) */}
          <SortableHeader column="performance" className="text-right whitespace-nowrap">
            Sedan köp %
          </SortableHeader>

          {/* 8. Värde (Marknadsvärde) */}
          <SortableHeader column="marketValue" className="text-right whitespace-nowrap">
            Värde
          </SortableHeader>

          {/* 9. Andel */}
          <SortableHeader column="share" className="text-right whitespace-nowrap">
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

          // Grundläggande data
          const currentPrice = holding.current_price_per_unit || (quantity > 0 ? valueInSEK / quantity : 0);
          const currency = holding.currency || 'SEK';

          // Beräkningar för avkastning
          const hasPurchasePriceFallback = typeof holding.purchase_price === 'number' && holding.purchase_price > 0 && quantity > 0;
          const purchasePrice = holding.purchase_price || 0;
          
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

          // Daglig förändring
          const dailyChangePercent = typeof holding.dailyChangePercent === 'number'
            ? holding.dailyChangePercent
            : null;
            
          const dailyChangeClass = dailyChangePercent !== null && dailyChangePercent !== 0
            ? dailyChangePercent > 0
              ? 'text-emerald-600'
              : 'text-red-600'
            : 'text-muted-foreground';

          // Andel
          const shareOfPortfolio = totalPortfolioValue && totalPortfolioValue > 0
            ? (valueInSEK / totalPortfolioValue) * 100
            : 0;

          // Symbol och uppdatering
          const trimmedSymbol = holding.symbol?.trim();
          const normalizedSymbol = trimmedSymbol ? trimmedSymbol.toUpperCase() : undefined;
          const isRefreshing = Boolean(
            isUpdatingPrice && refreshingTicker && normalizedSymbol && refreshingTicker === normalizedSymbol
          );
          const isOpen = isMarketOpen(holding);

          return (
            <TableRow key={holding.id}>
              {/* 1. Namn & Diskutera-knapp */}
              <TableCell className="py-3 sm:py-3.5 align-middle">
                <div className="flex items-center gap-6"> {/* gap-6 ger utrymmet du ville ha */}
                  <div className="flex flex-col">
                    <span className="font-semibold text-[15px] leading-tight text-foreground break-words">
                      {holding.name}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                       {onRefreshPrice && normalizedSymbol ? (
                        <button
                          type="button"
                          onClick={() => onRefreshPrice(normalizedSymbol)}
                          disabled={isUpdatingPrice}
                          className={cn(
                            'text-[11px] font-mono text-muted-foreground inline-flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-50'
                          )}
                          title="Uppdatera livepris"
                        >
                          {normalizedSymbol}
                          <RefreshCw
                            className={cn(
                              'w-3 h-3 transition-opacity duration-200',
                              isRefreshing ? 'opacity-100 animate-spin' : 'opacity-0 hover:opacity-100'
                            )}
                          />
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-muted-foreground">{normalizedSymbol ?? '—'}</span>
                      )}
                    </div>
                  </div>

                  {onDiscuss && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDiscuss(holding.name, normalizedSymbol);
                      }}
                      className="h-7 px-3 text-xs font-normal text-muted-foreground border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-foreground transition-all hidden sm:inline-flex items-center gap-1.5 rounded-md shadow-sm bg-white dark:bg-transparent"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Diskutera
                    </Button>
                  )}
                </div>
              </TableCell>

              {/* 2. Antal */}
              <TableCell className="text-right align-middle">
                <span className="text-sm text-foreground">
                  {quantity.toLocaleString('sv-SE')} st
                </span>
              </TableCell>

              {/* 3. 1 dag % */}
              <TableCell className="text-right align-middle">
                 {isOpen && dailyChangePercent !== null ? (
                    <span className={cn('text-sm font-semibold', dailyChangeClass)}>
                      {formatPercent(dailyChangePercent)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
              </TableCell>

              {/* 4. Senast (Pris) */}
              <TableCell className="text-right align-middle">
                <span className="text-sm font-medium">
                  {formatRoundedCurrency(currentPrice, currency, 2)}
                </span>
              </TableCell>

              {/* 5. Inköpskurs (GAV) */}
              <TableCell className="text-right align-middle">
                 {purchasePrice > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    {formatRoundedCurrency(purchasePrice, currency, 2)}
                  </span>
                 ) : (
                   <span className="text-sm text-muted-foreground">—</span>
                 )}
              </TableCell>

              {/* 6. Sedan köp kr */}
              <TableCell className="text-right align-middle">
                <span className={cn('text-sm font-medium', profitClass)}>
                  {profitLoss !== undefined 
                    ? `${profitLoss > 0 ? '+' : ''}${formatRoundedCurrency(profitLoss, 'SEK', 0)}` 
                    : '—'}
                </span>
              </TableCell>

              {/* 7. Sedan köp % */}
              <TableCell className="text-right align-middle">
                <span className={cn('text-sm font-semibold', profitClass)}>
                   {formatPercent(profitPercentage)}
                </span>
              </TableCell>

              {/* 8. Värde */}
              <TableCell className="text-right align-middle">
                <span className="font-semibold text-sm">
                  {formatCurrency(valueInSEK, 'SEK')}
                </span>
              </TableCell>

              {/* 9. Andel */}
              <TableCell className="text-right align-middle">
                <span className="font-medium text-sm text-muted-foreground">
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
