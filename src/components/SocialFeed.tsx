
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Share2, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SocialFeedProps {
  limit?: number;
}

type PostData = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: string;
  stock_case_id?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    bio?: string;
  } | null;
};

const SocialFeed = ({ limit = 10 }: SocialFeedProps) => {
  const navigate = useNavigate();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['social-feed', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            display_name,
            bio
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as PostData[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Community Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Community Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No posts yet. Be the first to share your investment insights!
            </p>
            <Button onClick={() => navigate('/profile')}>
              Create First Post
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          Community Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border-b last:border-b-0 pb-4 last:pb-0">
              {/* Post Header */}
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">
                      {post.profiles?.display_name || post.profiles?.username || 'Anonymous User'}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {post.post_type === 'reflection' && 'Reflection'}
                      {post.post_type === 'case_analysis' && 'Case Analysis'}
                      {post.post_type === 'market_insight' && 'Market Insight'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('sv-SE', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {post.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                  {post.content}
                </p>
              </div>

              {/* Post Actions */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Heart className="w-4 h-4 mr-1" />
                  <span className="text-xs">0</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span className="text-xs">0</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialFeed;
