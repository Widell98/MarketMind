
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, TrendingUp, Target, Zap, ArrowRight, BarChart3, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AIHeroSection = () => {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
      {/* Enhanced background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-32 h-32 lg:w-48 lg:h-48 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-40 h-40 lg:w-56 lg:h-56 bg-purple-400/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-1/3 w-36 h-36 lg:w-44 lg:h-44 bg-blue-400/8 rounded-full blur-3xl translate-y-1/2"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 lg:w-32 lg:h-32 bg-indigo-400/6 rounded-full blur-2xl"></div>
      </div>
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20 animate-pulse"></div>
      
      <div className="relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left side - Main content */}
            <div className="flex-1 text-center lg:text-left space-y-8">
              {/* AI Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-6 py-3 border border-white/20 shadow-lg">
                <Brain className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="text-sm font-semibold text-blue-100">AI-Powered Portfolio Management</span>
              </div>
              
              {/* Main heading */}
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    Din Personliga
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-yellow-300 via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    AI Portfolio Advisor
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl text-blue-100/90 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
                  Få smarta investeringsråd, personliga analyser och optimera din portfölj med avancerad AI-teknik
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto lg:mx-0">
                <div className="flex flex-col items-center lg:items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center lg:text-left">
                    <h3 className="font-semibold text-blue-100 mb-1">Smart Analys</h3>
                    <p className="text-sm text-blue-200/80">Realtids marknadsanalys</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center lg:items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center lg:text-left">
                    <h3 className="font-semibold text-blue-100 mb-1">Personlig Rådgivning</h3>
                    <p className="text-sm text-blue-200/80">Anpassat efter dina mål</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center lg:items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center lg:text-left">
                    <h3 className="font-semibold text-blue-100 mb-1">Riskhantering</h3>
                    <p className="text-sm text-blue-200/80">Optimerad portfoliobalans</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <Link to={user ? "/portfolio-advisor" : "/auth"}>
                    {user ? "Öppna AI Advisor" : "Kom igång gratis"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold px-8 py-4 text-lg transition-all duration-300"
                >
                  <Link to="#features">
                    Se funktioner
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10,000+</div>
                  <div className="text-sm text-blue-200">Analyser genererade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-sm text-blue-200">Nöjda användare</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm text-blue-200">AI-support</div>
                </div>
              </div>
            </div>

            {/* Right side - AI Demo/Preview */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                {/* Floating AI Chat Preview */}
                <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 transform">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">AI Portfolio Advisor</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Online nu
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-700">
                          "Baserat på din riskprofil rekommenderar jag en diversifierad portfölj med 60% aktier, 30% obligationer och 10% alternativa investeringar..."
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge className="bg-blue-100 text-blue-700">Portföljanalys</Badge>
                        <Badge className="bg-green-100 text-green-700">Rekommendationer</Badge>
                        <Badge className="bg-purple-100 text-purple-700">Riskbedömning</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-full h-8 sm:h-12 md:h-16 lg:h-20"
        >
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            opacity=".25" 
            className="fill-gray-50 dark:fill-gray-900"
          ></path>
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
            opacity=".5" 
            className="fill-gray-50 dark:fill-gray-900"
          ></path>
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            className="fill-gray-50 dark:fill-gray-900"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default AIHeroSection;
