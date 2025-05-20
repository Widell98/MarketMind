
import React from 'react';
import { NewsItem } from '../../mockData/newsData';

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  // Format the published time in a readable format
  const formatPublishedTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'macro':
        return 'bg-blue-100 text-blue-800';
      case 'tech':
        return 'bg-purple-100 text-purple-800';
      case 'commodities':
        return 'bg-amber-100 text-amber-800';
      case 'earnings':
        return 'bg-green-100 text-green-800';
      case 'global':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card-finance mb-3 animate-fade-in">
      <div className="flex justify-between items-start mb-1.5">
        <span className={`badge-finance ${getCategoryBadgeClass(news.category)}`}>
          {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
        </span>
        <span className="text-xs text-gray-500">{formatPublishedTime(news.publishedAt)}</span>
      </div>
      <h3 className="font-medium text-sm mb-1.5">{news.headline}</h3>
      <p className="text-xs text-gray-600 mb-2">{news.summary}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{news.source}</span>
        <a 
          href={news.url} 
          className="text-xs text-finance-lightBlue font-medium hover:text-finance-blue"
        >
          Läs mer →
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
