
import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  MessageSquare,
  ArrowRight,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const { riskProfile } = useRiskProfile();

  const aiFeatures = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Intelligent Portfolio Analys",
      description: "AI analyserar din portfölj i realtid och föreslår optimeringar baserat på marknadsdata",
      action: "Analysera nu",
      href: "/ai-chat?message=Analysera min portfölj",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Smart Investment Chat",
      description: "Chatta med vår AI-rådgivare för personliga investeringsråd och marknadsinsikter",
      action: "Starta chat",
      href: "/ai-chat",
      gradient: "from-green-500 to-teal-600"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Prediktiv Marknadsanalys",
      description: "AI identifierar trender och möjligheter innan de blir mainstream",
      action: "Se insikter",
      href: "/ai-chat?message=Vad händer på marknaden?",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const quickActions = [
    { 
      title: "Skapa Riskprofil", 
      description: "Låt AI hjälpa dig skapa en personlig investeringsstrategi",
      href: "/portfolio-advisor",
      icon: <Target className="w-5 h-5" />,
      available: !riskProfile
    },
    { 
      title: "AI Portfolio Chat", 
      description: "Få intelligent rådgivning om dina investeringar",
      href: "/ai-chat",
      icon: <Brain className="w-5 h-5" />,
      available: true
    },
    { 
      title: "Portföljöversikt", 
      description: "Se din portfölj med AI-drivna insights",
      href: "/portfolio-implementation",
      icon: <BarChart3 className="w-5 h-5" />,
      available: !!user
    },
    { 
      title: "Marknadsanalys", 
      description: "Upptäck nya investeringsmöjligheter",
      href: "/stock-cases",
      icon: <Activity className="w-5 h-5" />,
      available: true
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 lg:py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50/50 to-purple-50/30 dark:from-primary/10 dark:via-blue-950/20 dark:to-purple-950/10"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white border-0 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Driven Investment Platform
                  </Badge>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Intelligent Investing
                  </span>
                  <br />
                  <span className="text-foreground">Med AI som Guide</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Upptäck framtidens investeringsplattform där artificiell intelligens hjälper dig 
                  att fatta smartare finansiella beslut och bygga en robust portfölj.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  asChild
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Link to="/ai-chat" className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Starta AI-Chat
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                
                {!user && (
                  <Button 
                    asChild
                    variant="outline" 
                    size="lg"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Link to="/auth">
                      Skapa Konto Gratis
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* AI Features Grid */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                AI-Drivna <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Investeringsverktyg</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upplev nästa generation av investeringsrådgivning med våra intelligenta AI-verktyg
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {aiFeatures.map((feature, index) => (
                <Card key={index} className="group relative overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <CardHeader className="text-center space-y-4">
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="text-center space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    <Button 
                      asChild
                      className="w-full group-hover:shadow-lg transition-all duration-300"
                      variant="outline"
                    >
                      <Link to={feature.href} className="flex items-center justify-center gap-2">
                        {feature.action}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Kom igång direkt</h2>
              <p className="text-xl text-muted-foreground">Välj vad du vill göra härnäst</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.filter(action => action.available).map((action, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="w-full">
                      <Link to={action.href}>
                        Börja här
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-950/20 rounded-3xl p-8 lg:p-12 space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Redo att börja investera <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">smartare?</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Låt vår AI-assistent guida dig genom investeringsresan och hjälpa dig bygga en framgångsrik portfölj.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link to="/ai-chat" className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chatta med AI nu
                  </Link>
                </Button>
                
                {!riskProfile && user && (
                  <Button 
                    asChild
                    variant="outline" 
                    size="lg"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Link to="/portfolio-advisor">
                      Skapa din profil
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
