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
}

interface HoldingsTableProps {
  holdings: Holding[];
  onRefreshPrice?: (symbol: string) => void;
  isUpdatingPrice?: boolean;
  refreshingTicker?: string | null;
  holdingPerformanceMap?: Record<string, HoldingPerformance>;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  onRefreshPrice,
  isUpdatingPrice,
  refreshingTicker,
  holdingPerformanceMap
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Namn</TableHead>
          <TableHead>Symbol</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Värde</TableHead>
          <TableHead>Antal</TableHead>
          <TableHead>Vinst/Förlust</TableHead>
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

          const trimmedSymbol = holding.symbol?.trim();
          const normalizedSymbol = trimmedSymbol ? trimmedSymbol.toUpperCase() : undefined;
          const isRefreshing = Boolean(
            isUpdatingPrice && refreshingTicker && normalizedSymbol && refreshingTicker === normalizedSymbol
          );

          return (
            <TableRow key={holding.id}>
              <TableCell className="font-medium">{holding.name}</TableCell>
              <TableCell>
                {onRefreshPrice && normalizedSymbol ? (
                  <button
                    type="button"
                    onClick={() => onRefreshPrice(normalizedSymbol)}
                    disabled={isUpdatingPrice}
                    className={cn(
                      badgeVariants({ variant: 'outline' }),
                      'text-xs font-mono inline-flex items-center gap-1 px-2 py-0.5 cursor-pointer transition-colors group hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    title="Uppdatera pris från Yahoo Finance"
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
                  holding.symbol || '-'
                )}
              </TableCell>
              <TableCell className="capitalize">{holding.holding_type}</TableCell>
              <TableCell>{formatCurrency(valueInSEK, 'SEK')}</TableCell>
              <TableCell>{quantity > 0 ? quantity : '-'}</TableCell>
              <TableCell>
                {hasPerformanceData ? (
                  <div className="flex flex-col">
                    <span className={cn('font-medium', hasPurchasePrice ? profitClass : 'text-foreground')}>
                      {hasPurchasePrice
                        ? `${profitLoss !== undefined && profitLoss > 0 ? '+' : ''}${formatCurrency(profitLoss ?? 0, 'SEK')}`
                        : formatCurrency(0, 'SEK')}
                    </span>
                    {hasPurchasePrice ? (
                      <span className={cn('text-xs', profitLoss !== undefined && profitLoss !== 0 ? profitClass : 'text-muted-foreground')}>
                        {profitPercentage !== undefined
                          ? `${profitLoss !== undefined && profitLoss > 0 ? '+' : ''}${profitPercentage.toFixed(2)}%`
                          : '—'}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Köpkurs saknas</span>
                    )}
                  </div>
                ) : profitLoss !== undefined ? (
                  <div className="flex flex-col">
                    <span className={cn('font-medium', profitClass)}>
                      {`${profitLoss > 0 ? '+' : ''}${formatCurrency(profitLoss, 'SEK')}`}
                    </span>
                    {profitPercentage !== undefined && (
                      <span className={cn('text-xs', profitClass)}>
                        {`${profitLoss > 0 ? '+' : ''}${profitPercentage.toFixed(2)}%`}
                      </span>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default HoldingsTable;
