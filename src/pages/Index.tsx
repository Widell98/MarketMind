
import React from 'react';
import Layout from '@/components/Layout';
import FlashBriefs from '@/components/FlashBriefs';
import MarketPulse from '@/components/MarketPulse';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, BookOpen, Target, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCases } from '@/hooks/useStockCases';
import StockCaseCard from '@/components/StockCaseCard';

const Index = () => {
  const navigate = useNavigate();
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(6);
  const { stockCases, loading: stockCasesLoading } = useStockCases();

  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  // Get the 6 most recent cases
  const recentCases = stockCases.slice(0, 6);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-2xl">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100">
            Master the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Stock Market
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Learn through real cases, follow trending investments, and build your financial knowledge with our interactive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              onClick={() => navigate('/profile')}
            >
              <Target className="w-5 h-5 mr-2" />
              Start Learning
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stockCases.length}</div>
                  <p className="text-green-700 dark:text-green-300">Active Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">2.5K</div>
                  <p className="text-blue-700 dark:text-blue-300">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">78%</div>
                  <p className="text-purple-700 dark:text-purple-300">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trending Cases Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trending Cases</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/stock-cases')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {trendingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : trendingCases.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent className="pt-6">
                <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No trending cases yet. Be the first to like a case!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingCases.map((stockCase) => (
                <StockCaseCard
                  key={stockCase.id}
                  stockCase={stockCase}
                  onViewDetails={handleViewStockCaseDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Cases Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recently Added</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/stock-cases')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {stockCasesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentCases.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent className="pt-6">
                <Activity className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No cases available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentCases.map((stockCase) => (
                <StockCaseCard
                  key={stockCase.id}
                  stockCase={stockCase}
                  onViewDetails={handleViewStockCaseDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Main Content Grid - Flash Briefs and Market Pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Flash Briefs */}
          <div className="lg:col-span-2">
            <FlashBriefs />
          </div>

          {/* Right Column - Market Pulse */}
          <div>
            <MarketPulse />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
