import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles, TrendingUp, Brain, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedLayout from '@/components/FeedLayout';
import Layout from '@/components/Layout';

const SocialIndex = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate('/ai-chat');
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-20 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              {/* Main Headline */}
              <div className="flex items-center justify-center mb-6">
                <Brain className="w-12 h-12 mr-4 text-blue-300 animate-pulse" />
                <Sparkles className="w-8 h-8 text-yellow-300 animate-bounce" />
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent animate-fade-in">
                AI-Driven
                <span className="block text-gradient bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text">
                  Investment Intelligence
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl mb-8 text-blue-100 font-light leading-relaxed animate-slide-up">
                Upplev framtidens investering med vår avancerade AI-assistent. 
                <br className="hidden lg:block" />
                Få personliga råd, marknadsanalyser och smarta investeringsstrategier.
              </p>
              
              {/* AI Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <MessageCircle className="w-8 h-8 text-blue-300 mb-3 mx-auto" />
                  <h3 className="font-semibold mb-2">Smart Konversation</h3>
                  <p className="text-sm text-blue-100">Chatta naturligt med AI:n om dina investeringar</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <TrendingUp className="w-8 h-8 text-green-300 mb-3 mx-auto" />
                  <h3 className="font-semibold mb-2">Marknadsanalys</h3>
                  <p className="text-sm text-blue-100">Realtidsanalyser och trender</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <Zap className="w-8 h-8 text-yellow-300 mb-3 mx-auto" />
                  <h3 className="font-semibold mb-2">Personliga Råd</h3>
                  <p className="text-sm text-blue-100">Skräddarsydda investeringsförslag</p>
                </div>
              </div>
              
              {/* CTA Button */}
              <Button 
                onClick={handleStartChat}
                size="lg" 
                className="bg-white text-primary hover:bg-blue-50 text-lg px-8 py-6 rounded-2xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
              >
                <MessageCircle className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                Starta AI-Chat Nu
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <p className="mt-4 text-blue-200 text-sm">
                {user ? 'Välkommen tillbaka!' : 'Gratis att komma igång'} ✨
              </p>
            </div>
          </div>
          
          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Rest of the homepage content */}
        <FeedLayout />
      </div>
    </Layout>
  );
};

export default SocialIndex;
