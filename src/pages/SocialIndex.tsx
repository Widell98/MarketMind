
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import Layout from '@/components/Layout';
import CommunityStats from '@/components/CommunityStats';
import AnalysisSection from '@/components/AnalysisSection';
import LatestCases from '@/components/LatestCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SocialIndex = () => {
  const { user } = useAuth();
  const { riskProfile } = useRiskProfile();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Your AI Advisor */}
            <div className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Your AI advisor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user && riskProfile ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Here are some stocks that fit your risk profile.
                      </p>
                      <LatestCases limit={3} showHeader={false} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Get personalized AI advice
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Create your risk profile to get personalized stock recommendations
                      </p>
                      <Button 
                        onClick={() => navigate('/portfolio-advisor')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create Risk Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Community Stats */}
              <CommunityStats />
            </div>

            {/* Right Column - Community */}
            <div className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Users className="w-5 h-5 text-green-600" />
                    Community
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Latest analyses
                      </h3>
                    </div>
                    <AnalysisSection limit={5} showHeader={false} />
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Discussion Theme */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                        Weekly discussion theme
                      </div>
                      <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                        Tech vs. Energy — which do you prefer?
                      </h4>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        w. 52
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 border-green-200 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
                    onClick={() => navigate('/stock-cases')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Create new post
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SocialIndex;
