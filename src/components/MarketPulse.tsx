import React, { useMemo } from 'react';
import { useMarketData, type MarketDataResponse } from '../hooks/useMarketData';
import Sparkline from './ui/Sparkline';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

type MarketPulseBaseProps = {
  marketData: MarketDataResponse | null;
  loading: boolean;
  error: string | null;
  refetch?: () => void;
};

// Hjälpfunktion för att avgöra om en marknad ska visas baserat på tid
const shouldShowStock = (symbol: string): boolean => {
  // Hämta aktuell tid i Stockholm
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const currentMinutes = hour * 60 + minute;

  // Tider i minuter från midnatt
  const swedenOpen = 9 * 60;       // 09:00
  const usOpen = 15 * 60 + 30;     // 15:30
  const closeTime = 23 * 60 + 59;  // 23:59

  // Enkel logik för att gissa marknad. 
  // Antar att symboler med .ST eller specifika svenska storbolag är svenska.
  // Resten antas vara amerikanska (standard i nuvarande data).
  const isSwedish = symbol.endsWith('.ST') || 
                    ['VOLV-B', 'ERIC-B', 'HM-B', 'SEB-A', 'SHB-A', 'SWED-A'].some(s => symbol.includes(s));

  if (isSwedish) {
    // Visa svenska aktier mellan 09:00 och 23:59
    return currentMinutes >= swedenOpen && currentMinutes <= closeTime;
  } else {
    // Visa amerikanska aktier (t.ex. TSLA, AAPL) mellan 15:30 och 23:59
    return currentMinutes >= usOpen && currentMinutes <= closeTime;
  }
};

const MarketPulseBase: React.FC<MarketPulseBaseProps> = ({ marketData, loading, error, refetch }) => {
  const data =
    marketData || {
      marketIndices: [],
      topStocks: [],
      bottomStocks: [],
      lastUpdated: new Date().toISOString(),
    };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrera vinnare och förlorare baserat på öppettider
  const filteredTopStocks = useMemo(() => {
    return data.topStocks.filter(stock => shouldShowStock(stock.symbol));
  }, [data.topStocks]);

  const filteredBottomStocks = useMemo(() => {
    return data.bottomStocks.filter(stock => shouldShowStock(stock.symbol));
  }, [data.bottomStocks]);

  if (loading && !marketData) {
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Market Pulse</h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Realtidsmarknadsdata
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Laddar marknadsdata…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Market Pulse</h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Realtidsmarknadsdata
            </p>
          </div>
        </div>
        <div className="text-center py-12 space-y-4">
          <p className="text-sm font-medium text-destructive">Kunde inte ladda marknadsdata</p>
          <Button onClick={refetch} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Försök igen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Market Pulse</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Realtidsmarknadsdata
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Uppdaterad {formatTime(data.lastUpdated)}
          </span>
          <Button 
            onClick={refetch} 
            variant="ghost" 
            size="sm"
            disabled={loading}
            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-muted-foreground`} />
          </Button>
        </div>
      </div>

      {/* Market Indices Summary - Visas alltid då index/terminer ofta är intressanta dygnet runt */}
      {data.marketIndices.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Marknadsindex
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.marketIndices.map((index) => (
              <div 
                key={index.symbol} 
                className="rounded-2xl border border-border/60 bg-muted/30 p-4 hover:bg-muted/50 hover:border-primary/30 transition-all"
              >
                <div className="text-xs font-medium text-muted-foreground mb-1">{index.symbol}</div>
                <div className="font-bold text-base sm:text-lg text-foreground mb-1">
                  {index.price.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-xs font-semibold ${index.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers - Filtrerad */}
      {filteredTopStocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-foreground">Topprestanda</h3>
          <div className="space-y-2">
            {filteredTopStocks.map((stock) => (
              <div 
                key={stock.symbol} 
                className="rounded-2xl border border-border/60 bg-muted/30 p-4 hover:bg-muted/50 hover:border-primary/30 transition-all flex justify-between items-center"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="hidden sm:block">
                    <Sparkline data={stock.sparklineData} color="#22C55E" />
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-foreground">${stock.price.toFixed(2)}</div>
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      +{stock.change.toFixed(2)} (+{stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Performers - Filtrerad */}
      {filteredBottomStocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-foreground">Lägsta prestanda</h3>
          <div className="space-y-2">
            {filteredBottomStocks.map((stock) => (
              <div 
                key={stock.symbol} 
                className="rounded-2xl border border-border/60 bg-muted/30 p-4 hover:bg-muted/50 hover:border-primary/30 transition-all flex justify-between items-center"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="hidden sm:block">
                    <Sparkline data={stock.sparklineData} color="#EF4444" />
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-foreground">${stock.price.toFixed(2)}</div>
                    <div className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Visa meddelande om marknaden är stängd och inga aktier visas */}
      {filteredTopStocks.length === 0 && filteredBottomStocks.length === 0 && !loading && !error && (
        <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Marknaden är stängd. Dagens vinnare och förlorare visas när börsen öppnar.</p>
          <div className="text-xs text-muted-foreground mt-1 opacity-70">
            Sverige: 09:00 - 23:59 | USA: 15:30 - 23:59
          </div>
        </div>
      )}
    </div>
  );
};

type MarketPulseProps = {
  marketData?: MarketDataResponse | null;
  loading?: boolean;
  error?: string | null;
  refetch?: () => void;
  useExternalData?: boolean;
};

const MarketPulse: React.FC<MarketPulseProps> = ({
  marketData = null,
  loading = false,
  error = null,
  refetch,
  useExternalData = false,
}) => {
  if (useExternalData) {
    return <MarketPulseBase marketData={marketData} loading={loading} error={error} refetch={refetch} />;
  }

  const hookResult = useMarketData();
  return (
    <MarketPulseBase
      marketData={hookResult.marketData}
      loading={hookResult.loading}
      error={hookResult.error}
      refetch={hookResult.refetch}
    />
  );
};

export default MarketPulse;
