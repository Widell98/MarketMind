
import React from 'react';
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

  if (loading && !marketData) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-finance-navy dark:text-white">Market Pulse</h2>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-finance-navy dark:text-white">Market Pulse</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load market data</p>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-finance-navy dark:text-white">Market Pulse</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-finance-gray dark:text-gray-400">
            Uppdaterad {formatTime(data.lastUpdated)}
          </span>
          <Button 
            onClick={refetch} 
            variant="ghost" 
            size="sm"
            disabled={loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Market Indices Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2 mb-6">
        {data.marketIndices.map((index) => (
          <div key={index.symbol} className="card-finance p-3 sm:p-2 flex flex-col">
            <div className="text-xs text-finance-gray dark:text-gray-400 mb-0.5">{index.symbol}</div>
            <div className="font-medium text-sm sm:text-base dark:text-white">{index.price.toLocaleString('sv-SE')}</div>
            <div className={index.change >= 0 ? 'stock-up text-xs' : 'stock-down text-xs'}>
              {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Top Performers */}
      {data.topStocks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 text-finance-blue dark:text-blue-400">Topprestanda</h3>
          <div className="space-y-3 sm:space-y-2">
            {data.topStocks.map((stock) => (
              <div key={stock.symbol} className="card-finance p-4 sm:p-3 flex justify-between items-center">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="font-medium text-sm dark:text-white">{stock.symbol}</div>
                  <div className="text-xs text-finance-gray dark:text-gray-400 truncate">{stock.name}</div>
                </div>
                <div className="flex items-center ml-4">
                  <div className="hidden sm:block">
                    <Sparkline data={stock.sparklineData} color="#22C55E" />
                  </div>
                  <div className="ml-2 text-right">
                    <div className="font-medium text-sm dark:text-white">${stock.price.toFixed(2)}</div>
                    <div className="stock-up text-xs">
                      +{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Performers */}
      {data.bottomStocks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 text-finance-blue dark:text-blue-400">Lägsta prestanda</h3>
          <div className="space-y-3 sm:space-y-2">
            {data.bottomStocks.map((stock) => (
              <div key={stock.symbol} className="card-finance p-4 sm:p-3 flex justify-between items-center">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="font-medium text-sm dark:text-white">{stock.symbol}</div>
                  <div className="text-xs text-finance-gray dark:text-gray-400 truncate">{stock.name}</div>
                </div>
                <div className="flex items-center ml-4">
                  <div className="hidden sm:block">
                    <Sparkline data={stock.sparklineData} color="#EF4444" />
                  </div>
                  <div className="ml-2 text-right">
                    <div className="font-medium text-sm dark:text-white">${stock.price.toFixed(2)}</div>
                    <div className="stock-down text-xs">
                      {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
