
import React, { useState } from 'react';
import { NewsItem } from '../../mockData/newsData';
import NewsModal from './NewsModal';

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format the published time in a readable format
  const formatPublishedTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'macro':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-50 dark:text-blue-300';
      case 'tech':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:bg-opacity-50 dark:text-purple-300';
      case 'commodities':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:bg-opacity-50 dark:text-amber-300';
      case 'earnings':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-50 dark:text-green-300';
      case 'global':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:bg-opacity-50 dark:text-teal-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleReadMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="card-finance mb-3 animate-fade-in rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-sm shadow-primary/10 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20">
        <div className="flex justify-between items-start mb-1.5">
          <span className={`badge-finance ${getCategoryBadgeClass(news.category)}`}>
            {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatPublishedTime(news.publishedAt)}</span>
        </div>
        <h3 className="font-medium text-sm mb-1.5 text-primary dark:text-blue-200">{news.headline}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{news.summary}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">{news.source}</span>
          <button
            onClick={handleReadMoreClick}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40 dark:bg-blue-500 dark:text-white"
          >
            Läs mer →
          </button>
        </div>
      </div>
      
      <NewsModal 
        news={news}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default NewsCard;
