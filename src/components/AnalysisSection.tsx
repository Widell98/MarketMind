
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, MessageCircle, TrendingUp, Sparkles, PieChart, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Analysis } from '@/types/analysis';

interface AnalysesSectionProps {
  limit?: number;
  showHeader?: boolean;
}

const AnalysesSection = ({ limit = 6, showHeader = true }: AnalysesSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['public-analyses', limit],
    queryFn: async () => {
      const { data: analysesData, error } = await supabase
        .from('analyses')
        .select(`
          *,
          profiles!analyses_user_id_fkey (
            username, 
            display_name
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get like counts and user's like status for each analysis
      const analysesWithStats = await Promise.all(
        (analysesData || []).map(async (analysis) => {
          const [likeCountResult, userLikeResult] = await Promise.all([
            supabase.rpc('get_analysis_like_count', { analysis_id: analysis.id }),
            user ? supabase.rpc('user_has_liked_analysis', { analysis_id: analysis.id, user_id: user.id }) : null
          ]);

          // Safely handle related_holdings
          let relatedHoldings: any[] = [];
          if (analysis.related_holdings) {
            if (Array.isArray(analysis.related_holdings)) {
              relatedHoldings = analysis.related_holdings;
            } else if (typeof analysis.related_holdings === 'object') {
              relatedHoldings = Object.values(analysis.related_holdings);
            }
          }

          const transformedAnalysis: Analysis = {
            ...analysis,
            analysis_type: analysis.analysis_type as 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive',
            likes_count: likeCountResult.data || 0,
            isLiked: userLikeResult?.data || false,
            related_holdings: relatedHoldings,
            profiles: Array.isArray(analysis.profiles) ? analysis.profiles[0] || null : analysis.profiles
          };

          return transformedAnalysis;
        })
      );

      return analysesWithStats;
    },
  });

  const getAnalysisTypeLabel = (type: string) => {
    const types = {
      'market_insight': 'Marknadsinsikt',
      'technical_analysis': 'Teknisk analys',
      'fundamental_analysis': 'Fundamental analys',
      'sector_analysis': 'Sektoranalys',
      'portfolio_analysis': 'Portföljanalys',
      'position_analysis': 'Positionsanalys',
      'sector_deep_dive': 'Djup sektoranalys'
    };
    return types[type as keyof typeof types] || type;
  };

  const getAnalysisIcon = (type: string, aiGenerated?: boolean) => {
    if (aiGenerated) return <Sparkles className="w-3 h-3" />;
    if (type.includes('portfolio') || type.includes('position')) return <PieChart className="w-3 h-3" />;
    return <TrendingUp className="w-3 h-3" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {showHeader && (
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 px-2 sm:px-0">
            Senaste Analyser
          </h2>
        )}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 px-2 sm:px-0">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {showHeader && (
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 px-2 sm:px-0">
            Senaste Analyser
          </h2>
        )}
        <Card className="text-center py-6 sm:py-8 bg-gray-50 dark:bg-gray-800 mx-2 sm:mx-0">
          <CardContent className="pt-4">
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <CardTitle className="text-base sm:text-lg mb-2 text-gray-900 dark:text-gray-100">
              Inga analyser än
            </CardTitle>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-4">
              Analyser från communityn kommer att visas här när de publiceras.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between px-2 sm:px-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Senaste Analyser ({analyses.length})
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/analyses')}
            className="text-xs sm:text-sm"
          >
            Se alla
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6 px-2 sm:px-0">
        {analyses.map((analysis) => (
          <div 
            key={analysis.id} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => navigate(`/analysis/${analysis.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-medium flex items-center gap-1">
                    {getAnalysisIcon(analysis.analysis_type, analysis.ai_generated)}
                    {getAnalysisTypeLabel(analysis.analysis_type)}
                  </Badge>
                  {analysis.ai_generated && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI-genererad
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                  {analysis.title}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="font-medium">
                      {analysis.profiles?.display_name || analysis.profiles?.username || 'Anonym'}
                    </span>
                  </div>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                  {analysis.content}
                </p>
                
                {analysis.tags && analysis.tags.length > 0 && (
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {analysis.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {analysis.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{analysis.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t pt-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{analysis.views_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className={`w-3 h-3 ${analysis.isLiked ? 'fill-current text-red-500' : ''}`} />
                  <span>{analysis.likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{analysis.comments_count}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/analysis/${analysis.id}`);
                }}
              >
                Läs mer →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysesSection;
