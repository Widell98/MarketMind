import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageSquare, Sparkles, TrendingUp, Brain, Zap, ArrowRight } from 'lucide-react';
import FeedLayout from '@/components/FeedLayout';
import Layout from '@/components/Layout';

const SocialIndex = () => {
  const { user } = useAuth();

  return (
    <Layout>
      {/* AI-Focused Hero Section */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-finance-navy via-finance-blue to-finance-lightBlue">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-finance-skyBlue/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        {/* Floating AI Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 animate-float">
            <Brain className="w-8 h-8 text-white/30" />
          </div>
          <div className="absolute top-32 right-32 animate-float delay-1000">
            <Sparkles className="w-6 h-6 text-white/40" />
          </div>
          <div className="absolute bottom-40 left-40 animate-float delay-2000">
            <Zap className="w-7 h-7 text-white/35" />
          </div>
          <div className="absolute bottom-32 right-20 animate-float delay-1500">
            <TrendingUp className="w-8 h-8 text-white/30" />
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">AI-Powered Investment Intelligence</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Din AI-assistent för
            <span className="block bg-gradient-to-r from-white to-finance-skyBlue bg-clip-text text-transparent">
              smarta investeringar
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Få personliga råd, analysera marknaden och ta bättre investeringsbeslut med hjälp av avancerad AI-teknologi
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-finance-navy hover:bg-white/90 font-semibold px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link to="/ai-chat" className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Starta AI-chatt
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link to="/stock-cases">
                Utforska aktiefall
              </Link>
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <Brain className="w-8 h-8 text-white mb-4 mx-auto" />
              <h3 className="font-semibold text-white mb-2">AI-Analys</h3>
              <p className="text-white/70 text-sm">Få djupa marknadsinsikter med AI-driven analys</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <TrendingUp className="w-8 h-8 text-white mb-4 mx-auto" />
              <h3 className="font-semibold text-white mb-2">Personliga Råd</h3>
              <p className="text-white/70 text-sm">Skräddarsydda investeringsförslag baserat på din profil</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <Sparkles className="w-8 h-8 text-white mb-4 mx-auto" />
              <h3 className="font-semibold text-white mb-2">Realtidsdata</h3>
              <p className="text-white/70 text-sm">Alltid uppdaterad marknadsinformation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Feed Layout */}
      <FeedLayout />
    </Layout>
  );
};

export default SocialIndex;
