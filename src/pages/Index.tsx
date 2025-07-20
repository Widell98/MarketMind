
import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  BarChart3,
  Brain,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  PieChart,
  DollarSign
} from 'lucide-react';
import LatestCases from '@/components/LatestCases';
import FlashBriefs from '@/components/FlashBriefs';
import CurrentHoldingsPrices from '@/components/CurrentHoldingsPrices';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { latestCases, loading: casesLoading } = useLatestStockCases(3);

  // Quick stats for hero section
  const stats = [
    { 
      icon: TrendingUp, 
      label: 'Active Cases', 
      value: latestCases.length > 0 ? `${latestCases.length}+` : '0',
      color: 'text-green-600 dark:text-green-400'
    },
    { 
      icon: Users, 
      label: 'Community Members', 
      value: '150+',
      color: 'text-blue-600 dark:text-blue-400'
    },
    { 
      icon: Brain, 
      label: 'AI Insights', 
      value: '24/7',
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading Market Mentor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl border backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Market Mentor
              </h1>
              <Brain className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Din AI-drivna investeringspartner för smarta beslut och marknadsinsikter
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-background/50 backdrop-blur-sm border">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          {!user ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Logga in
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Skapa konto
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/ai-chat')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Brain className="w-5 h-5 mr-2" />
                AI Chat
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate('/portfolio-advisor')}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <PieChart className="w-5 h-5 mr-2" />
                Portfolio Advisor
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/stock-cases')}
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Stock Cases
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stock Cases & News */}
          <div className="lg:col-span-2 space-y-8">
            {/* Latest Stock Cases */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  Senaste Stock Cases
                </h2>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/stock-cases')}
                  className="hover:bg-primary/10 transition-colors"
                >
                  Visa alla
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <LatestCases />
            </div>

            {/* Flash Briefs */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                Marknadsinsikter
              </h2>
              <FlashBriefs />
            </div>
          </div>

          {/* Right Column - Portfolio & Holdings */}
          <div className="space-y-8">
            {/* Current Holdings */}
            <CurrentHoldingsPrices />

            {/* Quick Actions */}
            <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Snabbåtgärder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/portfolio-advisor')}
                  disabled={!user}
                >
                  <PieChart className="w-4 h-4 mr-2" />
                  Portfolio Advisor
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/ai-chat')}
                  disabled={!user}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Chat
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/watchlist')}
                  disabled={!user}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Watchlist
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/learning')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Lärande
                </Button>
                {!user && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Logga in för att använda alla funktioner
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
