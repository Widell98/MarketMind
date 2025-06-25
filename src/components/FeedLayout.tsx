
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BookOpen, Eye, Sparkles, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StockCasesFeed from './StockCasesFeed';
import AnalysisFeed from './AnalysisFeed';
import AIMarketingPanel from './AIMarketingPanel';
import UserInsightsPanel from './UserInsightsPanel';

const FeedLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cases');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      {/* Enhanced Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl translate-y-1/2"></div>
        </div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative py-16 md:py-20 lg:py-24">
          <div className="container mx-auto px-4 relative">
            <div className="max-w-5xl text-center mx-auto">
              {/* Main heading with enhanced typography */}
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 leading-tight">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    Research Powered
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-100 via-white to-blue-100 bg-clip-text text-transparent">
                    Investment Community
                  </span>
                </h1>
              </div>
              
              {/* Enhanced subtitle */}
              <div className="mb-8">
                <p className="text-blue-100/90 text-lg md:text-xl lg:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                  De senaste insikterna om svenska tech & life science bolag
                </p>
                <p className="text-blue-200/70 text-sm md:text-base mt-3 max-w-2xl mx-auto">
                  Följ expertanalyser, upptäck nya investeringsmöjligheter och bygg en stark portfölj
                </p>
              </div>
              
              {/* Enhanced status indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-full px-6 py-3 border border-white/20 shadow-lg">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-sm font-semibold text-blue-50">Live Updates</span>
                </div>
                
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-medium text-blue-100">AI-Powered Insights</span>
                </div>
                
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                  <BarChart3 className="w-4 h-4 text-purple-300" />
                  <span className="text-sm font-medium text-blue-100">Expert Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Smooth bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="relative block w-full h-12 md:h-16 lg:h-20"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              opacity=".25" 
              className="fill-gray-50 dark:fill-gray-900"
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              opacity=".5" 
              className="fill-gray-50 dark:fill-gray-900"
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              className="fill-gray-50 dark:fill-gray-900"
            ></path>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Enhanced Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-2 mb-8">
                <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-1 rounded-xl">
                  <TabsTrigger 
                    value="cases" 
                    className="flex items-center gap-3 px-6 py-4 rounded-xl text-base font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="hidden sm:inline">Investment Cases</span>
                    <span className="sm:hidden">Cases</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analysis" 
                    className="flex items-center gap-3 px-6 py-4 rounded-xl text-base font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="hidden sm:inline">Analyser & Insights</span>
                    <span className="sm:hidden">Analyser</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="cases" className="space-y-6 mt-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Senaste Cases
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
                      Upptäck de hetaste investeringsmöjligheterna
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900 dark:to-blue-800 dark:text-blue-300 px-4 py-2 text-sm font-semibold shadow-md"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    Live Updates
                  </Badge>
                </div>
                <StockCasesFeed />
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6 mt-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Community Analyser
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
                      Djupa analyser från våra experter
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900 dark:to-purple-800 dark:text-purple-300 px-4 py-2 text-sm font-semibold shadow-md"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    Expert Insights
                  </Badge>
                </div>
                <AnalysisFeed />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Panel - Different content based on auth status */}
            {user ? <UserInsightsPanel /> : <AIMarketingPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedLayout;
