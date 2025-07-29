
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Navigation, 
  ArrowRight, 
  Sparkles,
  Home,
  TrendingUp,
  PieChart,
  User,
  BarChart3,
  Target,
  LineChart,
  FileText,
  Users,
  BookOpen,
  Star,
  Edit3,
  Plus,
  Search,
  UserPlus
} from 'lucide-react';

interface SmartRoute {
  path: string;
  title: string;
  description: string;
  icon: any;
  reason: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  category: 'getting_started' | 'portfolio' | 'analysis' | 'learning' | 'community';
}

interface IntelligentRoutingProps {
  hasPortfolio?: boolean;
  hasAnalyses?: boolean;
  hasStockCases?: boolean;
  userRegistrationDays?: number;
}

const IntelligentRouting = ({ 
  hasPortfolio = false, 
  hasAnalyses = false, 
  hasStockCases = false, 
  userRegistrationDays = 0 
}: IntelligentRoutingProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const getSmartRoutes = (): SmartRoute[] => {
    const currentPath = location.pathname;
    const routes: SmartRoute[] = [];
    const isNewUser = userRegistrationDays <= 7;
    const isVeryNewUser = userRegistrationDays <= 1;

    // For users not logged in - focus on getting started
    if (!user) {
      routes.push({
        path: '/auth',
        title: 'Kom igång gratis',
        description: 'Skapa konto för att få personliga AI-råd och bygga din portfölj',
        icon: UserPlus,
        reason: 'Första steget för att komma igång',
        confidence: 0.95,
        priority: 'high',
        category: 'getting_started'
      });

      routes.push({
        path: '/ai-chat',
        title: 'Testa AI-assistenten',
        description: 'Ställ frågor om investeringar utan att behöva skapa konto',
        icon: Brain,
        reason: 'Testa plattformen först',
        confidence: 0.85,
        priority: 'medium',
        category: 'getting_started'
      });

      routes.push({
        path: '/stock-cases',
        title: 'Utforska community',
        description: 'Se vad andra investerare diskuterar och analyserar',
        icon: Users,
        reason: 'Lär dig av andra investerare',
        confidence: 0.8,
        priority: 'medium',
        category: 'community'
      });

      return routes.sort((a, b) => b.confidence - a.confidence);
    }

    // For very new users (first day) - focus on essential first steps
    if (isVeryNewUser) {
      if (!hasPortfolio) {
        routes.push({
          path: '/portfolio-advisor',
          title: 'Skapa din första portfölj',
          description: 'Börja med att bygga en diversifierad investeringsportfölj',
          icon: PieChart,
          reason: 'Första viktiga steget för nya användare',
          confidence: 0.95,
          priority: 'high',
          category: 'getting_started'
        });
      }

      routes.push({
        path: '/ai-chat',
        title: 'Få personlig AI-rådgivning',
        description: 'Diskutera dina investeringsmål med AI-assistenten',
        icon: Brain,
        reason: 'Perfekt för att komma igång',
        confidence: 0.9,
        priority: 'high',
        category: 'getting_started'
      });

      routes.push({
        path: '/stock-cases',
        title: 'Lär dig av community',
        description: 'Utforska hur andra investerare tänker och analyserar',
        icon: BookOpen,
        reason: 'Bra för att lära sig grunderna',
        confidence: 0.8,
        priority: 'medium',
        category: 'learning'
      });
    }

    // For new users (within a week) - guide through key features
    if (isNewUser && !isVeryNewUser) {
      if (!hasAnalyses) {
        routes.push({
          path: '/market-analyses',
          title: 'Skapa din första analys',
          description: 'Dela dina investeringsinsikter med communityn',
          icon: Edit3,
          reason: 'Nästa steg för att engagera dig i communityn',
          confidence: 0.9,
          priority: 'high',
          category: 'analysis'
        });
      }

      if (!hasStockCases) {
        routes.push({
          path: '/stock-cases',
          title: 'Skapa ett aktiecase',
          description: 'Presentera en investeringsidé för communityn',
          icon: Plus,
          reason: 'Dela dina investeringsidéer',
          confidence: 0.85,
          priority: 'high',
          category: 'community'
        });
      }

      if (hasPortfolio) {
        routes.push({
          path: '/portfolio-implementation',
          title: 'Analysera din portfölj',
          description: 'Få AI-driven analys av din portföljs prestanda',
          icon: BarChart3,
          reason: 'Optimera din befintliga portfölj',
          confidence: 0.8,
          priority: 'medium',
          category: 'portfolio'
        });
      }
    }

    // Page-specific recommendations
    if (currentPath === '/') {
      if (hasPortfolio) {
        if (!hasAnalyses) {
          routes.push({
            path: '/market-analyses',
            title: 'Skapa din första analys',
            description: 'Dela dina investeringsinsikter och få feedback',
            icon: FileText,
            reason: 'Du har portfölj men inga analyser ännu',
            confidence: 0.9,
            priority: 'high',
            category: 'analysis'
          });
        }

        routes.push({
          path: '/portfolio-implementation',
          title: 'Analysera din portfölj',
          description: 'Se djupgående analys av dina innehav och prestanda',
          icon: BarChart3,
          reason: 'Din portfölj behöver regelbunden analys',
          confidence: 0.85,
          priority: 'medium',
          category: 'portfolio'
        });
        
        routes.push({
          path: '/ai-chat',
          title: 'Få AI-optimering',
          description: 'Diskutera portföljoptimering med AI-assistenten',
          icon: Brain,
          reason: 'Optimera baserat på nuvarande innehav',
          confidence: 0.8,
          priority: 'medium',
          category: 'portfolio'
        });
      } else {
        routes.push({
          path: '/portfolio-advisor',
          title: 'Skapa din portfölj',
          description: 'Bygg en diversifierad investeringsportfölj',
          icon: PieChart,
          reason: 'Nästa naturliga steg för dig',
          confidence: 0.9,
          priority: 'high',
          category: 'getting_started'
        });
        
        routes.push({
          path: '/ai-chat',
          title: 'Starta AI-rådgivning',
          description: 'Få personliga investeringsråd baserat på din profil',
          icon: Brain,
          reason: 'Perfekt första steg för att komma igång',
          confidence: 0.85,
          priority: 'high',
          category: 'getting_started'
        });
      }
    }

    if (currentPath === '/stock-cases') {
      if (!hasStockCases) {
        routes.push({
          path: '/stock-cases',
          title: 'Skapa ditt första aktiecase',
          description: 'Dela en investeringsidé med communityn',
          icon: Plus,
          reason: 'Du har inte skapat något case ännu',
          confidence: 0.9,
          priority: 'high',
          category: 'community'
        });
      }

      if (!hasAnalyses) {
        routes.push({
          path: '/market-analyses',
          title: 'Skapa en analys',
          description: 'Gör en djupanalys av en intressant aktie',
          icon: Edit3,
          reason: 'Komplettera med djupare analyser',
          confidence: 0.85,
          priority: 'high',
          category: 'analysis'
        });
      }

      routes.push({
        path: '/ai-chat',
        title: 'Diskutera med AI',
        description: 'Analysera intressanta aktier med AI-assistenten',
        icon: Brain,
        reason: 'Få djupare analys av upptäckta aktier',
        confidence: 0.8,
        priority: 'medium',
        category: 'analysis'
      });
    }

    if (currentPath === '/market-analyses') {
      if (!hasAnalyses) {
        routes.push({
          path: '/market-analyses',
          title: 'Skapa din första analys',
          description: 'Dela dina investeringsinsikter med communityn',
          icon: Edit3,
          reason: 'Du har inte skapat någon analys ännu',
          confidence: 0.95,
          priority: 'high',
          category: 'analysis'
        });
      }

      if (hasPortfolio) {
        routes.push({
          path: '/portfolio-implementation',
          title: 'Analysera din portfölj',
          description: 'Koppla dina analyser till din portfölj',
          icon: Target,
          reason: 'Integrera analyser med din portfölj',
          confidence: 0.8,
          priority: 'medium',
          category: 'portfolio'
        });
      }
    }

    if (currentPath === '/ai-chat') {
      if (hasPortfolio && !hasAnalyses) {
        routes.push({
          path: '/market-analyses',
          title: 'Skapa en analys',
          description: 'Omsätt AI-insikter till en egen analys',
          icon: FileText,
          reason: 'Nästa steg efter AI-rådgivning',
          confidence: 0.9,
          priority: 'high',
          category: 'analysis'
        });
      }

      if (hasPortfolio) {
        routes.push({
          path: '/portfolio-implementation',
          title: 'Implementera råden',
          description: 'Omsätt AI-råden till konkreta portföljförändringar',
          icon: PieChart,
          reason: 'Praktisera AI-insights i din portfölj',
          confidence: 0.85,
          priority: 'medium',
          category: 'portfolio'
        });
      } else {
        routes.push({
          path: '/portfolio-advisor',
          title: 'Skapa portfölj',
          description: 'Bygg din första portfölj baserat på AI-råd',
          icon: PieChart,
          reason: 'Nästa steg efter AI-rådgivning',
          confidence: 0.9,
          priority: 'high',
          category: 'getting_started'
        });
      }
    }

    if (currentPath === '/portfolio-implementation' && hasPortfolio) {
      if (!hasAnalyses) {
        routes.push({
          path: '/market-analyses',
          title: 'Dokumentera dina insikter',
          description: 'Skapa analyser baserat på portföljprestanda',
          icon: FileText,
          reason: 'Dela dina portföljinsikter med andra',
          confidence: 0.9,
          priority: 'high',
          category: 'analysis'
        });
      }

      routes.push({
        path: '/ai-chat',
        title: 'Optimera med AI',
        description: 'Få förslag på förbättringar av din portfölj',
        icon: Brain,
        reason: 'Kontinuerlig optimering rekommenderas',
        confidence: 0.8,
        priority: 'medium',
        category: 'portfolio'
      });
    }

    // Remove duplicates and sort by priority and confidence
    const uniqueRoutes = routes.filter((route, index, self) => 
      index === self.findIndex(r => r.path === route.path)
    );

    return uniqueRoutes
      .sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.confidence - a.confidence;
      })
      .slice(0, 4); // Show max 4 suggestions
  };

  const handleSmartNavigation = (route: SmartRoute) => {
    if (!user && route.path !== '/auth') {
      // Create AI chat session about why they should sign up
      const event = new CustomEvent('createStockChat', {
        detail: { 
          sessionName: 'Kom igång med investeringar',
          message: `Jag är intresserad av ${route.title.toLowerCase()}. Kan du berätta mer om fördelarna med att skapa ett konto?`
        }
      });
      window.dispatchEvent(event);
      navigate('/ai-chat');
      return;
    }

    // Add context to AI when navigating
    if (route.path === '/ai-chat') {
      const contextMessage = hasPortfolio 
        ? `Hej! Jag har redan en portfölj och kommer från ${location.pathname}. Jag är intresserad av: ${route.description}`
        : `Hej! Jag kommer från ${location.pathname} och är intresserad av: ${route.description}`;
        
      const event = new CustomEvent('prefillChatInput', {
        detail: { 
          message: contextMessage
        }
      });
      window.dispatchEvent(event);
    }

    // Special handling for creating analyses
    if (route.path === '/market-analyses' && route.category === 'analysis') {
      // Could trigger a create analysis dialog or navigate to analyses with create mode
      navigate('/market-analyses?create=true');
    } else {
      navigate(route.path);
    }
    
    toast({
      title: "Smart navigation",
      description: `Navigerade till ${route.title}`,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-blue-500 to-purple-500';
      case 'low': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting_started': return Star;
      case 'portfolio': return PieChart;
      case 'analysis': return FileText;
      case 'learning': return BookOpen;
      case 'community': return Users;
      default: return Target;
    }
  };

  const smartRoutes = getSmartRoutes();

  if (smartRoutes.length === 0) return null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Smart Navigation</h3>
            <p className="text-sm text-muted-foreground">
              {!user 
                ? "AI-föreslagna steg för att komma igång"
                : userRegistrationDays <= 1 
                ? "Välkommen! Här är dina nästa steg"
                : userRegistrationDays <= 7 
                ? "Fortsätt utforska plattformen"
                : hasPortfolio 
                ? "AI-föreslagna nästa steg för din portfölj" 
                : "AI-föreslagna nästa steg för dig"
              }
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {smartRoutes.map((route, index) => {
            const Icon = route.icon;
            const CategoryIcon = getCategoryIcon(route.category);
            return (
              <div
                key={`${route.path}-${index}`}
                className="group cursor-pointer border rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-background hover:bg-primary/5"
                onClick={() => handleSmartNavigation(route)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                        {route.title}
                      </h4>
                      <Badge className={`bg-gradient-to-r ${getPriorityColor(route.priority)} text-white text-xs`}>
                        {Math.round(route.confidence * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      {route.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          {route.reason}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default IntelligentRouting;
