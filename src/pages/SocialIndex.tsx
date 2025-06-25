
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SocialFeed from '@/components/SocialFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, BookOpen, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import LatestCases from '@/components/LatestCases';
import TrendingCases from '@/components/TrendingCases';

const SocialIndex = () => {
  const { user } = useAuth();

  if (!user) {
    // Show landing page for non-authenticated users
    return (
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
            Investera smartare med{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              community
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Upptäck investeringsmöjligheter, dela insikter och lär av andra investerare i vår community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link to="/auth">Kom igång gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/stock-cases">Utforska Cases</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Investerings Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Utforska kurerade investeringsmöjligheter och analysera aktier tillsammans med communityn
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Community Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Dela dina investeringsinsikter och lär av andra erfarna investerare
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>AI-Portfölj Rådgivning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Få personlig portfölj-rådgivning från AI och dela dina resultat med communityn
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Latest Cases Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Senaste Investeringscases
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upptäck de senaste analyserade investeringsmöjligheterna
            </p>
          </div>
          <LatestCases />
        </div>

        {/* Trending Cases Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Populära Cases
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Se vilka investeringscases som är mest populära just nu
            </p>
          </div>
          <TrendingCases />
        </div>
      </div>
    );
  }

  // Show social feed for authenticated users
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4 py-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Ditt Community Flöde
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Håll dig uppdaterad med insikter från personer du följer
            </p>
          </div>
        </div>
      </div>

      {/* Social Feed */}
      <SocialFeed />
    </div>
  );
};

export default SocialIndex;
