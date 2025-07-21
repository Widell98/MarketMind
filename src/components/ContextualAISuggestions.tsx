
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
  const [isVisible, setIsVisible] = useState(false); // Changed from true to false
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissedPermanently, setDismissedPermanently] = useState(false);
  const [lastShownTime, setLastShownTime] = useState<number>(0);
  
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

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem('ai-suggestions-dismissed');
    const lastShown = localStorage.getItem('ai-suggestions-last-shown');
    
    if (dismissed === 'true') {
      setDismissedPermanently(true);
    }
    
    if (lastShown) {
      setLastShownTime(parseInt(lastShown));
    }
  }, []);

  // Only auto-refresh suggestions every 10 minutes (increased from 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isVisible && !dismissedPermanently) {
        generateSuggestions();
        setLastUpdate(new Date());
      }
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, [location.pathname, performance, actualHoldings, isVisible, dismissedPermanently]);

  const shouldShowSuggestions = () => {
    if (dismissedPermanently || !user) return false;
    
    const now = Date.now();
    const timeSinceLastShown = now - lastShownTime;
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Only show if it's been at least 1 hour since last shown
    if (timeSinceLastShown < oneHour) return false;
    
    const path = location.pathname;
    
    // Only show on specific conditions
    if (path === '/' && (!actualHoldings || actualHoldings.length === 0)) {
      return true; // Show for new users
    }
    
    // Show if there are performance issues
    if (path === '/portfolio-implementation' && performance && (
      (performance.totalReturn || 0) < -10 || 
      (performance.dayChangePercentage || 0) < -15
    )) {
      return true; // Show for significant performance issues
    }
    
    return false;
  };

  const generateSuggestions = () => {
    if (!shouldShowSuggestions()) {
      setIsVisible(false);
      return;
    }
    
    setIsUpdating(true);
    
    setTimeout(() => {
      const path = location.pathname;
      let contextSuggestions: AISuggestion[] = [];
      const timestamp = Date.now();

      if (path === '/' && (!actualHoldings || actualHoldings.length === 0)) {
        contextSuggestions = [
          {
            id: '1',
            title: 'Välkommen! Skapa din första portfölj',
            description: 'Låt AI:n analysera din riskprofil och skapa en personlig investeringsstrategi',
            action: 'Starta AI-rådgivning',
            icon: Brain,
            priority: 'high',
            category: 'action',
            timestamp
          }
        ];
      } else if (path === '/portfolio-implementation') {
        const hasSignificantIssues = performance && (
          (performance.totalReturn || 0) < -10 || 
          (performance.dayChangePercentage || 0) < -15
        );

        if (hasSignificantIssues) {
          contextSuggestions = [
            {
              id: '7',
              title: 'Viktiga portföljproblem upptäckta',
              description: 'AI:n har upptäckt betydande prestandaproblem som behöver omedelbar uppmärksamhet',
              action: 'Visa akuta optimeringar',
              icon: AlertTriangle,
              priority: 'high',
              category: 'insight',
              timestamp
            }
          ];
        }
      }

      setSuggestions(contextSuggestions);
      setIsUpdating(false);
      
      if (contextSuggestions.length > 0) {
        setIsVisible(true);
        setLastShownTime(Date.now());
        localStorage.setItem('ai-suggestions-last-shown', Date.now().toString());
      }
    }, 500);
  };

  useEffect(() => {
    if (!dismissedPermanently) {
      generateSuggestions();
    }
  }, [location.pathname, performance, actualHoldings, dismissedPermanently]);

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    const event = new CustomEvent('createStockChat', {
      detail: { 
        sessionName: suggestion.title,
        message: suggestion.description 
      }
    });
    window.dispatchEvent(event);
    window.location.href = '/ai-chat';
    
    // Hide after interaction
    setIsVisible(false);
  };

  const handleManualRefresh = () => {
    generateSuggestions();
    setLastUpdate(new Date());
  };

  const handleDismissPermanently = () => {
    setDismissedPermanently(true);
    setIsVisible(false);
    localStorage.setItem('ai-suggestions-dismissed', 'true');
  };

  const handleTemporaryDismiss = () => {
    setIsVisible(false);
    setLastShownTime(Date.now());
    localStorage.setItem('ai-suggestions-last-shown', Date.now().toString());
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

  // Add reset function for development/testing
  const resetDismissedState = () => {
    localStorage.removeItem('ai-suggestions-dismissed');
    localStorage.removeItem('ai-suggestions-last-shown');
    setDismissedPermanently(false);
    setLastShownTime(0);
    generateSuggestions();
  };

  if (!isVisible || suggestions.length === 0 || !user || dismissedPermanently) return null;

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
                Visas bara vid viktiga tillfällen
              </p>
            </div>
          )}
          <Move className="w-3 h-3 opacity-60 ml-1" />
        </div>
        <div className="flex items-center gap-1">
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={resetDismissedState}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:bg-white/20"
              title="Reset (dev only)"
            >
              ↻
            </Button>
          )}
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
          >
            {isMinimized ? '↑' : '↓'}
          </Button>
          <Button
            onClick={handleTemporaryDismiss}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
            title="Dölj tills vidare"
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
          
          <div className="pt-2 border-t border-border">
            <Button
              onClick={handleDismissPermanently}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Visa aldrig smart förslag igen
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ContextualAISuggestions;
