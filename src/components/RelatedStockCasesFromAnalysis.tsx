
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Heart, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RelatedStockCasesFromAnalysisProps {
  analysisId: string;
  companyName?: string;
}

const RelatedStockCasesFromAnalysis = ({ analysisId, companyName }: RelatedStockCasesFromAnalysisProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('RelatedStockCasesFromAnalysis: analysisId =', analysisId, 'companyName =', companyName);

  const { data: stockCases, isLoading, error } = useQuery({
    queryKey: ['related-stock-cases-from-analysis', analysisId, companyName],
    queryFn: async () => {
      console.log('Fetching related stock cases for analysis:', analysisId);
      
      // First, get the analysis to extract related information
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .select(`
          *,
          stock_cases (
            company_name,
            title
          )
        `)
        .eq('id', analysisId)
        .single();

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError);
        throw analysisError;
      }

      console.log('Analysis data:', analysisData);

      let allRelatedCases = [];

      // First, get the directly linked stock case if it exists
      if (analysisData.stock_case_id) {
        console.log('Found directly linked stock case ID:', analysisData.stock_case_id);
        
        const { data: linkedCase, error: linkedCaseError } = await supabase
          .from('stock_cases')
          .select(`
            *,
            profiles!stock_cases_user_id_fkey (
              username, 
              display_name
            ),
            case_categories (
              name,
              color
            )
          `)
          .eq('id', analysisData.stock_case_id)
          .eq('is_public', true)
          .single();

        if (!linkedCaseError && linkedCase) {
          console.log('Found directly linked case:', linkedCase);
          allRelatedCases.push(linkedCase);
        }
      }

      // Extract company name from various sources for additional search
      let searchCompanyName = companyName;
      
      // If no company name provided, try to extract from analysis
      if (!searchCompanyName) {
        // Check if analysis is linked to a stock case
        if (analysisData.stock_cases?.company_name) {
          searchCompanyName = analysisData.stock_cases.company_name;
        }
        // Check if company name is mentioned in the title or content
        else if (analysisData.title) {
          // Simple extraction - look for common patterns like $SYMBOL or company names
          const symbolMatch = analysisData.title.match(/\$([A-Z]{2,5})/);
          if (symbolMatch) {
            searchCompanyName = symbolMatch[1];
          }
        }
      }

      console.log('Search company name:', searchCompanyName);

      // Search for additional related cases if we have a company name to search for
      if (searchCompanyName) {
        const { data: additionalCases, error: casesError } = await supabase
          .from('stock_cases')
          .select(`
            *,
            profiles!stock_cases_user_id_fkey (
              username, 
              display_name
            ),
            case_categories (
              name,
              color
            )
          `)
          .eq('is_public', true)
          .or(`company_name.ilike.%${searchCompanyName}%,title.ilike.%${searchCompanyName}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('Additional cases query result:', { additionalCases, casesError });

        if (!casesError && additionalCases) {
          // Filter out the directly linked case to avoid duplicates
          const filteredAdditionalCases = additionalCases.filter(
            (case_) => case_.id !== analysisData.stock_case_id
          );
          allRelatedCases.push(...filteredAdditionalCases);
        }
      }

      // Remove duplicates based on ID
      const uniqueCases = allRelatedCases.filter((case_, index, self) => 
        index === self.findIndex(c => c.id === case_.id)
      );

      console.log('All unique related cases:', uniqueCases);

      if (uniqueCases.length === 0) {
        console.log('No related stock cases found');
        return [];
      }

      // Get stats for each stock case
      const casesWithStats = await Promise.all(
        uniqueCases.map(async (stockCase) => {
          const [likeCountResult, followCountResult] = await Promise.all([
            supabase.rpc('get_stock_case_like_count', { case_id: stockCase.id }),
            supabase.rpc('get_stock_case_follow_count', { case_id: stockCase.id })
          ]);

          let userLikeResult = null;
          let userFollowResult = null;
          
          if (user) {
            [userLikeResult, userFollowResult] = await Promise.all([
              supabase.rpc('user_has_liked_case', { case_id: stockCase.id, user_id: user.id }),
              supabase.rpc('user_follows_case', { case_id: stockCase.id, user_id: user.id })
            ]);
          }

          return {
            ...stockCase,
            likes_count: likeCountResult?.data || 0,
            follows_count: followCountResult?.data || 0,
            isLiked: userLikeResult?.data || false,
            isFollowed: userFollowResult?.data || false,
            profiles: Array.isArray(stockCase.profiles) ? stockCase.profiles[0] : stockCase.profiles,
            isDirectlyLinked: stockCase.id === analysisData.stock_case_id
          };
        })
      );

      console.log('Cases with stats:', casesWithStats);
      return casesWithStats;
    },
    enabled: !!analysisId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    retry: false
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'winner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'loser': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'winner': return 'Vinnare';
      case 'loser': return 'Förlorare';
      default: return 'Aktiv';
    }
  };

  console.log('Component render state:', { isLoading, error, stockCasesCount: stockCases?.length });

  // Don't render anything while loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Relaterade aktiecases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state but don't hide the component
  if (error) {
    console.error('Error in RelatedStockCasesFromAnalysis:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Relaterade aktiecases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Kunde inte ladda relaterade aktiecases
          </p>
        </CardContent>
      </Card>
    );
  }

  // Don't render if no stock cases found
  if (!stockCases || stockCases.length === 0) {
    console.log('Not rendering RelatedStockCasesFromAnalysis: no stock cases found');
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Relaterade aktiecases ({stockCases.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stockCases.map((stockCase) => (
          <div key={stockCase.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(stockCase.status)}>
                    {getStatusLabel(stockCase.status)}
                  </Badge>
                  {stockCase.isDirectlyLinked && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Kopplad analys
                    </Badge>
                  )}
                  {stockCase.case_categories && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: stockCase.case_categories.color }}
                    >
                      {stockCase.case_categories.name}
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm mb-1">{stockCase.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {stockCase.company_name} • {stockCase.sector}
                </p>
                {stockCase.description && (
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                    {stockCase.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">
                    {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonym'}
                  </span>
                </div>
              </div>
              {stockCase.image_url && (
                <img 
                  src={stockCase.image_url} 
                  alt={stockCase.company_name}
                  className="w-12 h-12 rounded-lg object-cover ml-3"
                />
              )}
            </div>

            {(stockCase.entry_price || stockCase.current_price || stockCase.target_price) && (
              <div className="grid grid-cols-3 gap-3 mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {stockCase.entry_price && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Inköp</p>
                    <p className="font-medium text-xs">{stockCase.entry_price} kr</p>
                  </div>
                )}
                {stockCase.current_price && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nu</p>
                    <p className="font-medium text-xs">{stockCase.current_price} kr</p>
                  </div>
                )}
                {stockCase.target_price && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mål</p>
                    <p className="font-medium text-xs">{stockCase.target_price} kr</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Heart className={`w-3 h-3 ${stockCase.isLiked ? 'fill-current text-red-500' : ''}`} />
                  <span>{stockCase.likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{stockCase.follows_count}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
              >
                Visa case
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RelatedStockCasesFromAnalysis;
