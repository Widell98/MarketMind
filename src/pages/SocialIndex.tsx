
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FeedLayout from '@/components/FeedLayout';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, TrendingUp, Target, Zap, ArrowRight, BarChart3, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const SocialIndex = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <Layout>
        <FeedLayout />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
            <div className="text-center space-y-8">
              {/* Main AI Icon */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
                    <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                    <Sparkles className="w-4 h-4 text-yellow-800" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  Market Mind
                </h1>
                <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-700 dark:text-gray-300">
                  Din AI-drivna investeringspartner
                </p>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  Avancerad artificiell intelligens som analyserar marknaden, ger personliga råd och hjälper dig bygga den perfekta portföljen
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Link to="/auth">
                    Starta din AI-resa
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-4 text-lg font-semibold"
                >
                  <Link to="/ai-chat">
                    Testa AI-chatten
                    <Brain className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Säker & Krypterad</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>10,000+ Användare</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span>Realtidsdata</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Features Showcase */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900 dark:to-purple-900 dark:text-blue-200 text-lg px-6 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Artificiell Intelligens som 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Förstår Marknaden</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Chat Feature */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-blue-100 dark:border-blue-800">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">AI Portfolio Advisor</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Chatta med vår avancerade AI som analyserar din portfölj och ger personliga investeringsråd baserat på din riskprofil.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Realtids marknadsanalys
                </li>
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Personliga rekommendationer
                </li>
              </ul>
            </div>

            {/* Market Insights */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-purple-100 dark:border-purple-800">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">AI Market Insights</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Få dagliga AI-genererade insikter om marknaden, trender och möjligheter som passar din investeringsstrategi.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  Prediktiv analys
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Automatiska varningar
                </li>
              </ul>
            </div>

            {/* Risk Assessment */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-green-100 dark:border-green-800 md:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">AI Risk Assessment</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Låt AI:n analysera din riskprofil och optimera din portfölj för bästa möjliga risk-avkastning balans.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-500" />
                  Riskoptimering
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Scenarioanalys
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Redo att revolutionera dina investeringar?
            </h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Gå med i tusentals investerare som redan använder AI för att maximera sin avkastning
            </p>
            <Button 
              asChild 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <Link to="/auth">
                Kom igång gratis idag
                <ArrowRight className="w-6 h-6 ml-3" />
              </Link>
            </Button>
            <p className="text-blue-200 mt-6 text-sm">
              Ingen kreditkort krävs • 5 gratis AI-analyser per dag • Avsluta när som helst
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SocialIndex;
