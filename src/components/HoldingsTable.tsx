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
import { formatCurrency, resolveHoldingValue } from '@/utils/currencyUtils';
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
  performance?: HoldingPerformance;
}

interface HoldingsTableProps {
  holdings: Holding[];
  onRefreshPrice?: (symbol: string) => void;
  isUpdatingPrice?: boolean;
  refreshingTicker?: string | null;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  onRefreshPrice,
  isUpdatingPrice,
  refreshingTicker
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Namn</TableHead>
          <TableHead>Symbol</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Antal</TableHead>
          <TableHead>Värde</TableHead>
          <TableHead>Investerat</TableHead>
          <TableHead>Avkastning</TableHead>
          <TableHead>Avkastning %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding) => {
          const {
            valueInSEK,
            quantity,
          } = resolveHoldingValue(holding);

          const performance = holding.performance;
          const hasPurchasePrice = performance?.hasPurchasePrice ?? false;
          const investedValue = typeof performance?.investedValue === 'number'
            ? performance.investedValue
            : null;
          const profitValue = hasPurchasePrice && typeof performance?.profit === 'number'
            ? performance.profit
            : null;
          const profitPercentageValue = hasPurchasePrice && typeof performance?.profitPercentage === 'number'
            ? performance.profitPercentage
            : null;

          const missingPurchaseData = Boolean(performance) && !hasPurchasePrice;

          const profitClass = !hasPurchasePrice
            ? 'text-muted-foreground'
            : profitValue && profitValue > 0
              ? 'text-green-600'
              : profitValue && profitValue < 0
                ? 'text-red-600'
                : 'text-muted-foreground';

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
                  holding.symbol || '-'
                )}
              </TableCell>
              <TableCell className="capitalize">{holding.holding_type}</TableCell>
              <TableCell>{quantity > 0 ? quantity : '-'}</TableCell>
              <TableCell>{formatCurrency(valueInSEK, 'SEK')}</TableCell>
              <TableCell>
                {typeof investedValue === 'number'
                  ? formatCurrency(investedValue, 'SEK')
                  : '–'}
              </TableCell>
              <TableCell className={profitClass}>
                {profitValue !== null
                  ? formatCurrency(profitValue, 'SEK')
                  : '–'}
              </TableCell>
              <TableCell className={profitClass}>
                {profitPercentageValue !== null
                  ? `${profitPercentageValue.toFixed(2)}%`
                  : missingPurchaseData
                    ? 'Köpdata saknas'
                    : '–'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default HoldingsTable;
