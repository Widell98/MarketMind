
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, TrendingUp, Target, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIMarketingPanel = () => {
  return (
    <div className="space-y-6">
      {/* Main AI CTA */}
      <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 shadow-lg">
        <CardHeader className="text-center pb-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Portfolio Advisor
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Få personliga investeringsråd från avancerad AI
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Realtids marknadsanalys</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Personlig riskbedömning</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Optimerad portfoliofördelning</span>
            </div>
          </div>
          <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Link to="/auth">
              Kom igång gratis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Ingen kreditkort krävs • 5 gratis AI-analyser per dag
          </p>
        </CardContent>
      </Card>

      {/* AI Features Showcase */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            AI-Powered Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1">
                Prediktiv Analys
              </Badge>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              AI förutspår marknadsrörelser baserat på historisk data och realtids-signaler
            </p>
          </div>
          
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs px-2 py-1">
                Smart Rebalansering
              </Badge>
            </div>
            <p className="text-xs text-purple-800 dark:text-purple-300">
              Automatiska förslag för att optimera din portfoliobalans
            </p>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1">
                Risk Insights
              </Badge>
            </div>
            <p className="text-xs text-green-800 dark:text-green-300">
              Djup riskanalys med personliga rekommendationer
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Success Stories */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Community Framgångar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Anna P.</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                +23%
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              "AI-rådgivningen hjälpte mig diversifiera och minska risken"
            </p>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Marcus L.</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                +18%
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              "Prediktiva analysen gav mig självförtroende att investera"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIMarketingPanel;
