
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BookOpen, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StockCasesFeed from './StockCasesFeed';
import AnalysisFeed from './AnalysisFeed';
import AIMarketingPanel from './AIMarketingPanel';
import UserInsightsPanel from './UserInsightsPanel';

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
