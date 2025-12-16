import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { StockCase } from '@/types/stockCase';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';
import { isSupabaseFetchError } from '@/utils/supabaseError';

type UseStockCasesOptions = {
  followedOnly?: boolean;
  aiGeneratedOnly?: boolean;
  featuredOnly?: boolean; // Ny option
  limit?: number;
  aiBatchId?: string;
};

export const useStockCases = (followedOnlyOrOptions: boolean | UseStockCasesOptions = false) => {
  const { user } = useAuth();

  const options = useMemo<UseStockCasesOptions>(() => {
    if (typeof followedOnlyOrOptions === 'boolean') {
      return { followedOnly: followedOnlyOrOptions };
    }
    return followedOnlyOrOptions ?? {};
  }, [followedOnlyOrOptions]);

  const {
    followedOnly = false,
    aiGeneratedOnly = false,
    featuredOnly = false, // Default false
    limit,
    aiBatchId,
  } = options;

  const query = useQuery({
    queryKey: ['stock-cases', followedOnly, user?.id, aiGeneratedOnly, featuredOnly, limit, aiBatchId],
    queryFn: async () => {
      // ... (behåll befintlig kod för followedOnly om du vill, men här fokuserar vi på featured/all)

      if (followedOnly && user) {
         // ... (existerande kod för followedOnly)
         // Se till att anropa enrichStockCases på resultatet
         return []; // Placeholder för korthetens skull, behåll din originalkod här
      }

      // Get stock cases
      let query = supabase
        .from('stock_cases')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (aiGeneratedOnly) {
        query = query.eq('ai_generated', true);
      }

      // Ny filtrering
      if (featuredOnly) {
        query = query.eq('is_featured', true);
      }

      if (aiBatchId) {
        query = query.eq('ai_batch_id', aiBatchId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        if (isSupabaseFetchError(error)) {
          console.warn('Network error fetching stock cases:', error);
          return [];
        }
        console.error('Error fetching stock cases:', error);
        throw error;
      }
      
      return await enrichStockCases(data || []);
    },
    enabled: !followedOnly || !!user,
  });

  return {
    stockCases: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};

// Uppdatera enrich funktionen
export const enrichStockCases = async (stockCases: any[]): Promise<StockCase[]> => {
  if (!stockCases || stockCases.length === 0) return [];

  // ... (behåll logik för userIds, categoryIds, profilesData, categoriesData, likesMap)
  
  // (För korthetens skull kopierar jag inte in all fetch-logik här igen, se till att behålla den från din originalfil)
  // Det viktiga är return-mappningen nedan:

  const userIds = [...new Set(stockCases.map(c => c.user_id).filter(Boolean))];
  const categoryIds = [...new Set(stockCases.map(c => c.category_id).filter(Boolean))];

  // Fetch profiles & categories (som i originalfilen...)
  let profilesData: any[] = [];
  if (userIds.length > 0) {
    const { data } = await supabase.from('profiles').select('id, username, display_name').in('id', userIds);
    profilesData = data || [];
  }
  
  let categoriesData: any[] = [];
  if (categoryIds.length > 0) {
    const { data } = await supabase.from('case_categories').select('id, name, color').in('id', categoryIds);
    categoriesData = data || [];
  }

  const likesMap = new Map<string, number>();
  // ... (likes logic som i originalfilen)

  return stockCases.map(stockCase => {
    const profile = profilesData.find(p => p.id === stockCase.user_id);
    const category = categoriesData.find(c => c.id === stockCase.category_id);
    const resolvedTitle = normalizeStockCaseTitle(stockCase.title, stockCase.company_name);

    return {
      ...stockCase,
      title: resolvedTitle,
      status: (stockCase.status || 'active') as 'active' | 'winner' | 'loser',
      is_public: stockCase.is_public ?? true,
      likes_count: likesMap.get(stockCase.id) || 0,
      isFeatured: stockCase.is_featured ?? false, // Mappa databasfältet
      profiles: profile ? {
        username: profile.username,
        display_name: profile.display_name
      } : null,
      case_categories: category ? {
        name: category.name,
        color: category.color
      } : null
    };
  });
};

// Hook for fetching stock cases with filters
export const useStockCasesList = (filters?: {
  limit?: number;
  offset?: number;
  category?: string;
  status?: string;
  search?: string;
}) => {
  const query = useQuery({
    queryKey: ['stock-cases', filters],
    queryFn: async () => {
      let query = supabase
        .from('stock_cases')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return await enrichStockCases(data || []);
    },
  });

  return {
    stockCases: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};

// Hook for fetching a single stock case
export const useStockCase = (id: string) => {
  const query = useQuery({
    queryKey: ['stock-case', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_cases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const enrichedCases = await enrichStockCases([data]);
      return enrichedCases[0];
    },
    enabled: !!id,
  });

  return {
    stockCase: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};
