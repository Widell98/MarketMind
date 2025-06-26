
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type StockCase = {
  id: string;
  title: string;
  company_name: string;
  image_url: string | null;
  sector: string | null;
  market_cap: string | null;
  pe_ratio: string | null;
  dividend_yield: string | null;
  description: string | null;
  admin_comment: string | null;
  user_id: string | null;
  status: 'active' | 'winner' | 'loser';
  entry_price: number | null;
  current_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  performance_percentage: number | null;
  closed_at: string | null;
  is_public: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  case_categories?: {
    id: string;
    name: string;
    color: string;
  };
  profiles?: {
    id: string;
    display_name: string | null;
    username: string;
  };
};

export const useStockCases = (followedOnly: boolean = false) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['stock-cases', followedOnly, user?.id],
    queryFn: async () => {
      if (followedOnly && user) {
        // Get followed cases by joining with stock_case_follows
        const { data: followedCases, error: followedError } = await supabase
          .from('stock_case_follows')
          .select(`
            stock_cases!inner (
              *,
              case_categories (
                id,
                name,
                color
              ),
              profiles (
                id,
                display_name,
                username
              )
            )
          `)
          .eq('user_id', user.id);

        if (followedError) throw followedError;
        
        return (followedCases || [])
          .map(f => f.stock_cases)
          .filter(Boolean)
          .map(stockCase => ({
            ...stockCase,
            profiles: Array.isArray(stockCase.profiles) ? stockCase.profiles[0] : stockCase.profiles,
            case_categories: Array.isArray(stockCase.case_categories) ? stockCase.case_categories[0] : stockCase.case_categories
          })) as StockCase[];
      }

      const { data, error } = await supabase
        .from('stock_cases')
        .select(`
          *,
          case_categories (
            id,
            name,
            color
          ),
          profiles (
            id,
            display_name,
            username
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(stockCase => ({
        ...stockCase,
        profiles: Array.isArray(stockCase.profiles) ? stockCase.profiles[0] : stockCase.profiles,
        case_categories: Array.isArray(stockCase.case_categories) ? stockCase.case_categories[0] : stockCase.case_categories
      })) as StockCase[];
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
        .select(`
          *,
          case_categories (
            id,
            name,
            color
          ),
          profiles (
            id,
            display_name,
            username
          )
        `)
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
      
      return (data || []).map(stockCase => ({
        ...stockCase,
        profiles: Array.isArray(stockCase.profiles) ? stockCase.profiles[0] : stockCase.profiles,
        case_categories: Array.isArray(stockCase.case_categories) ? stockCase.case_categories[0] : stockCase.case_categories
      })) as StockCase[];
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
        .select(`
          *,
          case_categories (
            id,
            name,
            color
          ),
          profiles (
            id,
            display_name,
            username
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const stockCase = {
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
        case_categories: Array.isArray(data.case_categories) ? data.case_categories[0] : data.case_categories
      };
      
      return stockCase as StockCase;
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
