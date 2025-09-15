import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

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
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings }) => {
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
          const pricePerUnit = holding.current_price_per_unit;
          const value = holding.quantity && pricePerUnit
            ? holding.quantity * pricePerUnit
            : holding.current_value;

          const purchaseValue = holding.purchase_price && holding.quantity
            ? holding.purchase_price * holding.quantity
            : undefined;

          const profitLoss = purchaseValue !== undefined ? value - purchaseValue : undefined;
          const displayCurrency = holding.price_currency || holding.currency;

          return (
            <TableRow key={holding.id}>
              <TableCell className="font-medium">{holding.name}</TableCell>
              <TableCell>{holding.symbol || '-'}</TableCell>
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
