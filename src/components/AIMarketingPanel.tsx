
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, TrendingUp, Target, Sparkles, ArrowRight, Crown, Building2, Tag, BarChart3, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIMarketingPanel = () => {
  return (
    <div className="space-y-6">
      {/* Main AI CTA - Enhanced */}
      <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <CardHeader className="text-center pb-3 relative">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Portfolio Advisor
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Få personliga investeringsråd från avancerad AI
          </p>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg backdrop-blur-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Realtids marknadsanalys</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg backdrop-blur-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Personlig riskbedömning</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg backdrop-blur-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Optimerad portfoliofördelning</span>
            </div>
          </div>
          
          <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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

      {/* AI Features Showcase - Enhanced */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
            AI-Powered Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1">
                Marknadsanalys
              </Badge>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              AI förutspår marknadsrörelser baserat på historisk data och realtids-signaler
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs px-2 py-1">
                Smart Rebalansering
              </Badge>
            </div>
            <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
              Automatiska förslag för att optimera din portfoliobalans
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1">
                Riskhantering
              </Badge>
            </div>
            <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
              Djup riskanalys med personliga rekommendationer
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">AI i siffror</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Våra resultat talar för sig själva</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">10K+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Analyser</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">95%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Precision</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Övervakning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">5K+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Användare</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIMarketingPanel;
