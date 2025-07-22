
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, Bookmark, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';
import PersonalizedAIRecommendations from '@/components/PersonalizedAIRecommendations';
import StockCasesFeed from '@/components/StockCasesFeed';
import SavedOpportunitiesSection from '@/components/SavedOpportunitiesSection';
import { useNavigate } from 'react-router-dom';

const DiscoverOpportunities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discover');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Upptäck Nya Möjligheter
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            AI-driven investeringsmöjligheter baserat på din portfölj och marknadstrender
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Upptäck</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Sparade</span>
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Bläddra</span>
            </TabsTrigger>
          </TabsList>

          {/* Upptäck Tab */}
          <TabsContent value="discover" className="space-y-8">
            {user ? (
              <>
                {/* AI Weekly Picks */}
                <AIWeeklyPicks />

                {/* Stock Cases Feed */}
                <StockCasesFeed />
              </>
            ) : (
              <Card className="text-center py-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <CardContent className="pt-4">
                  <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <CardTitle className="text-xl mb-2">Få AI-Powered Rekommendationer</CardTitle>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Logga in för att få skräddarsydda investeringsmöjligheter med AI-analys baserat på din portfölj och marknadstrender.
                  </p>
                  <Button onClick={() => navigate('/auth')} className="bg-purple-600 hover:bg-purple-700">
                    Logga in för AI-rekommendationer
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sparade Tab */}
          <TabsContent value="saved" className="space-y-6">
            {user ? (
              <SavedOpportunitiesSection 
                opportunities={[]}
                onRemove={() => {}}
                onView={() => {}}
                loading={false}
              />
            ) : (
              <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800">
                <CardContent className="pt-4">
                  <Bookmark className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <CardTitle className="text-lg mb-2">Logga in för att spara möjligheter</CardTitle>
                  <p className="text-sm text-muted-foreground mb-4">
                    Skapa ett konto för att spara intressanta aktiefall och analyser.
                  </p>
                  <Button onClick={() => navigate('/auth')} variant="outline">
                    Logga in
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bläddra Tab */}
          <TabsContent value="browse" className="space-y-6">
            <StockCasesFeed showFilters={true} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DiscoverOpportunities;
