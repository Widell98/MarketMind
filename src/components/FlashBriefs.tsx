
import React from 'react';
import { useNewsData } from '../hooks/useNewsData';
import NewsCard from './ui/NewsCard';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import type { NewsItem } from '@/hooks/useSupabaseNewsFeed';

type FlashBriefsContentProps = {
  newsData: NewsItem[];
  loading: boolean;
  error: string | null;
  refetch?: () => void;
  title?: string;
  showHeader?: boolean;
};

const FlashBriefsContent: React.FC<FlashBriefsContentProps> = ({
  newsData,
  loading,
  error,
  refetch,
  title = 'Flash Briefs',
  showHeader = true,
}) => {
  if (loading && newsData.length === 0) {
    return (
      <div className="w-full">
        {showHeader && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-finance-navy dark:text-white sm:text-xl">{title}</h2>
          </div>
        )}
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error && newsData.length === 0) {
    return (
      <div className="w-full">
        {showHeader && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-finance-navy dark:text-white sm:text-xl">{title}</h2>
          </div>
        )}
        <div className="py-8 text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">Failed to load news data</p>
          {refetch && (
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!loading && newsData.length === 0) {
    return (
      <div className="w-full">
        {showHeader && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-finance-navy dark:text-white sm:text-xl">{title}</h2>
          </div>
        )}
        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
          Inga nyheter tillgängliga just nu. Försök uppdatera flödet om en liten stund.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-finance-navy dark:text-white sm:text-xl">{title}</h2>
            <span className="badge-finance bg-finance-lightBlue bg-opacity-10 text-xs text-finance-lightBlue dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
              {newsData.length} news
            </span>
          </div>
          {refetch && (
            <Button
              onClick={refetch}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4 sm:space-y-3">
        {newsData.map((newsItem) => (
          <NewsCard key={newsItem.id} news={newsItem} />
        ))}
      </div>
    </div>
  );
};

type FlashBriefsProps = {
  manual?: boolean;
  newsItems?: NewsItem[];
  loading?: boolean;
  error?: string | null;
  refetch?: () => void;
  title?: string;
  showHeader?: boolean;
};

const FlashBriefs: React.FC<FlashBriefsProps> = ({
  manual = false,
  newsItems,
  loading,
  error,
  refetch,
  title,
  showHeader,
}) => {
  if (manual) {
    return (
      <FlashBriefsContent
        newsData={newsItems ?? []}
        loading={loading ?? false}
        error={error ?? null}
        refetch={refetch}
        title={title}
        showHeader={showHeader}
      />
    );
  }

  const { newsData, loading: hookLoading, error: hookError, refetch: hookRefetch } = useNewsData();

  return (
    <FlashBriefsContent
      newsData={newsData}
      loading={hookLoading}
      error={hookError}
      refetch={hookRefetch}
      title={title}
      showHeader={showHeader}
    />
  );
};

export default FlashBriefs;
