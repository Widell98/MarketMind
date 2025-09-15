import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { convertToSEK, formatCurrency } from '@/utils/currencyUtils';

interface Holding {
  id: string;
  name: string;
  holding_type: string;
  current_value: number;
  currency: string;
  symbol?: string;
  quantity?: number;
  purchase_price?: number;
}

interface HoldingsTableProps {
  holdings: Holding[];
  getPriceForHolding: (holding: Holding) => any;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, getPriceForHolding }) => {
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
          const priceInfo = getPriceForHolding(holding);
          const value = holding.quantity && priceInfo?.price
            ? holding.quantity * priceInfo.price
            : holding.current_value;

          const purchaseValue = holding.purchase_price && holding.quantity
            ? holding.purchase_price * holding.quantity
            : undefined;

          const profitLoss = purchaseValue !== undefined ? value - purchaseValue : undefined;
          const displayCurrency = priceInfo?.currency || holding.currency;
          const valueSek = convertToSEK(value, displayCurrency);
          const profitLossSek = profitLoss !== undefined ? convertToSEK(profitLoss, displayCurrency) : undefined;

          return (
            <TableRow key={holding.id}>
              <TableCell className="font-medium">{holding.name}</TableCell>
              <TableCell>{holding.symbol || '-'}</TableCell>
              <TableCell className="capitalize">{holding.holding_type}</TableCell>
              <TableCell>
                <div>
                  {formatCurrency(value, displayCurrency)}
                  {displayCurrency !== 'SEK' && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(valueSek, 'SEK')}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{holding.quantity ?? '-'}</TableCell>
              <TableCell className={profitLoss === undefined ? '' : profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                {profitLoss !== undefined ? (
                  <div>
                    {formatCurrency(profitLoss, displayCurrency)}
                    {displayCurrency !== 'SEK' && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(profitLossSek || 0, 'SEK')}
                      </div>
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
