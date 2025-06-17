
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Target, TrendingUp, Sparkles, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModernHero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-gradient-x"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative container-responsive py-16 md:py-24 lg:py-32">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-blue-200/50 dark:border-blue-800/50 shadow-lg animate-fade-in">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI-Powered Investment Learning
            </span>
          </div>

          {/* Main heading with gradient text */}
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Master the{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                  Stock Market
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-30"></div>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Learn through <span className="font-semibold text-blue-600 dark:text-blue-400">real cases</span>, 
              follow <span className="font-semibold text-purple-600 dark:text-purple-400">trending investments</span>, 
              and build your financial knowledge with our{' '}
              <span className="font-semibold text-pink-600 dark:text-pink-400">interactive platform</span>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in-left">
            <Button 
              size="lg" 
              onClick={() => navigate('/stock-cases')}
              className="relative group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              <BookOpen className="w-5 h-5 mr-2" />
              <span className="relative">Explore Cases</span>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/learning')}
              className="group border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 px-8 py-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 transform hover:scale-105"
            >
              <Target className="w-5 h-5 mr-2 group-hover:text-blue-600 transition-colors" />
              <span className="group-hover:text-blue-600 transition-colors">Start Learning</span>
            </Button>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 animate-scale-in">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Stock Cases</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">50K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHero;
