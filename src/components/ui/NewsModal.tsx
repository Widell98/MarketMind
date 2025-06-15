
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { X } from 'lucide-react';
import { Button } from './button';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
}

interface NewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ news, isOpen, onClose }) => {
  if (!news) return null;

  const formatPublishedTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex justify-between items-start">
            <span className={`badge-finance ${getCategoryBadgeClass(news.category)} text-sm`}>
              {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-xl font-semibold text-left dark:text-white">
            {news.headline}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>{news.source}</span>
            <span>{formatPublishedTime(news.publishedAt)}</span>
          </div>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed dark:text-gray-300">
              {news.summary}
            </p>
            
            {/* Extended content - in a real app this would come from the API */}
            <div className="mt-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                This news represents an important development in the {news.category.toLowerCase()} sector 
                and could have significant impact on markets moving forward.
              </p>
              
              <p>
                Analysts are closely monitoring the situation and expect further developments 
                in the coming days. Investors are recommended to stay updated 
                on this development.
              </p>
              
              <p>
                For more detailed analysis and the latest updates, 
                visit the original article via the link below.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <a 
              href={news.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-finance-lightBlue font-medium hover:text-finance-blue dark:text-blue-400 dark:hover:text-blue-300"
            >
              Read the full article on {news.source} →
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsModal;
