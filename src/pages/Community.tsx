
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import SocialFeed from '@/components/SocialFeed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Filter, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: communityStats } = useQuery({
    queryKey: ['community-stats'],
    queryFn: async () => {
      const [members, posts, cases] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('stock_cases').select('*', { count: 'exact', head: true })
      ]);
      
      return {
        members: members.count || 0,
        posts: posts.count || 0,
        cases: cases.count || 0
      };
    },
  });

  const { data: activeUsers } = useQuery({
    queryKey: ['active-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, post_count')
        .order('post_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Join Our Investment Community
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect with investors, share insights, and learn from the community.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg">
            Sign Up Free
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Community
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with investors and share your insights
            </p>
          </div>
          <Button onClick={() => navigate('/profile')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {communityStats?.members || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {communityStats?.posts || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Community Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {communityStats?.cases || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Investment Cases</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="default">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Feed Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-6">
                <SocialFeed limit={20} />
              </TabsContent>
              <TabsContent value="following" className="mt-6">
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Follow some users to see their posts here
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="trending" className="mt-6">
                <SocialFeed limit={20} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Community Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                  Active Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeUsers?.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {member.display_name?.[0] || member.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.display_name || member.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.post_count || 0} posts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/stock-cases')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Browse Stock Cases
                </Button>
                <Button 
                  onClick={() => navigate('/portfolio-advisor')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Portfolio Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Community;
