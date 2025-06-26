
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
    <div className="mobile-viewport bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      {/* Enhanced Header Banner - Mobile optimized */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white">
        {/* Background elements - smaller for mobile */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 bg-white/2 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-purple-400/3 rounded-full blur-xl translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-1/3 w-14 h-14 sm:w-18 sm:h-18 bg-blue-400/2 rounded-full blur-xl translate-y-1/2"></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10"></div>
        
        <div className="relative py-4 sm:py-6 md:py-8 lg:py-10">
          <div className="container-mobile relative">
            <div className="max-w-4xl text-center mx-auto">
              {/* Mobile-optimized main heading */}
              <div className="mb-3 sm:mb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    Market Mind
                  </span>
                </h1>
              </div>
              
              {/* Mobile-optimized subtitle */}
              <div className="mb-4 sm:mb-6">
                <p className="text-blue-100/90 text-base sm:text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                  AI-Powered Insights för Stock Cases & Analyser
                </p>
                <p className="text-blue-200/70 text-sm md:text-base mt-2 max-w-xl mx-auto">
                  Upptäck smarta investeringsmöjligheter med AI-driven analys
                </p>
              </div>
              
              {/* Mobile-friendly status indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 bg-white/15 backdrop-blur-md rounded-full px-3 sm:px-5 py-2 border border-white/20 shadow-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-xs sm:text-sm font-semibold text-blue-50">Live Updates</span>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md rounded-full px-3 sm:px-5 py-2 border border-white/20">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
                  <span className="text-xs sm:text-sm font-medium text-blue-100">AI-Powered</span>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md rounded-full px-3 sm:px-5 py-2 border border-white/20">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300" />
                  <span className="text-xs sm:text-sm font-medium text-blue-100">Expert Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile-optimized bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg 
            viewBox="0 0 1200 60" 
            preserveAspectRatio="none" 
            className="relative block w-full h-3 sm:h-4 md:h-6"
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

      <div className="container-mobile -mt-1 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content Area - Mobile optimized */}
          <div className="lg:col-span-3 relative z-20">
            {/* Mobile-enhanced Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-1 sm:p-2 mb-6 sm:mb-8 relative z-30">
                <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-1 rounded-lg sm:rounded-xl">
                  <TabsTrigger 
                    value="cases" 
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline sm:hidden md:inline">Investment Cases</span>
                    <span className="xs:hidden sm:inline md:hidden">Cases</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analysis" 
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline sm:hidden md:inline">Analyser & Insights</span>
                    <span className="xs:hidden sm:inline md:hidden">Analyser</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="relative z-20">
                <TabsContent value="cases" className="space-mobile-y mt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                        Senaste Cases
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
                        Upptäck de hetaste investeringsmöjligheterna
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900 dark:to-blue-800 dark:text-blue-300 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-md self-start sm:self-auto"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                      Live Updates
                    </Badge>
                  </div>
                  <StockCasesFeed />
                </TabsContent>

                <TabsContent value="analysis" className="space-mobile-y mt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                        Community Analyser
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
                        Djupa analyser från våra experter
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900 dark:to-purple-800 dark:text-purple-300 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-md self-start sm:self-auto"
                    >
                      <Sparkles className="w-3 h-3 mr-2" />
                      Expert Insights
                    </Badge>
                  </div>
                  <AnalysisFeed />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right Sidebar - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:block lg:col-span-1 space-y-6 relative z-20">
            {user ? <UserInsightsPanel /> : <AIMarketingPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedLayout;
