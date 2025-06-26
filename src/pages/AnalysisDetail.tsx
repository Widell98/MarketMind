
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Heart, MessageCircle, TrendingUp, Sparkles, PieChart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAnalysis, useToggleAnalysisLike } from '@/hooks/useAnalyses';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AnalysisComments from '@/components/AnalysisComments';
import RelatedStockCase from '@/components/RelatedStockCase';

const AnalysisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: analysis, isLoading, error } = useAnalysis(id!);
  const toggleLike = useToggleAnalysisLike();

  const handleLike = () => {
    if (!user || !analysis) return;
    toggleLike.mutate({ analysisId: analysis.id, isLiked: analysis.isLiked });
  };

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

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      'market_insight': 'bg-blue-500',
      'technical_analysis': 'bg-green-500',
      'fundamental_analysis': 'bg-purple-500',
      'sector_analysis': 'bg-orange-500',
      'portfolio_analysis': 'bg-gradient-to-r from-purple-500 to-blue-500',
      'position_analysis': 'bg-gradient-to-r from-green-500 to-blue-500',
      'sector_deep_dive': 'bg-gradient-to-r from-orange-500 to-red-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getAnalysisIcon = (type: string, aiGenerated?: boolean) => {
    if (aiGenerated) return <Sparkles className="w-4 h-4" />;
    if (type.includes('portfolio') || type.includes('position')) return <PieChart className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <Card>
              <CardHeader className="space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !analysis) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
          <Card className="text-center py-8 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-4">
              <p className="text-red-600 dark:text-red-400">
                Analysen kunde inte laddas. Den kanske inte finns eller är privat.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${getAnalysisTypeColor(analysis.analysis_type)}`}></div>
                  <Badge variant="outline" className="text-sm font-medium flex items-center gap-1">
                    {getAnalysisIcon(analysis.analysis_type, analysis.ai_generated)}
                    {getAnalysisTypeLabel(analysis.analysis_type)}
                  </Badge>
                  {analysis.ai_generated && (
                    <Badge variant="outline" className="text-sm bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI-genererad
                    </Badge>
                  )}
                  {analysis.user_portfolios && (
                    <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <PieChart className="w-3 h-3 mr-1" />
                      {analysis.user_portfolios.portfolio_name}
                    </Badge>
                  )}
                  {analysis.stock_cases && (
                    <Badge variant="outline" className="text-sm bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      {analysis.stock_cases.company_name}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {analysis.title}
                </h1>
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
            <div className="prose prose-lg max-w-none mb-6 text-gray-700 dark:text-gray-300">
              <div className="whitespace-pre-wrap">{analysis.content}</div>
            </div>

            {analysis.related_holdings && analysis.related_holdings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Relaterade innehav:</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.related_holdings.map((holding, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {holding.name || holding.symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.tags && analysis.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {analysis.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{analysis.views_count}</span>
                </div>
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-colors ${
                    analysis.isLiked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'hover:text-red-500'
                  }`}
                  disabled={!user}
                >
                  <Heart className={`w-4 h-4 ${analysis.isLiked ? 'fill-current' : ''}`} />
                  <span>{analysis.likes_count}</span>
                </button>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>{analysis.comments_count}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add RelatedStockCase component when analysis is linked to a stock case */}
        {analysis.stock_case_id && (
          <RelatedStockCase stockCaseId={analysis.stock_case_id} />
        )}

        <AnalysisComments analysisId={analysis.id} />
      </div>
    </Layout>
  );
};

export default AnalysisDetail;
