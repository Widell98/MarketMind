
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, MessageSquare, BarChart3, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SocialIndex = () => {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section with Dark Background */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <Brain className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Din AI-drivna
            <span className="block text-blue-400">Investeringsrådgivare</span>
          </h1>
          
          <p className="text-xl sm:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Få personlig vägledning för dina investeringar med hjälp av avancerad AI. 
            Analysera marknaden, optimera din portfölj och fatta smarta investeringsbeslut.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <>
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                  <Link to="/ai-chat">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Starta AI-chatt
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg">
                  <Link to="/portfolio-advisor">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Portföljrådgivning
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                  <Link to="/auth">
                    Kom igång gratis
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg">
                  <Link to="/learning">
                    Läs mer
                  </Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Brain className="w-12 h-12 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">AI-analys</h3>
              <p className="text-gray-300 text-sm">Avancerad AI analyserar marknaden åt dig</p>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Riskhantering</h3>
              <p className="text-gray-300 text-sm">Intelligent riskbedömning för dina investeringar</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-12 h-12 text-yellow-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Realtidsdata</h3>
              <p className="text-gray-300 text-sm">Aktuell marknadsdata och prisuppdateringar</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secondary Content Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Allt du behöver för smarta investeringar
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Market Mind kombinerar AI-teknologi med finansiell expertis för att ge dig de bästa verktygen för dina investeringsbeslut.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>AI-chatt</CardTitle>
                <CardDescription>
                  Få personlig rådgivning från vår AI-assistent som förstår dina investeringsmål
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={user ? "/ai-chat" : "/auth"}>
                    {user ? "Starta chatt" : "Kom igång"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-green-600 mb-2" />
                <CardTitle>Portföljanalys</CardTitle>
                <CardDescription>
                  Analysera och optimera din portfölj med AI-drivna insikter och rekommendationer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={user ? "/portfolio-advisor" : "/auth"}>
                    {user ? "Analysera portfölj" : "Kom igång"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-purple-600 mb-2" />
                <CardTitle>Marknadsinsikter</CardTitle>
                <CardDescription>
                  Håll dig uppdaterad med de senaste trenderna och möjligheterna på marknaden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={user ? "/stock-cases" : "/auth"}>
                    {user ? "Utforska marknaden" : "Kom igång"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SocialIndex;
