import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Analysis {
  id: string;
  title: string;
  content: string;
  analysis_type: 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive';
  created_at: string;
  updated_at: string;
  user_id: string;
  stock_case_id?: string;
  portfolio_id?: string;
  tags: string[];
  is_public: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  ai_generated?: boolean;
  related_holdings?: any[];
  shared_from_insight_id?: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
  stock_cases?: {
    company_name: string;
    title: string;
  } | null;
  user_portfolios?: {
    portfolio_name: string;
  } | null;
  isLiked: boolean;
}

export const useAnalyses = (limit = 10) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['analyses', limit, user?.id],
    queryFn: async () => {
      let analysesQuery = supabase
        .from('analyses')
        .select(`
          *,
          stock_cases (company_name, title),
          user_portfolios (portfolio_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: analysesData, error: analysesError } = await analysesQuery;

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
        throw analysesError;
      }

      // Get profiles for all users
      const userIds = analysesData?.map(analysis => analysis.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Create a map of profiles by user_id
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Merge analyses with profiles
      const analysesWithProfiles = analysesData?.map(analysis => ({
        ...analysis,
        profiles: profilesMap.get(analysis.user_id) || null
      })) || [];

      // Get like counts and user's like status for each analysis
      const analysesWithStats = await Promise.all(
        analysesWithProfiles.map(async (analysis) => {
          const [likeCountResult, userLikeResult] = await Promise.all([
            supabase.rpc('get_analysis_like_count', { analysis_id: analysis.id }),
            user ? supabase.rpc('user_has_liked_analysis', { analysis_id: analysis.id, user_id: user.id }) : null
          ]);

          const transformedAnalysis: Analysis = {
            ...analysis,
            analysis_type: analysis.analysis_type as 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive',
            likes_count: likeCountResult.data || 0,
            isLiked: userLikeResult?.data || false,
            related_holdings: analysis.related_holdings || []
          };

          return transformedAnalysis;
        })
      );

      return analysesWithStats;
    },
  });
};

export const useCreateAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisData: {
      title: string;
      content: string;
      analysis_type: 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive';
      stock_case_id?: string;
      portfolio_id?: string;
      tags?: string[];
      is_public?: boolean;
      related_holdings?: any[];
      ai_generated?: boolean;
      shared_from_insight_id?: string;
    }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('analyses')
        .insert({
          ...analysisData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast({
        title: "Analys skapad!",
        description: "Din analys har publicerats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel vid skapande av analys",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateSharedPortfolioAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareData: {
      portfolio_id: string;
      analysis_id: string;
      share_type: 'insight' | 'recommendation' | 'performance';
      original_data?: any;
    }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('shared_portfolio_analyses')
        .insert({
          ...shareData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast({
        title: "Analys delad!",
        description: "Din portföljanalys har delats med communityn.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel vid delning av analys",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useToggleAnalysisLike = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ analysisId, isLiked }: { analysisId: string; isLiked: boolean }) => {
      if (!user) throw new Error('User must be authenticated');

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('analysis_likes')
          .delete()
          .eq('analysis_id', analysisId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('analysis_likes')
          .insert({
            analysis_id: analysisId,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid uppdatering av gilla",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
