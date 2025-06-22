
import React from 'react';
import Layout from '@/components/Layout';
import FlashBriefs from '@/components/FlashBriefs';
import MarketPulse from '@/components/MarketPulse';
import TrendingCases from '@/components/TrendingCases';
import LatestCases from '@/components/LatestCases';
import CommunityStats from '@/components/CommunityStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, BookOpen, Target, Clock, Brain, Shield, BarChart3, Zap, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch real data for mobile stats
  const { data: memberCount } = useQuery({
    queryKey: ['community-members-mobile'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalCases } = useQuery({
    queryKey: ['total-cases-mobile'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stock_cases')
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
        {/* Hero Section */}
        <div className="text-center space-y-6 py-8 md:py-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-2xl">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100">
            Master the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Stock Market
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Learn through real cases, follow trending investments, and build your financial knowledge with our interactive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/stock-cases')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Explore Cases
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/learning')}
            >
              <Target className="w-5 h-5 mr-2" />
              Start Learning
            </Button>
          </div>
        </div>

        {/* AI Portfolio Feature Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                New Feature
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              AI Portfolio Advisor
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the future of portfolio management with our advanced AI that provides personalized insights, 
              risk analysis, and optimization strategies tailored to your investment goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {aiFeatures.map((feature, index) => (
              <Card key={index} className="border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <feature.icon className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Why Choose Our AI Portfolio Advisor?
                </h3>
                <ul className="space-y-3 mb-6">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
                {!user ? (
                  <div className="space-y-4">
                    <Button 
                      size="lg" 
                      onClick={() => navigate('/auth')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full md:w-auto"
                    >
                      <Star className="w-5 h-5 mr-2" />
                      Get Free Access
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Free account • No credit card required • Instant access
                    </p>
                  </div>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/portfolio-advisor')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Open AI Portfolio Advisor
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 text-center">
                  <Brain className="w-16 h-16 mx-auto text-purple-600 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    AI-Powered Insights
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Get instant analysis of your portfolio with actionable recommendations 
                    powered by advanced machine learning algorithms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Show compact stats first */}
        <div className="md:hidden">
          <div className="flex justify-center gap-8 text-sm text-gray-600 dark:text-gray-400 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span className="font-medium">{totalCases || 0}</span>
              <span className="hidden xs:inline">Cases</span>
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{memberCount || 0}</span>
              <span className="hidden xs:inline">Members</span>
            </span>
          </div>
        </div>

        {/* Mobile: Show both Trending and Latest Cases in tabs */}
        <div className="md:hidden">
          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="latest" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Latest
              </TabsTrigger>
            </TabsList>
            <TabsContent value="trending" className="mt-4">
              <TrendingCases />
            </TabsContent>
            <TabsContent value="latest" className="mt-4">
              <LatestCases />
            </TabsContent>
          </Tabs>
        </div>

        {/* Stats Section - Less prominent on mobile */}
        <div className="hidden md:block">
          <CommunityStats />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Flash Briefs */}
          <div className="lg:col-span-2">
            <FlashBriefs />
          </div>

          {/* Right Column - Desktop: Trending Cases, Latest Cases and Market Pulse */}
          <div className="space-y-6">
            {/* Desktop: Show trending cases here */}
            <div className="hidden md:block">
              <TrendingCases />
            </div>
            
            {/* Desktop: Show latest cases below trending cases */}
            <div className="hidden md:block">
              <LatestCases />
            </div>
            
            <MarketPulse />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
