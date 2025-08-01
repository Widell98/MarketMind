import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { 
  Brain, 
  BarChart3, 
  ArrowRight,
  Users
} from 'lucide-react';

const IntelligentRouting: React.FC = () => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();

  // Only show for new users (first 3 days) or users without portfolio
  const userRegistrationDays = user ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const hasPortfolio = !!activePortfolio;
  
  // Don't show if user has been around for more than 3 days and has portfolio
  if (user && userRegistrationDays > 3 && hasPortfolio) {
    return null;
  }

  const getSmartSuggestions = () => {
    // For non-authenticated users
    if (!user) {
      return [
        {
          id: 'get-started',
          title: 'Kom igång med AI-investering',
          description: 'Skapa ett konto och bygg din första portfölj med AI-hjälp',
          icon: BarChart3,
          href: '/auth',
          badge: 'Gratis',
          color: 'bg-gradient-to-r from-primary to-blue-600'
        },
        {
          id: 'try-ai',
          title: 'Testa AI-rådgivaren',
          description: 'Få en försmak av våra AI-drivna investeringsinsikter',
          icon: Brain,
          href: '/ai-chat',
          badge: 'Demo',
          color: 'bg-gradient-to-r from-purple-500 to-purple-600'
        }
      ];
    }

    // For authenticated users without portfolio
    if (!hasPortfolio) {
      return [
        {
          id: 'create-portfolio',
          title: 'Skapa din första portfölj',
          description: 'Låt AI hjälpa dig bygga en personlig investeringsstrategi',
          icon: BarChart3,
          href: '/portfolio-advisor',
          badge: 'Nästa steg',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600'
        },
        {
          id: 'explore-community',
          title: 'Upptäck investeringsmöjligheter',
          description: 'Lär dig från andra investerares strategier och idéer',
          icon: Users,
          href: '/stock-cases',
          badge: 'Inspiration',
          color: 'bg-gradient-to-r from-green-500 to-green-600'
        }
      ];
    }

    return [];
  };

  const suggestions = getSmartSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {user ? 'Ditt nästa steg' : 'Kom igång'}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {user 
            ? 'Förslag baserat på din profil' 
            : 'Upptäck hur AI kan förbättra dina investeringar'
          }
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {suggestions.map((suggestion) => {
          const IconComponent = suggestion.icon;
          
          return (
            <Card 
              key={suggestion.id}
              className="group relative overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/30"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300",
                    suggestion.color
                  )}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {suggestion.title}
                      </h3>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {suggestion.badge}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {suggestion.description}
                    </p>
                    
                    <Button
                      asChild
                      className="w-full bg-primary hover:bg-primary/90 group-hover:shadow-md transition-all duration-200"
                    >
                      <Link to={suggestion.href} className="flex items-center justify-center gap-2">
                        <span>Kom igång</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default IntelligentRouting;