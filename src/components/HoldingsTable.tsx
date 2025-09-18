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
  const formatCurrency = (amount: number, currency = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
          const value = typeof holding.current_value === 'number'
            ? holding.current_value
            : 0;

          const purchaseValue = holding.purchase_price && holding.quantity
            ? holding.purchase_price * holding.quantity
            : undefined;

          const profitLoss = purchaseValue !== undefined ? value - purchaseValue : undefined;
          const displayCurrency = holding.price_currency || holding.currency || 'SEK';
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
              <TableCell>{formatCurrency(value, displayCurrency)}</TableCell>
              <TableCell>{holding.quantity ?? '-'}</TableCell>
              <TableCell className={profitLoss === undefined ? '' : profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                {profitLoss !== undefined ? formatCurrency(profitLoss, displayCurrency) : '-'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default HoldingsTable;
