
import React from 'react';
import Layout from '@/components/Layout';
import TrendingCases from '@/components/TrendingCases';
import LatestCases from '@/components/LatestCases';
import SocialFeed from '@/components/SocialFeed';
import CommunityStats from '@/components/CommunityStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, Clock, Brain, Shield, BarChart3, Zap, CheckCircle, ArrowRight, Star, MessageSquare, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch real data for stats
  const { data: memberCount } = useQuery({
    queryKey: ['community-members'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalCases } = useQuery({
    queryKey: ['total-cases'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stock_cases')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalPosts } = useQuery({
    queryKey: ['total-posts'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const aiFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Get deep insights into your portfolio with advanced AI that understands market dynamics"
    },
    {
      icon: Shield,
      title: "Risk Assessment", 
      description: "Identify potential risks and get personalized recommendations to protect your investments"
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      description: "Track your portfolio performance with intelligent analytics and comparative benchmarks"
    },
    {
      icon: Zap,
      title: "Smart Optimization",
      description: "Receive AI-driven suggestions to optimize your portfolio allocation and maximize returns"
    }
  ];

  const benefits = [
    "Real-time portfolio analysis powered by advanced AI",
    "Personalized investment recommendations based on your risk profile", 
    "Market trend predictions and timing insights",
    "Automated rebalancing suggestions",
    "24/7 AI assistant for investment questions"
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section - Social Investment Platform */}
        <div className="text-center space-y-6 py-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100">
            The Social{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Investment
            </span>
            {' '}Platform
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Connect with investors, share your cases, get AI-powered portfolio advice, and learn from the community.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            {!user ? (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join Community
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/stock-cases')}
                >
                  Explore Cases
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/community')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  View Community Feed
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/profile')}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Post
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">{memberCount || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Members</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{totalCases || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Investment Cases</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">{totalPosts || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Community Posts</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Social Community Section */}
          <Card className="border-2 border-blue-100 dark:border-blue-900">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-6 h-6 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Social Community
                </Badge>
              </div>
              <CardTitle className="text-2xl">Investment Community</CardTitle>
              <CardDescription className="text-base">
                Share your investment cases, insights, and learn from other investors in our vibrant community.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <SocialFeed limit={3} />
              ) : (
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <MessageSquare className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Join our community to see posts and engage with other investors
                  </p>
                </div>
              )}
              <Button 
                size="lg" 
                onClick={() => user ? navigate('/community') : navigate('/auth')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {user ? (
                  <>
                    <MessageSquare className="w-5 h-5 mr-2" />
                    View Full Community Feed
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Join Community
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI Portfolio Section */}
          <Card className="border-2 border-purple-100 dark:border-purple-900">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-6 h-6 text-purple-600" />
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  AI Powered
                </Badge>
              </div>
              <CardTitle className="text-2xl">AI Portfolio Advisor</CardTitle>
              <CardDescription className="text-base">
                Get personalized investment insights and portfolio optimization powered by advanced AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {aiFeatures.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <feature.icon className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>
              {!user ? (
                <div className="space-y-2">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Get Free AI Access
                  </Button>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Free account • No credit card required
                  </p>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  onClick={() => navigate('/portfolio-advisor')}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Open AI Portfolio
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stock Cases Display Section */}
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Discover Investment Cases
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore trending and latest investment cases shared by our community of investors.
            </p>
          </div>

          {/* Desktop: side-by-side layout */}
          <div className="hidden md:grid md:grid-cols-2 gap-8">
            <TrendingCases />
            <LatestCases />
          </div>

          {/* Mobile: Tabs layout */}
          <div className="md:hidden">
            <Tabs defaultValue="trending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="latest" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Latest
                </TabsTrigger>
              </TabsList>
              <TabsContent value="trending" className="mt-0">
                <TrendingCases />
              </TabsContent>
              <TabsContent value="latest" className="mt-0">
                <LatestCases />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* AI Portfolio Detailed Feature Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl p-6 md:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Choose Our AI Portfolio Advisor?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the future of portfolio management with personalized insights, risk analysis, and optimization strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <ul className="space-y-3 mb-6">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {aiFeatures.map((feature, index) => (
                <Card key={index} className="border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <feature.icon className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                    <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
