
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
      
      // Get all saved opportunities first
      const { data: savedOpportunities, error: savedError } = await supabase
        .from('saved_opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;

      if (!savedOpportunities || savedOpportunities.length === 0) {
        setRecommendations([]);
        return;
      }

      // Separate stock cases and analyses
      const stockCaseIds = savedOpportunities
        .filter(item => item.item_type === 'stock_case')
        .map(item => item.item_id);
      
      const analysisIds = savedOpportunities
        .filter(item => item.item_type === 'analysis')
        .map(item => item.item_id);

      // Fetch stock cases without user profiles first
      let stockCases: any[] = [];
      if (stockCaseIds.length > 0) {
        const { data: stockCasesData, error: stockCasesError } = await supabase
          .from('stock_cases')
          .select(`
            id,
            title,
            company_name,
            image_url,
            sector,
            description,
            ai_generated,
            user_id
          `)
          .in('id', stockCaseIds);

        if (stockCasesError) throw stockCasesError;
        stockCases = stockCasesData || [];
      }

      // Fetch analyses without user profiles first
      let analyses: any[] = [];
      if (analysisIds.length > 0) {
        const { data: analysesData, error: analysesError } = await supabase
          .from('analyses')
          .select(`
            id,
            title,
            content,
            analysis_type,
            ai_generated,
            user_id
          `)
          .in('id', analysisIds);

        if (analysesError) throw analysesError;
        analyses = analysesData || [];
      }

      // Get all unique user IDs from both stock cases and analyses
      const userIds = [
        ...stockCases.map(sc => sc.user_id),
        ...analyses.map(a => a.user_id)
      ].filter(id => id); // Remove null/undefined values

      // Fetch user profiles separately
      let userProfiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        userProfiles = profilesData || [];
      }

      // Create a lookup map for profiles
      const profilesMap = userProfiles.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine the data
      const combinedRecommendations: CommunityRecommendation[] = [];

      // Add stock case recommendations
      savedOpportunities
        .filter(item => item.item_type === 'stock_case')
        .forEach(savedItem => {
          const stockCase = stockCases.find(sc => sc.id === savedItem.item_id);
          if (stockCase) {
            const profile = stockCase.user_id ? profilesMap[stockCase.user_id] : null;
            combinedRecommendations.push({
              id: savedItem.id,
              stock_case: {
                id: stockCase.id,
                title: stockCase.title,
                company_name: stockCase.company_name,
                image_url: stockCase.image_url,
                sector: stockCase.sector,
                description: stockCase.description,
                ai_generated: stockCase.ai_generated,
                profiles: profile ? {
                  username: profile.username,
                  display_name: profile.display_name
                } : null
              },
              tags: savedItem.tags,
              notes: savedItem.notes,
              created_at: savedItem.created_at
            });
          }
        });

      // Add analysis recommendations
      savedOpportunities
        .filter(item => item.item_type === 'analysis')
        .forEach(savedItem => {
          const analysis = analyses.find(a => a.id === savedItem.item_id);
          if (analysis) {
            const profile = analysis.user_id ? profilesMap[analysis.user_id] : null;
            combinedRecommendations.push({
              id: savedItem.id,
              analysis: {
                id: analysis.id,
                title: analysis.title,
                content: analysis.content,
                analysis_type: analysis.analysis_type,
                ai_generated: analysis.ai_generated,
                profiles: profile ? {
                  username: profile.username,
                  display_name: profile.display_name
                } : null
              },
              tags: savedItem.tags,
              notes: savedItem.notes,
              created_at: savedItem.created_at
            });
          }
        });

      // Sort by creation date
      combinedRecommendations.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRecommendations(combinedRecommendations);
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
