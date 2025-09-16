import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, LogIn } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CurrentHoldingsPrices: React.FC = () => {
  const { actualHoldings, loading: holdingsLoading } = useUserHoldings();
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatCurrency = (amount: number, currency = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'SEK' ? 0 : 2,
      maximumFractionDigits: currency === 'SEK' ? 2 : 2,
    }).format(amount);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="w-5 h-5 text-green-600" /> Aktuella priser
          </CardTitle>
          <CardDescription>Logga in för att se dina innehavs senaste pris från Google Sheets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Logga in för att se de senaste priserna för dina innehav
            </p>
            <button
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="w-4 h-4 mr-2" /> Logga in
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pricedHoldings = actualHoldings
    .filter((holding) => holding.holding_type !== 'cash')
    .map((holding) => {
      const price = typeof holding.current_price_per_unit === 'number'
        ? holding.current_price_per_unit
        : null;
      const currency = holding.price_currency || holding.currency || 'SEK';
      const value = typeof holding.current_value === 'number'
        ? holding.current_value
        : 0;

      return {
        id: holding.id,
        name: holding.name,
        symbol: holding.symbol,
        price,
        currency,
        value,
      };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="w-5 h-5 text-green-600" /> Aktuella priser
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Priserna hämtas direkt från Google Sheets och uppdateras när arket ändras.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {holdingsLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-6 h-6 mx-auto mb-2 animate-pulse" />
            <p>Laddar dina innehav...</p>
          </div>
        ) : pricedHoldings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Lägg till innehav för att se lagrade priser.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pricedHoldings.map((holding) => (
              <div
                key={holding.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{holding.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {holding.symbol || 'Symbol saknas'} • {holding.currency}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">
                    {holding.price !== null
                      ? formatCurrency(holding.price, holding.currency)
                      : 'Pris saknas'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Värde: {formatCurrency(holding.value, holding.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentHoldingsPrices;
