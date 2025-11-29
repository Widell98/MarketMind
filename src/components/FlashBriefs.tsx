
import React, { useMemo } from 'react';
import { useNewsData, type NewsDigestSummary } from '../hooks/useNewsData';
import NewsCard from './ui/NewsCard';
import { Loader2, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { Button } from './ui/button';
import type { NewsItem } from '@/mockData/newsData';

type FlashBriefsContentProps = {
  newsData: NewsItem[];
  newsSummary?: NewsDigestSummary | null;
  showSummary?: boolean;
  loading: boolean;
  error: string | null;
  refetch?: () => void;
  title?: string;
  showHeader?: boolean;
};

const FlashBriefsContent: React.FC<FlashBriefsContentProps> = ({
  newsData,
  newsSummary,
  showSummary = true,
  loading,
  error,
  refetch,
  title = 'Flash Briefs',
  showHeader = true,
}) => {
  const generatedLabel = useMemo(() => {
    if (!newsSummary?.generatedAt) return '';
    const date = new Date(newsSummary.generatedAt);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  }, [newsSummary?.generatedAt]);

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

      {showSummary && newsSummary && (
        <div className="mb-5 rounded-3xl border border-border/70 bg-muted/40 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  AI-sammanfattning
                </p>
                <p className="text-base font-semibold text-foreground">{newsSummary.headline}</p>
              </div>
            </div>
            {generatedLabel && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Genererad {generatedLabel}</span>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{newsSummary.overview}</p>
          {newsSummary.keyHighlights?.length > 0 && (
            <ul className="mt-4 space-y-2">
              {newsSummary.keyHighlights.slice(0, 3).map((item, index) => (
                <li
                  key={`flash-digest-${index}`}
                  className="rounded-2xl border border-border/60 bg-background/60 p-3 text-sm leading-relaxed text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
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
  newsSummary?: NewsDigestSummary | null;
  showSummary?: boolean;
  loading?: boolean;
  error?: string | null;
  refetch?: () => void;
  title?: string;
  showHeader?: boolean;
};

const FlashBriefs: React.FC<FlashBriefsProps> = ({
  manual = false,
  newsItems,
  newsSummary,
  showSummary = true,
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
        newsSummary={newsSummary}
        showSummary={showSummary}
        loading={loading ?? false}
        error={error ?? null}
        refetch={refetch}
        title={title}
        showHeader={showHeader}
      />
    );
  }

  const {
    newsData,
    newsSummary: hookSummary,
    loading: hookLoading,
    error: hookError,
    refetch: hookRefetch,
  } = useNewsData();

  return (
    <FlashBriefsContent
      newsData={newsData}
      newsSummary={hookSummary}
      showSummary={showSummary}
      loading={hookLoading}
      error={hookError}
      refetch={hookRefetch}
      title={title}
      showHeader={showHeader}
    />
  );
};

export default FlashBriefs;
