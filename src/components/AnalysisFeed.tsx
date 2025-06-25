
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, MessageCircle, TrendingUp, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAnalyses, useToggleAnalysisLike } from '@/hooks/useAnalyses';
import { useAuth } from '@/contexts/AuthContext';
import CreateAnalysisDialog from './CreateAnalysisDialog';

const AnalysisFeed = () => {
  const { data: analyses, isLoading, error } = useAnalyses();
  const { user } = useAuth();
  const toggleLike = useToggleAnalysisLike();

  const handleLike = (analysisId: string, isLiked: boolean) => {
    if (!user) return;
    toggleLike.mutate({ analysisId, isLiked });
  };

  const getAnalysisTypeLabel = (type: string) => {
    const types = {
      'market_insight': 'Marknadsinsikt',
      'technical_analysis': 'Teknisk analys',
      'fundamental_analysis': 'Fundamental analys',
      'sector_analysis': 'Sektoranalys'
    };
    return types[type as keyof typeof types] || type;
  };

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      'market_insight': 'bg-blue-500',
      'technical_analysis': 'bg-green-500',
      'fundamental_analysis': 'bg-purple-500',
      'sector_analysis': 'bg-orange-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="border-0 shadow-sm animate-pulse">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <CreateAnalysisDialog />
        </div>
        <Card className="text-center py-8 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-4">
            <p className="text-red-600 dark:text-red-400">
              Kunde inte ladda analyser. Försök igen senare.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <CreateAnalysisDialog />
        </div>
        <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800">
          <CardContent className="pt-4">
            <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Inga analyser än
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Bli den första att dela en analys med communityn!
            </p>
            <CreateAnalysisDialog />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateAnalysisDialog />
      </div>
      
      <div className="space-y-4">
        {analyses.map((analysis) => (
          <Card key={analysis.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${getAnalysisTypeColor(analysis.analysis_type)}`}></div>
                    <Badge variant="outline" className="text-xs font-medium">
                      {getAnalysisTypeLabel(analysis.analysis_type)}
                    </Badge>
                    {analysis.stock_cases && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {analysis.stock_cases.company_name}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {analysis.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      {analysis.profiles?.display_name || analysis.profiles?.username || 'Anonym'}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="prose prose-sm max-w-none mb-4 text-gray-700 dark:text-gray-300">
                <p className="line-clamp-3">{analysis.content}</p>
              </div>

              {analysis.tags && analysis.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {analysis.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{analysis.views_count}</span>
                  </div>
                  <button
                    onClick={() => handleLike(analysis.id, analysis.isLiked)}
                    className={`flex items-center gap-1 transition-colors ${
                      analysis.isLiked 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'hover:text-red-500'
                    }`}
                    disabled={!user}
                  >
                    <Heart className={`w-4 h-4 ${analysis.isLiked ? 'fill-current' : ''}`} />
                    <span>{analysis.likes_count}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{analysis.comments_count}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                  Läs hela analysen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalysisFeed;
