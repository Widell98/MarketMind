
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FeedLayout from '@/components/FeedLayout';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, Zap, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SocialIndex = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen">
        {/* AI-Focused Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-32 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-lg animate-bounce"></div>
            <div className="absolute bottom-20 left-32 w-40 h-40 bg-cyan-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
            <div className="absolute bottom-40 right-16 w-28 h-28 bg-pink-500/20 rounded-full blur-xl animate-bounce delay-1000"></div>
          </div>
          
          {/* Floating AI Icons */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 animate-float">
              <Brain className="w-8 h-8 text-cyan-400/40" />
            </div>
            <div className="absolute top-1/3 right-1/3 animate-float delay-500">
              <Sparkles className="w-6 h-6 text-purple-400/40" />
            </div>
            <div className="absolute bottom-1/3 left-1/5 animate-float delay-1000">
              <Zap className="w-7 h-7 text-blue-400/40" />
            </div>
          </div>

          <div className="relative z-10 container mx-auto px-4 py-20 text-center">
            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI-Powered
                </span>
                <br />
                <span className="text-white">Investment Intelligence</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-4xl mx-auto animate-fade-in delay-300">
                Upptäck framtidens investeringsanalys med avancerad AI som transformerar marknadsdata till kraftfulla insikter
              </p>
              <p className="text-lg text-purple-200 max-w-3xl mx-auto animate-fade-in delay-500">
                Få personliga AI-rekommendationer, realtidsanalys och intelligenta portföljinsikter
              </p>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in delay-700">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">AI-Driven Insights</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Real-time Analysis</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Smart Portfolio</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="animate-fade-in delay-1000">
              <Button 
                onClick={() => navigate('/ai-chat')}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 border-0"
              >
                <MessageSquare className="w-6 h-6 mr-2" />
                Starta AI-Chat Nu
              </Button>
            </div>

            {/* AI Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto animate-fade-in delay-1200">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Brain className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Intelligent Analys</h3>
                <p className="text-blue-200 text-sm">AI processar marknadsdata och ger dig personliga investeringsinsikter</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Realtids AI-Chat</h3>
                <p className="text-blue-200 text-sm">Chatta med vår AI för omedelbara svar på dina investeringsfrågor</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <TrendingUp className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Prediktiv Analys</h3>
                <p className="text-blue-200 text-sm">Avancerade AI-modeller förutspår marknadstrender och möjligheter</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <FeedLayout />
      </div>
    </Layout>
  );
};

export default SocialIndex;
