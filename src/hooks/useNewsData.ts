import { useSupabaseNewsFeed } from './useSupabaseNewsFeed';

export { NewsItem } from './useSupabaseNewsFeed';

export const useNewsData = () => {
  const { data, loading, error, refetch, lastUpdated } = useSupabaseNewsFeed('news', {
    refreshInterval: 10 * 60 * 1000,
  });

  return { newsData: data, loading, error, refetch, lastUpdated };
};
