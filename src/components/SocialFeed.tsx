
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, TrendingUp, BookOpen, Brain, Plus } from 'lucide-react';
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'market_insight':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const handleLike = (post: Post) => {
    if (!user) return;
    toggleLike.mutate({ postId: post.id, isLiked: post.isLiked });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Button */}
      {user && (
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
          <CardContent className="p-6">
            <Button
              onClick={() => setShowCreatePost(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Share Your Investment Insights
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {posts && posts.length > 0 ? (
        posts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge className={`${getPostTypeColor(post.post_type)} flex items-center gap-1`}>
                  {getPostTypeIcon(post.post_type)}
                  <span className="capitalize">{post.post_type.replace('_', ' ')}</span>
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {post.title}
                </h3>
                {post.stock_cases && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Related to: {post.stock_cases.company_name}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 mb-4">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post)}
                    className={`flex items-center space-x-2 ${
                      post.isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'
                    }`}
                    disabled={!user}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likeCount}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No posts yet</h3>
                <p className="text-gray-500 dark:text-gray-400">Be the first to share your investment insights!</p>
              </div>
              {user && (
                <Button onClick={() => setShowCreatePost(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <CreatePostDialog 
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
      />
    </div>
  );
};

export default SocialFeed;
