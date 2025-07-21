import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useUserHoldings } from '@/hooks/useUserHoldings';
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
  X,
  Move,
  RefreshCw,
  AlertTriangle
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
  timestamp?: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const ContextualAISuggestions = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { performance } = usePortfolioPerformance();
  const { actualHoldings } = useUserHoldings();
  
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Dragging state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Auto-refresh suggestions every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      generateSuggestions();
      setLastUpdate(new Date());
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [location.pathname, performance, actualHoldings]);

  const generateSuggestions = () => {
    setIsUpdating(true);
    
    setTimeout(() => {
      const path = location.pathname;
      let contextSuggestions: AISuggestion[] = [];
      const timestamp = Date.now();

      if (path === '/') {
        if (!actualHoldings || actualHoldings.length === 0) {
          contextSuggestions = [
            {
              id: '1',
              title: 'Skapa din första portfölj',
              description: 'Låt AI:n analysera din riskprofil och skapa en personlig investeringsstrategi',
              action: 'Starta AI-rådgivning',
              icon: Brain,
              priority: 'high',
              category: 'action',
              timestamp
            },
            {
              id: '2',
              title: 'Lägg till befintliga innehav',
              description: 'Registrera dina nuvarande investeringar för bättre portföljanalys',
              action: 'Lägg till innehav',
              icon: PieChart,
              priority: 'high',
              category: 'action',
              timestamp
            }
          ];
        } else {
          contextSuggestions = [
            {
              id: '3',
              title: 'Portföljoptimering tillgänglig',
              description: 'AI:n har upptäckt förbättringsmöjligheter baserat på dina senaste innehav',
              action: 'Optimera portfölj',
              icon: Sparkles,
              priority: 'high',
              category: 'insight',
              timestamp
            },
            {
              id: '4',
              title: 'Marknadstrender just nu',
              description: 'Få AI-baserade insights om dagens marknadsrörelser och möjligheter',
              action: 'Visa marknadsanalys',
              icon: TrendingUp,
              priority: 'medium',
              category: 'insight',
              timestamp
            }
          ];
        }
      } else if (path === '/stock-cases') {
        contextSuggestions = [
          {
            id: '5',
            title: 'AI-analys av intressanta aktier',
            description: 'Låt AI:n djupdyka i aktier som matchar din investeringsprofil',
            action: 'Analysera aktier med AI',
            icon: PieChart,
            priority: 'high',
            category: 'analysis',
            timestamp
          },
          {
            id: '6',
            title: 'Diskutera denna aktie',
            description: 'Starta en djup konversation om en specifik aktie med AI-assistenten',
            action: 'Öppna AI-chat',
            icon: MessageSquare,
            priority: 'medium',
            category: 'action',
            timestamp
          }
        ];
      } else if (path === '/portfolio-implementation') {
        const hasPerformanceIssues = performance && (
          (performance.totalReturn || 0) < -5 || 
          (performance.volatility || 0) > 20
        );

        contextSuggestions = [
          {
            id: '7',
            title: hasPerformanceIssues ? 'Portföljproblem upptäckta' : 'Optimera din portfölj',
            description: hasPerformanceIssues 
              ? 'AI:n har upptäckt prestandaproblem som behöver åtgärdas omedelbart'
              : 'AI:n har upptäckt förbättringsmöjligheter i din nuvarande allokering',
            action: 'Visa optimeringar',
            icon: hasPerformanceIssues ? AlertTriangle : Sparkles,
            priority: hasPerformanceIssues ? 'high' : 'medium',
            category: 'insight',
            timestamp
          },
          {
            id: '8',
            title: 'Riskanalys och rebalansering',
            description: 'Få AI-driven riskbedömning och förslag på rebalansering',
            action: 'Starta riskanalys',
            icon: Brain,
            priority: 'medium',
            category: 'analysis',
            timestamp
          }
        ];
      } else if (path === '/ai-chat') {
        contextSuggestions = [
          {
            id: '9',
            title: 'Portföljgranskning',
            description: 'Be AI:n göra en fullständig analys av din nuvarande portfölj',
            action: 'Granska portfölj',
            icon: PieChart,
            priority: 'medium',
            category: 'analysis',
            timestamp
          },
          {
            id: '10',
            title: 'Lärande möjligheter',
            description: 'Utforska investeringsutbildning anpassad för din kunskapsnivå',
            action: 'Starta lärande',
            icon: Lightbulb,
            priority: 'low',
            category: 'learning',
            timestamp
          }
        ];
      }

      setSuggestions(contextSuggestions);
      setIsUpdating(false);
    }, 500);
  };

  useEffect(() => {
    generateSuggestions();
  }, [location.pathname, performance, actualHoldings]);

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    const event = new CustomEvent('createStockChat', {
      detail: { 
        sessionName: suggestion.title,
        message: suggestion.description 
      }
    });
    window.dispatchEvent(event);
    window.location.href = '/ai-chat';
  };

  const handleManualRefresh = () => {
    generateSuggestions();
    setLastUpdate(new Date());
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragHandleRef.current?.contains(e.target as Node)) return;
    
    e.preventDefault();
    setDragState({
      isDragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    e.preventDefault();
    const newX = e.clientX - dragState.startX;
    const newY = e.clientY - dragState.startY;
    
    // Keep within viewport bounds
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  };

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [dragState.isDragging]);

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
    <Card 
      ref={cardRef}
      className={cn(
        "fixed z-40 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm transition-all duration-300 select-none",
        isMinimized ? "w-80 h-16" : "w-96 max-h-[500px]",
        dragState.isDragging ? "cursor-grabbing" : "cursor-default"
      )}
      style={{
        top: `${80 + position.y}px`,
        right: `${24 + position.x}px`,
        transform: dragState.isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div 
        ref={dragHandleRef}
        className="bg-gradient-to-r from-primary to-blue-600 text-white p-3 flex items-center justify-between rounded-t-lg cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            {isUpdating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
          </div>
          {!isMinimized && (
            <div>
              <h3 className="font-semibold text-sm">Smart Förslag</h3>
              <p className="text-xs opacity-80">
                Uppdaterat {lastUpdate.toLocaleTimeString('sv-SE', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          )}
          <Move className="w-3 h-3 opacity-60 ml-1" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={handleManualRefresh}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
            disabled={isUpdating}
          >
            <RefreshCw className={cn("w-4 h-4", isUpdating && "animate-spin")} />
          </Button>
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
