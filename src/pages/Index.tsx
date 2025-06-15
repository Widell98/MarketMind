import React from 'react';
import Layout from '@/components/Layout';
import FlashBriefs from '@/components/FlashBriefs';
import MarketPulse from '@/components/MarketPulse';
import TrendingCases from '@/components/TrendingCases';
import LatestCases from '@/components/LatestCases';
import CommunityStats from '@/components/CommunityStats';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, BookOpen, Target } from 'lucide-react';
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
      const { count, error } = await supabase
        .from('stock_cases')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
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

        {/* Mobile: Show Trending Cases */}
        <div className="md:hidden">
          <TrendingCases />
        </div>

        {/* Stats Section - Less prominent on mobile */}
        <div className="hidden md:block">
          <CommunityStats />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
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
            <LatestCases />
            <MarketPulse />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
