
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommunityRecommendation {
  id: string;
  stock_case?: {
    id: string;
    title: string;
    company_name: string;
    image_url?: string;
    sector?: string;
    description?: string;
    ai_generated?: boolean;
    profiles?: {
      username: string;
      display_name: string | null;
    } | null;
  };
  analysis?: {
    id: string;
    title: string;
    content: string;
    analysis_type: string;
    ai_generated?: boolean;
    profiles?: {
      username: string;
      display_name: string | null;
    } | null;
  };
  tags: string[];
  notes?: string;
  created_at: string;
}

export const useCommunityRecommendations = () => {
  const [recommendations, setRecommendations] = useState<CommunityRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCommunityRecommendations();
    }
  }, [user]);

  const fetchCommunityRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch saved stock cases
      const { data: savedStockCases, error: stockCasesError } = await supabase
        .from('saved_opportunities')
        .select(`
          id,
          tags,
          notes,
          created_at,
          stock_cases!inner(
            id,
            title,
            company_name,
            image_url,
            sector,
            description,
            ai_generated,
            profiles(username, display_name)
          )
        `)
        .eq('user_id', user.id)
        .eq('item_type', 'stock_case')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch saved analyses
      const { data: savedAnalyses, error: analysesError } = await supabase
        .from('saved_opportunities')
        .select(`
          id,
          tags,
          notes,
          created_at,
          analyses!inner(
            id,
            title,
            content,
            analysis_type,
            ai_generated,
            profiles(username, display_name)
          )
        `)
        .eq('user_id', user.id)
        .eq('item_type', 'analysis')
        .order('created_at', { ascending: false })
        .limit(10);

      if (stockCasesError) throw stockCasesError;
      if (analysesError) throw analysesError;

      // Transform the data
      const stockCaseRecommendations: CommunityRecommendation[] = (savedStockCases || []).map(item => ({
        id: item.id,
        stock_case: (item as any).stock_cases,
        tags: item.tags,
        notes: item.notes,
        created_at: item.created_at
      }));

      const analysisRecommendations: CommunityRecommendation[] = (savedAnalyses || []).map(item => ({
        id: item.id,
        analysis: (item as any).analyses,
        tags: item.tags,
        notes: item.notes,
        created_at: item.created_at
      }));

      // Combine and sort by creation date
      const allRecommendations = [...stockCaseRecommendations, ...analysisRecommendations]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecommendations(allRecommendations);
    } catch (error) {
      console.error('Error fetching community recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    recommendations,
    loading,
    refetch: fetchCommunityRecommendations
  };
};
