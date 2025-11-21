import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseOfflineMessage, isSupabaseFetchError } from '@/utils/supabaseError';
import type { StockCase } from '@/types/stockCase';
import { enrichStockCases } from './useStockCases';

type LikedStockCase = StockCase & { liked_at?: string };

export const useLikedStockCases = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['liked-stock-cases', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<LikedStockCase[]> => {
      if (!user) {
        return [];
      }

      const { data: likes, error: likesError } = await supabase
        .from('stock_case_likes')
        .select('stock_case_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (likesError) {
        if (isSupabaseFetchError(likesError)) {
          console.warn('Network error fetching liked stock cases:', likesError);
          return [];
        }

        throw likesError;
      }

      if (!likes || likes.length === 0) {
        return [];
      }

      const stockCaseIds = likes.map((like) => like.stock_case_id);

      const { data: likedCases, error: likedCasesError } = await supabase
        .from('stock_cases')
        .select('*')
        .in('id', stockCaseIds)
        .eq('is_public', true);

      if (likedCasesError) {
        if (isSupabaseFetchError(likedCasesError)) {
          console.warn('Network error fetching liked stock case details:', likedCasesError);
          return [];
        }

        throw likedCasesError;
      }

      const enrichedCases = await enrichStockCases(likedCases || []);
      const likedAtMap = new Map<string, string>(
        likes.map((like) => [like.stock_case_id, like.created_at])
      );

      return enrichedCases
        .map((stockCase) => ({ ...stockCase, liked_at: likedAtMap.get(stockCase.id) }))
        .sort((a, b) => {
          const aDate = a.liked_at ? new Date(a.liked_at).getTime() : 0;
          const bDate = b.liked_at ? new Date(b.liked_at).getTime() : 0;
          return bDate - aDate;
        });
    },
    onError: (error) => {
      console.error('Error loading liked stock cases:', error);
      toast({
        title: 'Kunde inte ladda gillade case',
        description: isSupabaseFetchError(error)
          ? getSupabaseOfflineMessage()
          : 'Försök igen senare.',
        variant: 'destructive',
      });
    },
  });

  const groupedByCompany = useMemo(() => {
    const groups = new Map<string, LikedStockCase[]>();

    (query.data || []).forEach((stockCase) => {
      const company = stockCase.company_name || 'Okänt bolag';
      const existing = groups.get(company) || [];
      groups.set(company, [...existing, stockCase]);
    });

    return Array.from(groups.entries()).map(([companyName, cases]) => ({
      companyName,
      cases,
    }));
  }, [query.data]);

  return {
    likedStockCases: query.data || [],
    groupedByCompany,
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
