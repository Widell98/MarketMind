
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { StockCase } from '@/types/stockCase';

export const useStockCases = (followedOnly: boolean = false) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['stock-cases', followedOnly, user?.id],
    queryFn: async () => {
      if (followedOnly && user) {
        // Get followed cases
        const { data: follows, error: followsError } = await supabase
          .from('stock_case_follows')
          .select('stock_case_id')
          .eq('user_id', user.id);

        if (followsError) {
          console.error('Error fetching follows:', followsError);
          throw followsError;
        }
        
        if (!follows || follows.length === 0) {
          return [];
        }

        const stockCaseIds = follows.map(f => f.stock_case_id);

        const { data: stockCases, error: casesError } = await supabase
          .from('stock_cases')
          .select('*')
          .in('id', stockCaseIds)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (casesError) {
          console.error('Error fetching followed stock cases:', casesError);
          throw casesError;
        }

        // Manually fetch profiles and categories
        return await enrichStockCases(stockCases || []);
      }

      // Get all public cases
      const { data, error } = await supabase
        .from('stock_cases')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching stock cases:', error);
        throw error;
      }
      
      // Manually fetch profiles and categories
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

// Helper function to enrich stock cases with profiles and categories
const enrichStockCases = async (stockCases: any[]): Promise<StockCase[]> => {
  if (!stockCases || stockCases.length === 0) return [];

  // Get unique user IDs and category IDs
  const userIds = [...new Set(stockCases.map(c => c.user_id).filter(Boolean))];
  const categoryIds = [...new Set(stockCases.map(c => c.category_id).filter(Boolean))];

  // Fetch profiles
  let profilesData = [];
  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      profilesData = data || [];
    }
  }

  // Fetch categories
  let categoriesData = [];
  if (categoryIds.length > 0) {
    const { data, error } = await supabase
      .from('case_categories')
      .select('id, name, color')
      .in('id', categoryIds);

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      categoriesData = data || [];
    }
  }

  // Fetch like counts for each stock case
  const likesMap = new Map<string, number>();
  if (stockCases.length > 0) {
    const likeCountResults = await Promise.all(
      stockCases.map(async (stockCase) => {
        try {
          const { data, error } = await supabase.rpc('get_stock_case_like_count', { case_id: stockCase.id });

          if (error) {
            throw error;
          }

          return { id: stockCase.id, count: data || 0 };
        } catch (error) {
          console.error('Error fetching like count for stock case:', stockCase.id, error);
          return { id: stockCase.id, count: 0 };
        }
      })
    );

    likeCountResults.forEach(({ id, count }) => {
      likesMap.set(id, count);
    });
  }

  // Enrich stock cases with profile, category, and like data
  return stockCases.map(stockCase => {
    const profile = profilesData.find(p => p.id === stockCase.user_id);
    const category = categoriesData.find(c => c.id === stockCase.category_id);

    return {
      ...stockCase,
      status: (stockCase.status || 'active') as 'active' | 'winner' | 'loser',
      is_public: stockCase.is_public ?? true,
      likes_count: likesMap.get(stockCase.id) || 0,
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
