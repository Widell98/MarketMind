
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
  User
} from 'lucide-react';

interface SmartRoute {
  path: string;
  title: string;
  description: string;
  icon: any;
  reason: string;
  confidence: number;
}

const IntelligentRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const getSmartRoutes = (): SmartRoute[] => {
    const currentPath = location.pathname;
    const routes: SmartRoute[] = [];

    // AI-driven route suggestions based on user context and current location
    if (currentPath === '/') {
      routes.push({
        path: '/ai-chat',
        title: 'Starta AI-rådgivning',
        description: 'Få personliga investeringsråd baserat på din profil',
        icon: Brain,
        reason: 'Baserat på din nya användarprofil',
        confidence: 0.9
      });
      
      if (user) {
        routes.push({
          path: '/portfolio-implementation',
          title: 'Bygg din portfölj',
          description: 'Skapa en diversifierad investeringsportfölj',
          icon: PieChart,
          reason: 'Nästa naturliga steg för dig',
          confidence: 0.8
        });
      }
    }

    if (currentPath === '/stock-cases') {
      routes.push({
        path: '/ai-chat',
        title: 'Diskutera aktier med AI',
        description: 'Djupanalys av intressanta aktier med AI-assistenten',
        icon: Brain,
        reason: 'För att få mer djup i din analys',
        confidence: 0.85
      });
    }

    if (currentPath === '/ai-chat' && user) {
      routes.push({
        path: '/portfolio-implementation',
        title: 'Implementera råden',
        description: 'Omsätt AI-råden till konkreta investeringar',
        icon: PieChart,
        reason: 'Nästa steg efter AI-rådgivning',
        confidence: 0.9
      });
    }

    return routes.sort((a, b) => b.confidence - a.confidence);
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
      const event = new CustomEvent('prefillChatInput', {
        detail: { 
          message: `Hej! Jag kommer från ${location.pathname} och är intresserad av: ${route.description}`
        }
      });
      window.dispatchEvent(event);
    }

    navigate(route.path);
    
    toast({
      title: "Smart navigation",
      description: `Navigerade till ${route.title} - ${route.reason}`,
    });
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
            <p className="text-sm text-muted-foreground">AI-föreslagna nästa steg för dig</p>
          </div>
        </div>

        <div className="space-y-3">
          {smartRoutes.map((route, index) => {
            const Icon = route.icon;
            return (
              <div
                key={route.path}
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
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                        {Math.round(route.confidence * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      {route.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-primary" />
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
