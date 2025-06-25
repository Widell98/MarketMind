
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, TrendingUp, Target, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import MarketOverview from './MarketOverview';

const AIMarketingPanel = () => {
  return (
    <div className="space-y-6">
      {/* AI Marketing Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-500" />
            AI-Driven Portfolio Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                  Personaliserad AI-Rådgivning
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Få skräddarsydd investeringsrådgivning baserad på din riskprofil och mål
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                  Realtidsanalys
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Kontinuerlig övervakning och optimering av din portfölj
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                  Målinriktad Strategi
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  AI-optimerade strategier för att nå dina finansiella mål
                </p>
              </div>
            </div>
          </div>
          
          <Button className="w-full" size="sm" asChild>
            <Link to="/auth">
              <Zap className="w-4 h-4 mr-2" />
              Kom igång med AI-rådgivning
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <MarketOverview />

      {/* Community Stats */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            Community Aktivitet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Aktiva Användare</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              2,847
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Nya Cases Idag</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              14
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Expert Analyser</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
              7
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIMarketingPanel;
