import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { formatCurrency, resolveHoldingValue, convertToSEK } from '@/utils/currencyUtils';
import type { HoldingPerformance } from '@/hooks/usePortfolioPerformance';

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
}

interface HoldingsTableProps {
  holdings: Holding[];
  onRefreshPrice?: (symbol: string) => void;
  isUpdatingPrice?: boolean;
  refreshingTicker?: string | null;
  holdingPerformanceMap?: Record<string, HoldingPerformance>;
  totalPortfolioValue?: number;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  onRefreshPrice,
  isUpdatingPrice,
  refreshingTicker,
  holdingPerformanceMap,
  totalPortfolioValue
}) => {
  const formatRoundedCurrency = (amount: number, currency: string = 'SEK') =>
    new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency,
      useGrouping: true,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(amount));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[110px]">Typ</TableHead>
          <TableHead className="min-w-[180px]">Namn</TableHead>
          <TableHead className="text-right">Marknadsvärde</TableHead>
          <TableHead className="text-right">Utveckling</TableHead>
          <TableHead className="text-right">Utveckling idag</TableHead>
          <TableHead className="text-right">Andel</TableHead>
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
            ? holding.purchase_price * quantity
            : undefined;
          const purchaseValueSEK = purchaseValueOriginal !== undefined
            ? convertToSEK(purchaseValueOriginal, holding.base_currency || priceCurrency || holding.currency || 'SEK')
            : undefined;

          const performance = holdingPerformanceMap?.[holding.id];
          const hasPerformanceData = Boolean(performance);
          const hasPurchasePrice = performance?.hasPurchasePrice ?? hasPurchasePriceFallback;
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

          const typeLabel = {
            stock: 'Aktie',
            fund: 'Fond',
            crypto: 'Krypto',
            real_estate: 'Fastighet',
            bonds: 'Ränta',
            cash: 'Kassa',
            other: 'Övrigt',
            recommendation: 'Rek.'
          }[holding.holding_type as keyof typeof typeLabel] || 'Övrigt';

          return (
            <TableRow key={holding.id}>
              <TableCell className="py-3 sm:py-3.5">
                <span
                  className={cn(
                    badgeVariants({ variant: 'outline' }),
                    'text-xs font-medium capitalize'
                  )}
                >
                  {typeLabel}
                </span>
              </TableCell>
              <TableCell className="py-3 sm:py-3.5">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium leading-tight text-foreground break-words">{holding.name}</span>
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
              </TableCell>
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
              <TableCell className="py-3 sm:py-3.5 text-right align-middle">
                {dailyChangePercent !== null ? (
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
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
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
