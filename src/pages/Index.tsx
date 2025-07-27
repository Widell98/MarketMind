import React from 'react';
import Layout from '@/components/Layout';
import { Brain, UserPlus, BarChart3, MessageSquare, Target, Zap, Star, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import CompactLatestCases from '@/components/CompactLatestCases';

const Index = () => {
  const { user } = useAuth();
  const { activePortfolio, loading } = usePortfolio();

  const hasPortfolio = !loading && !!activePortfolio;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1200px]">
          
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Skapa din AI-drivna portfölj
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-3xl mx-auto">
              {!user 
                ? "Få personliga investeringsråd och upptäck nya möjligheter med vår AI-assistent. Börja din investeringsresa idag." 
                : hasPortfolio 
                ? "Välkommen tillbaka! Använd AI-chatten och communityn för att förbättra din portfölj."
                : "Skapa din första portfölj och få AI-drivna rekommendationer baserat på dina mål."
              }
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* Portfolio Card */}
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    {user && hasPortfolio ? <BarChart3 className="w-6 h-6 text-primary" /> : <User className="w-6 h-6 text-primary" />}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {user && hasPortfolio ? "Min Portfölj" : "Skapa Portfölj"}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {user && hasPortfolio 
                    ? "Hantera och analysera dina investeringar. Se prestanda och få rekommendationer."
                    : "Bygg din personliga investeringsportfölj med AI-vägledning baserat på dina mål och riskprofil."
                  }
                </p>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link to={user && hasPortfolio ? "/profile" : user ? "/portfolio-advisor" : "/auth"}>
                    {user && hasPortfolio ? "Visa portfölj" : user ? "Skapa nu" : "Kom igång"}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* AI Chat Card */}
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Brain className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">AI-Assistent</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Få personliga investeringsråd, analys av aktier och svar på alla dina investeringsfrågor från vår AI.
                </p>
                <Button asChild variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white">
                  <Link to="/ai-chat">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chatta med AI
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Community Card */}
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <Target className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Upptäck Aktier</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Utforska aktiefall från communityn och hitta nya investeringsmöjligheter att lägga till i din portfölj.
                </p>
                <Button asChild variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-500 hover:text-white">
                  <Link to="/stock-cases">
                    Utforska aktier
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Latest Cases */}
          <CompactLatestCases />

          {/* Social proof for non-logged in users */}
          {!user && (
            <div className="text-center mt-12 py-8 border-t border-border">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 border-2 border-background flex items-center justify-center">
                        <Star className="w-3 h-3 text-primary" />
                      </div>
                    ))}
                  </div>
                  <span>1000+ aktiva investerare</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span>AI-driven analys</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Gratis att komma igång</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
