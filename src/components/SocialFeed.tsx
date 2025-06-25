
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, TrendingUp, BookOpen, Brain, Plus, Users } from 'lucide-react';
import { usePosts, useTogglePostLike, Post } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import CreatePostDialog from './CreatePostDialog';

const SocialFeed = () => {
  const { data: posts, isLoading } = usePosts(20);
  const { user } = useAuth();
  const toggleLike = useTogglePostLike();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'case_analysis':
        return <TrendingUp className="w-4 h-4" />;
      case 'market_insight':
        return <Brain className="w-4 h-4" />;
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
      default:
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
    }
  };

  const handleLike = (post: Post) => {
    if (!user) return;
    toggleLike.mutate({ postId: post.id, isLiked: post.isLiked });
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
      {/* Header Section */}
      <div className="text-center space-y-4 py-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Community Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share and discover investment insights from our community
            </p>
          </div>
        </div>
      </div>

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
                  Share your investment insights...
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
                    <span className="capitalize font-medium">{post.post_type.replace('_', ' ')}</span>
                  </Badge>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                    {post.title}
                  </h3>
                  {post.stock_cases && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-800">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Analysis of: <span className="font-semibold">{post.stock_cases.company_name}</span>
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
                      <span className="font-medium">Share</span>
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
                  <MessageCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No posts yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Be the first to share your investment insights and spark meaningful discussions in our community!
                  </p>
                </div>
                {user && (
                  <Button 
                    onClick={() => setShowCreatePost(true)} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Post
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
