
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserInsightsPanel = () => {
  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-500" />
            AI Portfolio Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Rebalansering Rekommenderad
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Din tech-exponering är 67%. Överväg att minska till 45-50% för bättre riskspridning.
            </p>
            <Button size="sm" variant="outline" className="text-xs" asChild>
              <Link to="/portfolio-advisor">Se detaljer</Link>
            </Button>
          </div>
          
          <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Stark Diversifiering
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Din sektorfördelning följer rekommenderat mönster för din riskprofil.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Din Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">+12.4%</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">YTD Return</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">6.2</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Risk Score</p>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">AI Confidence</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                Hög
              </Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              78% säkerhet i nuvarande allokering
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            Snabba Åtgärder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
            <Link to="/portfolio-advisor">
              <Brain className="w-4 h-4 mr-2" />
              Kör ny AI-analys
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
            <Link to="/stock-cases">
              <TrendingUp className="w-4 h-4 mr-2" />
              Utforska nya cases
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <Clock className="w-4 h-4 mr-2" />
            Schemalägg rebalansering
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Senaste Aktivitet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-2">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                Portfolio rebalanserad
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">2 dagar sedan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                Ny AI-insight genererad
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">3 dagar sedan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                Följde Evolution Gaming case
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">5 dagar sedan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserInsightsPanel;
