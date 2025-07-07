
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
        {/* Enhanced Hero Section */}
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

        {/* Original Features Section */}
        <div className="py-24 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Allt du behöver för att lyckas med dina investeringar
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Från nybörjare till expert - vi har verktygen som hjälper dig växa
              </p>
            </div>

            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h5 className="text-lg font-medium text-gray-900 dark:text-white">Marknadsanalys</h5>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Djupgående analyser av aktier och marknaden för att hjälpa dig fatta rätt beslut.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mx-auto">
                  <Target className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h5 className="text-lg font-medium text-gray-900 dark:text-white">Portföljrådgivning</h5>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Personlig rådgivning baserad på din riskprofil och investeringsmål.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white mx-auto">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h5 className="text-lg font-medium text-gray-900 dark:text-white">Lärande</h5>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Interaktiva kurser och quiz för att utveckla dina investeringskunskaper.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Redo att börja?</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-blue-200">
              Gå med idag och ta kontroll över dina investeringar med hjälp av AI och expertrådgivning.
            </p>
            <Button 
              asChild 
              size="lg"
              className="mt-8 bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              <Link to="/auth">
                Kom igång nu
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SocialIndex;
