
import React from 'react';
import { topStocks, bottomStocks, marketIndices } from '../mockData/marketData';
import Sparkline from './ui/Sparkline';

const MarketPulse = () => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-finance-navy dark:text-white">Market Pulse</h2>
        <span className="text-xs text-finance-gray dark:text-gray-400">Uppdaterad 08:30</span>
      </div>

      {/* Market Indices Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {marketIndices.map((index) => (
          <div key={index.symbol} className="card-finance p-2 flex flex-col">
            <div className="text-xs text-finance-gray dark:text-gray-400 mb-0.5">{index.symbol}</div>
            <div className="font-medium dark:text-white">{index.price.toLocaleString('sv-SE')}</div>
            <div className={index.change >= 0 ? 'stock-up text-xs' : 'stock-down text-xs'}>
              {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Top Performers */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2 text-finance-blue dark:text-blue-400">Topprestanda</h3>
        <div className="space-y-2">
          {topStocks.map((stock) => (
            <div key={stock.symbol} className="card-finance p-3 flex justify-between items-center">
              <div className="flex flex-col">
                <div className="font-medium text-sm dark:text-white">{stock.symbol}</div>
                <div className="text-xs text-finance-gray dark:text-gray-400">{stock.name}</div>
              </div>
              <div className="flex items-center">
                <Sparkline data={stock.sparklineData} color="#22C55E" />
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

      {/* Bottom Performers */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-finance-blue dark:text-blue-400">Lägsta prestanda</h3>
        <div className="space-y-2">
          {bottomStocks.map((stock) => (
            <div key={stock.symbol} className="card-finance p-3 flex justify-between items-center">
              <div className="flex flex-col">
                <div className="font-medium text-sm dark:text-white">{stock.symbol}</div>
                <div className="text-xs text-finance-gray dark:text-gray-400">{stock.name}</div>
              </div>
              <div className="flex items-center">
                <Sparkline data={stock.sparklineData} color="#EF4444" />
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
    </div>
  );
};

export default MarketPulse;
