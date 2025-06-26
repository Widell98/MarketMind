import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, MessageCircle, TrendingUp, Sparkles, PieChart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Analysis } from '@/types/analysis';

interface RelatedAnalysesProps {
  stockCaseId: string;
}

const RelatedAnalyses = ({ stockCaseId }: RelatedAnalysesProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['stock-case-analyses', stockCaseId],
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
        .eq('stock_case_id', stockCaseId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

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
      <Card>
        <CardHeader>
          <CardTitle>Relaterade analyser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relaterade analyser</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Inga analyser kopplade till detta aktiecase än.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Relaterade analyser ({analyses.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {analyses.map((analysis) => (
          <div key={analysis.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
                <h4 className="font-semibold text-sm mb-1">{analysis.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">
                    {analysis.profiles?.display_name || analysis.profiles?.username || 'Anonym'}
                  </span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{analysis.content}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
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
                className="text-xs"
                onClick={() => navigate(`/analysis/${analysis.id}`)}
              >
                Läs mer
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RelatedAnalyses;
