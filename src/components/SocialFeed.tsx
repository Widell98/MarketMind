
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, TrendingUp, BookOpen, Brain, Plus, Users, Briefcase, Target, DollarSign } from 'lucide-react';
import { usePosts, useTogglePostLike, Post } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import CreatePostDialog from './CreatePostDialog';
import { Progress } from '@/components/ui/progress';

const SocialFeed = () => {
  const { data: posts, isLoading } = usePosts(20, true); // Use follow-based posts
  const { user } = useAuth();
  const toggleLike = useTogglePostLike();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'case_analysis':
        return <TrendingUp className="w-4 h-4" />;
      case 'market_insight':
        return <Brain className="w-4 h-4" />;
      case 'portfolio_share':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'case_analysis':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'market_insight':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
      case 'portfolio_share':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'case_analysis':
        return 'Case Analysis';
      case 'market_insight':
        return 'Market Insight';
      case 'portfolio_share':
        return 'Portfolio Share';
      default:
        return 'Reflection';
    }
  };

  const handleLike = (post: Post) => {
    if (!user) return;
    toggleLike.mutate({ postId: post.id, isLiked: post.isLiked });
  };

  const renderPortfolioContent = (portfolio: any) => {
    if (!portfolio) return null;

    const allocation = portfolio.asset_allocation || {};
    const stocks = portfolio.recommended_stocks || [];
    const expectedReturn = portfolio.expected_return;
    const riskScore = portfolio.risk_score;

    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h4 className="font-semibold text-green-800 dark:text-green-300">
            {portfolio.portfolio_name}
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {expectedReturn && (
            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Förväntad avkastning</span>
              </div>
              <span className="font-bold text-green-600 dark:text-green-400">
                {(expectedReturn * 100).toFixed(1)}%
              </span>
            </div>
          )}
          
          {riskScore && (
            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Riskpoäng</span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {riskScore}/10
              </span>
            </div>
          )}
          
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Antal aktier</span>
            </div>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {stocks.length}
            </span>
          </div>
        </div>

        {/* Asset Allocation */}
        {Object.keys(allocation).length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tillgångsfördelning</h5>
            <div className="space-y-2">
              {Object.entries(allocation).map(([asset, percentage]: [string, any]) => (
                <div key={asset} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20 capitalize">
                    {asset}
                  </span>
                  <Progress value={percentage * 100} className="flex-1 h-2" />
                  <span className="text-sm font-medium w-12 text-right">
                    {(percentage * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Recommended Stocks */}
        {stocks.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rekommenderade aktier ({stocks.length > 3 ? 'Top 3' : 'Alla'})
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {stocks.slice(0, 3).map((stock: any, index: number) => (
                <div key={index} className="p-2 bg-white/70 dark:bg-gray-800/70 rounded text-center">
                  <div className="font-medium text-sm">{stock.symbol || stock.name}</div>
                  {stock.allocation && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {(stock.allocation * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse border-0 shadow-sm">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Create Post Section */}
      {user && (
        <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 border-2 border-blue-200 dark:border-blue-800">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg font-semibold">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full justify-start bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-normal"
                  variant="outline"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-3 text-blue-500" />
                  Dela dina investeringsinsikter...
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12 border-2 border-gray-100 dark:border-gray-700">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                        {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getPostTypeColor(post.post_type)} flex items-center gap-2 px-3 py-1 border`}>
                    {getPostTypeIcon(post.post_type)}
                    <span className="capitalize font-medium">{getPostTypeLabel(post.post_type)}</span>
                  </Badge>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                    {post.title}
                  </h3>
                  
                  {/* Stock Case Reference */}
                  {post.stock_cases && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-800">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Analys av: <span className="font-semibold">{post.stock_cases.company_name}</span>
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="prose prose-gray dark:prose-invert max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Portfolio Content */}
                {post.post_type === 'portfolio_share' && post.user_portfolios && 
                  renderPortfolioContent(post.user_portfolios)
                }
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-200 ${
                        post.isLiked 
                          ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900' 
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950'
                      }`}
                      disabled={!user}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{post.likeCount}</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950 transition-all duration-200">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{post.commentCount}</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-950 transition-all duration-200">
                      <Share2 className="w-5 h-5" />
                      <span className="font-medium">Dela</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
            <CardContent className="text-center py-16">
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Inget innehåll än</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Börja följa andra användare för att se deras investeringsinsikter och portfoliouppdateringar i ditt flöde!
                  </p>
                </div>
                {user && (
                  <Button 
                    onClick={() => setShowCreatePost(true)} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Skapa ditt första inlägg
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CreatePostDialog 
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
      />
    </div>
  );
};

export default SocialFeed;
