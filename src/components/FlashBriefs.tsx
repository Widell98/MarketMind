
import React from 'react';
import { useNewsData } from '../hooks/useNewsData';
import NewsCard from './ui/NewsCard';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

const FlashBriefs = () => {
  const { newsData, loading, error, refetch } = useNewsData();

  if (loading && newsData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-finance-navy dark:text-white">Flash Briefs</h2>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error && newsData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-finance-navy dark:text-white">Flash Briefs</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load news data</p>
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
        <div className="flex items-center space-x-2">
          <h2 className="text-lg sm:text-xl font-semibold text-finance-navy dark:text-white">Flash Briefs</h2>
          <span className="badge-finance bg-finance-lightBlue bg-opacity-10 text-finance-lightBlue dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300 text-xs">
            {newsData.length} nyheter
          </span>
        </div>
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
      
      <div className="space-y-4 sm:space-y-3">
        {newsData.map((newsItem) => (
          <NewsCard key={newsItem.id} news={newsItem} />
        ))}
      </div>
    </div>
  );
};

export default FlashBriefs;
