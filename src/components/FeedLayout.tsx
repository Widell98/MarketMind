
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
import AIHeroSection from './AIHeroSection';
import AIPreviewSection from './AIPreviewSection';

const FeedLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cases');

  return (
    <div className="mobile-viewport bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      {/* New AI Hero Section */}
      <AIHeroSection />

      {/* AI Features Preview Section */}
      <AIPreviewSection />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 xl:gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-3 relative z-20">
            {/* Enhanced Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl lg:rounded-2xl xl:rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-2 lg:p-3 xl:p-4 mb-6 lg:mb-10 xl:mb-12 relative z-30">
                <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-1.5 lg:p-2 rounded-lg lg:rounded-xl xl:rounded-2xl">
                  <TabsTrigger 
                    value="cases" 
                    className="flex items-center gap-2 sm:gap-3 lg:gap-4 px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 lg:py-5 xl:py-6 rounded-lg lg:rounded-xl xl:rounded-2xl text-sm sm:text-base lg:text-lg xl:text-xl font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    <span className="hidden xs:inline sm:hidden md:inline">Investment Cases</span>
                    <span className="xs:hidden sm:inline md:hidden">Cases</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analysis" 
                    className="flex items-center gap-2 sm:gap-3 lg:gap-4 px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 lg:py-5 xl:py-6 rounded-lg lg:rounded-xl xl:rounded-2xl text-sm sm:text-base lg:text-lg xl:text-xl font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    <span className="hidden xs:inline sm:hidden md:inline">Analyser & Insights</span>
                    <span className="xs:hidden sm:inline md:hidden">Analyser</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="relative z-20">
                <TabsContent value="cases" className="space-y-6 lg:space-y-8 xl:space-y-10 mt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 xl:mb-10 gap-4 lg:gap-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2 lg:mb-3">
                        Senaste Cases
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-base lg:text-lg xl:text-xl">
                        Upptäck de hetaste investeringsmöjligheterna
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900 dark:to-blue-800 dark:text-blue-300 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 text-sm lg:text-base xl:text-lg font-semibold shadow-md self-start sm:self-auto"
                    >
                      <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-blue-500 rounded-full mr-2 lg:mr-3 animate-pulse"></div>
                      Live Updates
                    </Badge>
                  </div>
                  <StockCasesFeed />
                </TabsContent>

                <TabsContent value="analysis" className="space-y-6 lg:space-y-8 xl:space-y-10 mt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 xl:mb-10 gap-4 lg:gap-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2 lg:mb-3">
                        Community Analyser
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-base lg:text-lg xl:text-xl">
                        Djupa analyser från våra experter
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900 dark:to-purple-800 dark:text-purple-300 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 text-sm lg:text-base xl:text-lg font-semibold shadow-md self-start sm:self-auto"
                    >
                      <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 mr-2 lg:mr-3" />
                      Expert Insights
                    </Badge>
                  </div>
                  <AnalysisFeed />
                </TabsContent>
              </div>
            </Tabs>

            {/* Mobile AI Components Section */}
            <div className="lg:hidden mt-8 space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  AI Insights & Verktyg
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Personliga AI-drivna insikter för din portfölj
                </p>
              </div>
              {user ? <UserInsightsPanel /> : <AIMarketingPanel />}
            </div>
          </div>

          {/* Desktop Right Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-6 lg:space-y-8 xl:space-y-10 relative z-20">
            {user ? <UserInsightsPanel /> : <AIMarketingPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedLayout;
