
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BookOpen, Users, Brain, Zap, Calendar, Clock, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StockCasesFeed from './StockCasesFeed';
import AnalysisFeed from './AnalysisFeed';
import AIMarketingPanel from './AIMarketingPanel';
import UserInsightsPanel from './UserInsightsPanel';
import LatestCases from './LatestCases';
import TrendingCases from './TrendingCases';

const FeedLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cases');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-8 mb-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Research Powered Investment Community
            </h1>
            <p className="text-blue-100 text-lg">
              De senaste insikterna om svenska tech & life science bolag
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="cases" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Investment Cases
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Analyser & Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cases" className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Senaste Cases
                  </h2>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Live Updates
                  </Badge>
                </div>
                <StockCasesFeed />
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Community Analyser
                  </h2>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
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

            {/* Market Activity Panel */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Senaste Aktivitet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Q4 2024/25 Research Update
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Biovica International • Avslutad 2025-06-21
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Q4 2024/25 Research Note
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Biovica International • Avslutad 2025-06-20
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      AI Portfolio Analysis
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatisk uppdatering • 2 tim sedan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events Panel */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  Kommande Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Live Q: Tradedoubler
                    </p>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Jul 18 • 10:00-11:00
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      AI Portfolio Review
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Imorgon • 14:00
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-500" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Aktiva Cases</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Denna vecka</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">+12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Analyser</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">156</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedLayout;
