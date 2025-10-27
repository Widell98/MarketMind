
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';

export interface EnhancedUserStats {
  stockCasesCount: number;
  analysesCount: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  averageLikesPerPost: number;
  topPerformingContent: any[];
}

export const useEnhancedUserStats = (userId?: string) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EnhancedUserStats>({
    stockCasesCount: 0,
    analysesCount: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    averageLikesPerPost: 0,
    topPerformingContent: []
  });
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  const fetchStats = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch stock cases stats
      const { data: stockCases } = await supabase
        .from('stock_cases')
        .select('id, title, company_name, created_at, image_url')
        .eq('user_id', targetUserId)
        .eq('is_public', true);

      // Fetch analyses stats  
      const { data: analyses } = await supabase
        .from('analyses')
        .select('id, title, created_at, likes_count, comments_count, views_count')
        .eq('user_id', targetUserId)
        .eq('is_public', true);

      // Calculate stock case likes
      const sanitizedStockCases = (stockCases || []).map(stockCase => ({
        ...stockCase,
        title: normalizeStockCaseTitle(stockCase.title, stockCase.company_name),
      }));

      let totalStockCaseLikes = 0;
      if (sanitizedStockCases.length) {
        for (const stockCase of sanitizedStockCases) {
          const { data: likesData } = await supabase
            .rpc('get_stock_case_like_count', { case_id: stockCase.id });
          totalStockCaseLikes += likesData || 0;
        }
      }

      // Calculate totals
      const analysisLikes = analyses?.reduce((sum, analysis) => sum + (analysis.likes_count || 0), 0) || 0;
      const analysisViews = analyses?.reduce((sum, analysis) => sum + (analysis.views_count || 0), 0) || 0;
      const analysisComments = analyses?.reduce((sum, analysis) => sum + (analysis.comments_count || 0), 0) || 0;

      const totalLikes = totalStockCaseLikes + analysisLikes;
      const totalPosts = (stockCases?.length || 0) + (analyses?.length || 0);
      const averageLikes = totalPosts > 0 ? totalLikes / totalPosts : 0;

      // Get top performing content
      const allContent = [
        ...(sanitizedStockCases.map(item => ({ ...item, type: 'stock_case', likes: 0 })) || []),
        ...(analyses?.map(item => ({ ...item, type: 'analysis', likes: item.likes_count || 0 })) || [])
      ].sort((a, b) => b.likes - a.likes).slice(0, 3);

      setStats({
        stockCasesCount: stockCases?.length || 0,
        analysesCount: analyses?.length || 0,
        totalLikes,
        totalViews: analysisViews,
        totalComments: analysisComments,
        averageLikesPerPost: Math.round(averageLikes),
        topPerformingContent: allContent
      });

    } catch (error) {
      console.error('Error fetching enhanced user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
};
