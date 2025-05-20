
import React from 'react';
import { newsData } from '../mockData/newsData';
import NewsCard from './ui/NewsCard';

const FlashBriefs = () => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-finance-navy">Flash Briefs</h2>
        <span className="text-xs text-gray-500">5 nyheter</span>
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
