
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Building2, Eye, Heart, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';
import { CASE_IMAGE_PLACEHOLDER, getOptimizedCaseImage, handleCaseImageError } from '@/utils/imageUtils';

interface RelatedStockCaseProps {
  stockCaseId: string;
}

const RelatedStockCase = ({ stockCaseId }: RelatedStockCaseProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stockCase, isLoading, error } = useQuery({
    queryKey: ['stock-case', stockCaseId],
    queryFn: async () => {
      // First, get the stock case data
      const { data: caseData, error: fetchError } = await supabase
        .from('stock_cases')
        .select(`
          *,
          case_categories (
            name,
            color
          )
        `)
        .eq('id', stockCaseId)
        .single();

      if (fetchError) {
        console.error('Error fetching stock case:', fetchError);
        throw fetchError;
      }

      if (!caseData) {
        console.error('No stock case data returned');
        return null;
      }

      // Separately fetch the profile data if user_id exists
      let profileData = null;
      if (caseData.user_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .eq('id', caseData.user_id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          profileData = profile;
        }
      }

      // Get count stats
      const [likeCountResult, followCountResult] = await Promise.all([
        supabase.rpc('get_stock_case_like_count', { case_id: stockCaseId }),
        supabase.rpc('get_stock_case_follow_count', { case_id: stockCaseId })
      ]);

      // Get user-specific stats if user is logged in
      let userLikeResult = null;
      let userFollowResult = null;
      
      if (user) {
        [userLikeResult, userFollowResult] = await Promise.all([
          supabase.rpc('user_has_liked_case', { case_id: stockCaseId, user_id: user.id }),
          supabase.rpc('user_follows_case', { case_id: stockCaseId, user_id: user.id })
        ]);
      }

      const normalizedTitle = normalizeStockCaseTitle(caseData.title, caseData.company_name);

      return {
        ...caseData,
        title: normalizedTitle,
        likes_count: likeCountResult?.data || 0,
        follows_count: followCountResult?.data || 0,
        isLiked: userLikeResult?.data || false,
        isFollowed: userFollowResult?.data || false,
        profiles: profileData
      };
    },
    retry: 3,
    retryDelay: 1000,
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

  // Don't render anything if loading, error, or no stock case
  if (isLoading || error || !stockCase) {
    return null;
  }

  const optimizedImageSources = getOptimizedCaseImage(stockCase.image_url);
  const displayImageSrc = optimizedImageSources?.src ?? stockCase.image_url ?? CASE_IMAGE_PLACEHOLDER;
  const displayImageSrcSet = optimizedImageSources?.srcSet;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Relaterat aktiecase
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(stockCase.status)}>
                  {getStatusLabel(stockCase.status)}
                </Badge>
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
              <h4 className="font-semibold text-lg mb-1">{stockCase.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {stockCase.company_name} • {stockCase.sector}
              </p>
              {stockCase.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                  {stockCase.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                <span className="font-medium">
                  {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonym'}
                </span>
              </div>
            </div>
            {displayImageSrc && (
              <img
                src={displayImageSrc}
                srcSet={displayImageSrcSet}
                alt={stockCase.company_name}
                className="w-16 h-16 rounded-lg object-cover ml-4"
                loading="lazy"
                decoding="async"
                onError={handleCaseImageError}
              />
            )}
          </div>

          {(stockCase.entry_price || stockCase.current_price || (stockCase.target_price && !stockCase.ai_generated)) && (
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {stockCase.entry_price && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Inköpspris</p>
                  <p className="font-medium">{stockCase.entry_price} kr</p>
                </div>
              )}
              {stockCase.current_price && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nuvarande</p>
                  <p className="font-medium">{stockCase.current_price} kr</p>
                </div>
              )}
              {stockCase.target_price && !stockCase.ai_generated && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Målkurs</p>
                  <p className="font-medium">{stockCase.target_price} kr</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
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
      </CardContent>
    </Card>
  );
};

export default RelatedStockCase;
