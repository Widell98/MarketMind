import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysisDetail } from '@/hooks/useAnalysisDetail';
import { useAnalysisComments } from '@/hooks/useAnalysisComments';
import { useAnalysisLikes } from '@/hooks/useAnalysisLikes';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Eye,
  Calendar,
  Users,
  Tag,
  BarChart3,
  Brain,
  UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import AnalysisComments from '@/components/AnalysisComments';
import AnalysisAIChat from '@/components/AnalysisAIChat';
import MarketSentimentAnalysis from '@/components/MarketSentimentAnalysis';

const AnalysisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: analysis, isLoading: loading, error } = useAnalysisDetail(id || '');
  const { data: comments, isLoading: commentsLoading } = useAnalysisComments(id || '');
  const { likeCount, isLiked, toggleLike } = useAnalysisLikes(id || '');
  const { followUser, unfollowUser, isFollowing } = useUserFollows();

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !analysis) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Analys hittades inte
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Den analys du letar efter finns inte eller har tagits bort.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>
      </Layout>
    );
  }


  const handleFollowClick = () => {
    if (!user) {
      toast({
        title: "Inloggning krävs", 
        description: "Du måste vara inloggad för att följa användare",
        variant: "destructive",
      });
      return;
    }

    if (!analysis.user_id) return;

    if (isFollowing(analysis.user_id)) {
      unfollowUser(analysis.user_id);
    } else {
      followUser(analysis.user_id);
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'market_insight':
        return 'Marknadsinsikt';
      case 'stock_analysis':
        return 'Aktieanalys';
      case 'sector_analysis':
        return 'Sektoranalys';
      case 'portfolio_review':
        return 'Portföljgranskning';
      default:
        return 'Analys';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Meta Info */}
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {analysis.title}
                        </h1>
                        {analysis.ai_generated && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            <Brain className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      
                      {/* Analysis Type and Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">
                          {getAnalysisTypeLabel(analysis.analysis_type)}
                        </Badge>
                        
                        {analysis.tags && analysis.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDistanceToNow(new Date(analysis.created_at), { 
                              addSuffix: true, 
                              locale: sv 
                            })}
                          </span>
                        </div>
                        
                        {analysis.profiles && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Av </span>
                            <button
                              onClick={() => navigate(`/profile/${analysis.user_id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                            >
                              {analysis.profiles.display_name || analysis.profiles.username}
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{analysis.views_count} visningar</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={toggleLike}
                      className={`flex items-center gap-2 ${isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      {likeCount}
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {comments?.length || 0}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Analysis Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">
                    {analysis.content}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Chat Integration */}
            <AnalysisAIChat analysis={analysis} />

            {/* Comments Section */}
            <AnalysisComments analysisId={analysis.id} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Author Info with Follow Button */}
            {analysis.profiles && (
              <Card>
                <CardHeader>
                  <CardTitle>Författare</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <button
                      onClick={() => navigate(`/profile/${analysis.user_id}`)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {analysis.profiles.display_name || analysis.profiles.username}
                    </button>
                  </div>

                  {/* Follow Button - Only show if not own analysis and user is logged in */}
                  {user && analysis.user_id !== user.id && (
                    <Button
                      onClick={handleFollowClick}
                      variant={isFollowing(analysis.user_id) ? "default" : "outline"}
                      size="sm"
                      className="w-full flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {isFollowing(analysis.user_id) ? 'Följer användare' : 'Följ användare'}
                      </span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Market Sentiment Analysis */}
            <MarketSentimentAnalysis />

            {/* Related Holdings */}
            {analysis.related_holdings && analysis.related_holdings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Relaterade innehav</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.related_holdings.map((holding: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="font-medium">{holding.name || holding.symbol}</span>
                        {holding.allocation && (
                          <Badge variant="outline">{holding.allocation}%</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Visningar:</span>
                  <span className="font-medium">{analysis.views_count}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Gillningar:</span>
                  <span className="font-medium">{likeCount}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Kommentarer:</span>
                  <span className="font-medium">{comments?.length || 0}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Synlighet:</span>
                  <Badge variant={analysis.is_public ? "default" : "secondary"}>
                    {analysis.is_public ? "Publik" : "Privat"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalysisDetail;
