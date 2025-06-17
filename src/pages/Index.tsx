
import React from 'react';
import Layout from '@/components/Layout';
import MarketPulse from '@/components/MarketPulse';
import TrendingCases from '@/components/TrendingCases';
import LatestCases from '@/components/LatestCases';
import CommunityStats from '@/components/CommunityStats';
import ModernHero from '@/components/ModernHero';
import EnhancedStats from '@/components/EnhancedStats';
import EnhancedFlashBriefs from '@/components/EnhancedFlashBriefs';
import ModernCard from '@/components/ModernCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, BookOpen, Target, Clock, Activity, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

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
      const { count,errors } = await supabase
        .from('stock_cases')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <Layout>
      <div className="space-y-12 lg:space-y-16">
        {/* Hero Section - Now modern and animated */}
        <ModernHero />

        {/* Mobile: Show compact stats first */}
        <div className="md:hidden px-4">
          <ModernCard className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="p-1.5 rounded-lg bg-purple-500">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold">{totalCases || 0}</span>
                <span className="hidden xs:inline">Cases</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="p-1.5 rounded-lg bg-blue-500">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold">{memberCount || 0}</span>
                <span className="hidden xs:inline">Members</span>
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Enhanced Stats Section - Desktop */}
        <div className="hidden md:block animate-fade-in">
          <EnhancedStats />
        </div>

        {/* Mobile: Show both Trending and Latest Cases in modern tabs */}
        <div className="md:hidden px-4">
          <ModernCard>
            <Tabs defaultValue="trending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                <TabsTrigger 
                  value="trending" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                >
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger 
                  value="latest" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Clock className="w-4 h-4" />
                  Latest
                </TabsTrigger>
              </TabsList>
              <TabsContent value="trending" className="mt-6">
                <TrendingCases />
              </TabsContent>
              <TabsContent value="latest" className="mt-6">
                <LatestCases />
              </TabsContent>
            </Tabs>
          </ModernCard>
        </div>

        {/* Main Content Grid - Enhanced layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column - Enhanced Flash Briefs */}
          <div className="lg:col-span-2 animate-slide-in-left">
            <EnhancedFlashBriefs />
          </div>

          {/* Right Column - Enhanced sidebar */}
          <div className="space-y-8 animate-slide-in-right">
            {/* Desktop: Show trending cases with modern styling */}
            <div className="hidden md:block">
              <ModernCard 
                title="Trending Cases" 
                icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
                glow={true}
              >
                <TrendingCases />
              </ModernCard>
            </div>
            
            {/* Desktop: Show latest cases with modern styling */}
            <div className="hidden md:block">
              <ModernCard 
                title="Latest Cases" 
                icon={<Clock className="w-5 h-5 text-blue-500" />}
              >
                <LatestCases />
              </ModernCard>
            </div>
            
            {/* Market Pulse with modern styling */}
            <ModernCard 
              title="Market Pulse" 
              icon={<Activity className="w-5 h-5 text-green-500" />}
              className="animate-pulse-glow"
            >
              <MarketPulse />
            </ModernCard>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="text-center space-y-8 py-16 animate-fade-in">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ready to Start Your Investment Journey?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Join thousands of successful investors who are already using our platform to make smarter investment decisions.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/stock-cases')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Today
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/learning')}
              className="border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 px-8 py-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
