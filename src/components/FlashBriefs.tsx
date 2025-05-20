
import React from 'react';
import { newsData } from '../mockData/newsData';
import NewsCard from './ui/NewsCard';
import { Switch } from './ui/switch';

const FlashBriefs = () => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-finance-navy dark:text-white">Flash Briefs</h2>
          <span className="badge-finance bg-finance-lightBlue bg-opacity-10 text-finance-lightBlue dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
            {newsData.length} nyheter
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {newsData.map((newsItem) => (
          <NewsCard key={newsItem.id} news={newsItem} />
        ))}
      </div>
    </div>
  );
};

export default FlashBriefs;
