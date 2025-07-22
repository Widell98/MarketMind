
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, BarChart3, TrendingUp, Target, Zap, Brain } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useToggleAnalysisLike } from '@/hooks/useAnalysisMutations';
import { Analysis } from '@/types/analysis';

interface TwitterAnalysisCardProps {
  analysis: Analysis;
  onViewDetails?: (id: string) => void;
}

const TwitterAnalysisCard = ({ analysis, onViewDetails }: TwitterAnalysisCardProps) => {
  const navigate = useNavigate();
  const { mutate: toggleLike } = useToggleAnalysisLike();

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(analysis.id);
    } else {
      navigate(`/analysis/${analysis.id}`);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike({ analysisId: analysis.id, isLiked: analysis.isLiked });
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/analysis/${analysis.id}#comments`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: analysis.title,
        text: `Kolla in denna analys: ${analysis.title}`,
        url: window.location.origin + `/analysis/${analysis.id}`
      });
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'market_insight':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'technical_analysis':
        return <BarChart3 className="w-5 h-5 text-purple-500" />;
      case 'fundamental_analysis':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'sector_analysis':
        return <Zap className="w-5 h-5 text-orange-500" />;
      default:
        return <Brain className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'market_insight':
        return 'Marknadsinsikt';
      case 'technical_analysis':
        return 'Teknisk analys';
      case 'fundamental_analysis':
        return 'Fundamental analys';
      case 'sector_analysis':
        return 'Sektoranalys';
      case 'portfolio_analysis':
        return 'Portföljanalys';
      case 'position_analysis':
        return 'Positionsanalys';
      case 'sector_deep_dive':
        return 'Sektorfördjupning';
      default:
        return 'Analys';
    }
  };

  const truncateContent = (content: string, maxLength: number = 280) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card 
      className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              {getAnalysisIcon(analysis.analysis_type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {analysis.profiles?.display_name || analysis.profiles?.username || 'Anonymous'}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                @{analysis.profiles?.username || 'anon'}
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-sm">·</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
              </span>
            </div>

            {/* Analysis type badge */}
            <div className="mb-2">
              <Badge variant="outline" className="text-xs">
                {getAnalysisTypeLabel(analysis.analysis_type)}
              </Badge>
              {analysis.ai_generated && (
                <Badge variant="outline" className="text-xs ml-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  AI
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-2 line-clamp-2">
              {analysis.title}
            </h3>

            {/* Content preview */}
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-3">
              {truncateContent(analysis.content)}
            </p>

            {/* Related info */}
            {(analysis.stock_cases || analysis.user_portfolios) && (
              <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                {analysis.stock_cases && (
                  <span>📊 {analysis.stock_cases.company_name}</span>
                )}
                {analysis.user_portfolios && (
                  <span>💼 {analysis.user_portfolios.portfolio_name}</span>
                )}
              </div>
            )}

            {/* Engagement actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleComment}
                  className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{analysis.comments_count || 0}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Share className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1 transition-colors ${
                    analysis.isLiked 
                      ? 'text-red-500' 
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${analysis.isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{analysis.likes_count || 0}</span>
                </button>
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500">
                {analysis.views_count || 0} visningar
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TwitterAnalysisCard;
