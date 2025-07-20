
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  PieChart, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
  category: 'analysis' | 'insight' | 'action' | 'learning';
}

const ContextualAISuggestions = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Generate contextual suggestions based on current route
    const generateSuggestions = () => {
      const path = location.pathname;
      let contextSuggestions: AISuggestion[] = [];

      if (path === '/') {
        contextSuggestions = [
          {
            id: '1',
            title: 'Skapa din första portfölj',
            description: 'Låt AI:n analysera din riskprofil och skapa en personlig investeringsstrategi',
            action: 'Starta AI-rådgivning',
            icon: Brain,
            priority: 'high',
            category: 'action'
          },
          {
            id: '2',
            title: 'Marknadstrender just nu',
            description: 'Få AI-baserade insights om dagens marknadsrörelser och möjligheter',
            action: 'Visa marknadsanalys',
            icon: TrendingUp,
            priority: 'medium',
            category: 'insight'
          }
        ];
      } else if (path === '/stock-cases') {
        contextSuggestions = [
          {
            id: '3',
            title: 'AI-analys av intressanta aktier',
            description: 'Låt AI:n djupdyka i aktier som matchar din investeringsprofil',
            action: 'Analysera aktier med AI',
            icon: PieChart,
            priority: 'high',
            category: 'analysis'
          },
          {
            id: '4',
            title: 'Diskutera denna aktie',
            description: 'Starta en djup konversation om en specifik aktie med AI-assistenten',
            action: 'Öppna AI-chat',
            icon: MessageSquare,
            priority: 'medium',
            category: 'action'
          }
        ];
      } else if (path === '/portfolio-implementation') {
        contextSuggestions = [
          {
            id: '5',
            title: 'Optimera din portfölj',
            description: 'AI:n har upptäckt förbättringsmöjligheter i din nuvarande allokering',
            action: 'Visa optimeringar',
            icon: Sparkles,
            priority: 'high',
            category: 'insight'
          },
          {
            id: '6',
            title: 'Riskanalys och rebalansering',
            description: 'Få AI-driven riskbedömning och förslag på rebalansering',
            action: 'Starta riskanalys',
            icon: Brain,
            priority: 'medium',
            category: 'analysis'
          }
        ];
      }

      setSuggestions(contextSuggestions);
    };

    generateSuggestions();
  }, [location.pathname]);

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    // Navigate to AI chat with context
    const event = new CustomEvent('createStockChat', {
      detail: { 
        sessionName: suggestion.title,
        message: suggestion.description 
      }
    });
    window.dispatchEvent(event);
    window.location.href = '/ai-chat';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  if (!isVisible || suggestions.length === 0 || !user) return null;

  return (
    <Card className={cn(
      "fixed top-20 right-6 z-40 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm transition-all duration-300",
      isMinimized ? "w-80 h-16" : "w-96 max-h-[500px]"
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          {!isMinimized && (
            <div>
              <h3 className="font-semibold text-sm">Smart Förslag</h3>
              <p className="text-xs opacity-80">AI-baserade rekommendationer</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
          >
            {isMinimized ? '↑' : '↓'}
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <div
                key={suggestion.id}
                className="group cursor-pointer border rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-primary/50"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {suggestion.title}
                      </h4>
                      <Badge className={cn("text-xs", getPriorityColor(suggestion.priority))}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">
                        {suggestion.action}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ContextualAISuggestions;
