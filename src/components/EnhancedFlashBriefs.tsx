
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ExternalLink, Zap } from 'lucide-react';
import { useNewsData } from '@/hooks/useNewsData';
import ModernCard from './ModernCard';

const EnhancedFlashBriefs = () => {
  const { newsData, loading, error } = useNewsData();

  if (loading) {
    return (
      <ModernCard 
        title="Flash Briefs" 
        icon={<Zap className="w-5 h-5 text-yellow-500" />}
        className="animate-pulse"
      >
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-shimmer"></div>
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4 animate-shimmer"></div>
            </div>
          ))}
        </div>
      </ModernCard>
    );
  }

  if (error) {
    return (
      <ModernCard 
        title="Flash Briefs" 
        icon={<Zap className="w-5 h-5 text-yellow-500" />}
        className="border-red-200 dark:border-red-800"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">Unable to load news</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please try again later</p>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard 
      title="Flash Briefs" 
      icon={<Zap className="w-5 h-5 text-yellow-500" />}
      glow={true}
      className="animate-fade-in"
    >
      <div className="space-y-6">
        {newsData.slice(0, 5).map((item, index) => (
          <div 
            key={item.id} 
            className={`group cursor-pointer animate-slide-in-left`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="p-4 rounded-2xl bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
                    >
                      {item.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {item.headline}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {item.source}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModernCard>
  );
};

export default EnhancedFlashBriefs;
