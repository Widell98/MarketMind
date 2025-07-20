
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  MessageSquare,
  BarChart3,
  Target,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  href: string;
  icon: React.ElementType;
  priority: 'high' | 'medium' | 'low';
  context: string[];
}

const ContextualAISuggestions = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { riskProfile } = useRiskProfile();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  const generateSuggestions = (): AISuggestion[] => {
    const baseSuggestions: AISuggestion[] = [];
    const currentPath = location.pathname;

    // Context-aware suggestions based on current page
    if (currentPath === '/') {
      baseSuggestions.push({
        id: 'home-ai-chat',
        title: 'Starta din AI-resa',
        description: 'Få personlig investeringsrådgivning baserat på dina mål',
        action: 'Chatta med AI',
        href: '/ai-chat',
        icon: MessageSquare,
        priority: 'high',
        context: ['home', 'new-user']
      });

      if (!riskProfile && user) {
        baseSuggestions.push({
          id: 'create-risk-profile',
          title: 'Skapa din investeringsprofil',
          description: 'Låt AI analysera din risktolerans och föreslå strategier',
          action: 'Börja nu',
          href: '/portfolio-advisor',
          icon: Target,
          priority: 'high',
          context: ['home', 'no-profile']
        });
      }
    }

    if (currentPath === '/stock-cases') {
      baseSuggestions.push({
        id: 'ai-stock-analysis',
        title: 'AI-driven aktianalys',
        description: 'Få djupgående insights om aktier med AI-assistenten',
        action: 'Analysera aktier',
        href: '/ai-chat?message=Analysera aktier för mig',
        icon: TrendingUp,
        priority: 'high',
        context: ['stock-cases']
      });
    }

    if (currentPath === '/portfolio-implementation' && riskProfile) {
      baseSuggestions.push({
        id: 'optimize-portfolio',
        title: 'Optimera din portfölj',
        description: 'AI kan föreslå förbättringar baserat på marknadsdata',
        action: 'Optimera nu',
        href: '/ai-chat?message=Optimera min portfölj',
        icon: BarChart3,
        priority: 'high',
        context: ['portfolio']
      });
    }

    // Universal suggestions
    baseSuggestions.push({
      id: 'market-insights',
      title: 'Dagens marknadsinsikter',
      description: 'Få AI:s analys av dagens viktigaste marknadshändelser',
      action: 'Visa insights',
      href: '/ai-chat?message=Vad händer på marknaden idag?',
      icon: Lightbulb,
      priority: 'medium',
      context: ['universal']
    });

    return baseSuggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).slice(0, 3);
  };

  useEffect(() => {
    setSuggestions(generateSuggestions());
  }, [location.pathname, user, riskProfile]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-2 border-primary/10 bg-gradient-to-br from-primary/5 via-blue-50/50 to-purple-50/30 dark:from-primary/10 dark:via-blue-950/20 dark:to-purple-950/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI-förslag</h3>
              <p className="text-xs text-muted-foreground">Baserat på din aktivitet</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </Button>
        </div>

        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <div
                key={suggestion.id}
                className="group p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 hover:border-primary/20 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                    suggestion.priority === 'high' 
                      ? "bg-gradient-to-br from-primary/20 to-blue-200/50 text-primary group-hover:from-primary/30 group-hover:to-blue-300/50"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-foreground">
                        {suggestion.title}
                      </h4>
                      {suggestion.priority === 'high' && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-1.5 py-0.5">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          Rekommenderat
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {suggestion.description}
                    </p>
                    <Button 
                      asChild
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary group-hover:translate-x-1 transition-transform duration-200"
                    >
                      <a href={suggestion.href} className="flex items-center gap-1">
                        {suggestion.action}
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            AI analyserar kontinuerligt din aktivitet för att ge personliga förslag
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContextualAISuggestions;
