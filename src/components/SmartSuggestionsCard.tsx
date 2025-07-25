import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  X, 
  Move, 
  RefreshCw, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartSuggestion } from './SmartSuggestionsEngine';
import { useNavigate } from 'react-router-dom';

interface SmartSuggestionsCardProps {
  suggestions: SmartSuggestion[];
  isAnalyzing: boolean;
  onDismiss: (permanent?: boolean) => void;
  onRefresh: () => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
}

const SmartSuggestionsCard: React.FC<SmartSuggestionsCardProps> = ({
  suggestions,
  isAnalyzing,
  onDismiss,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0
  });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    switch (suggestion.id) {
      case 'onboarding-risk-profile':
        navigate('/profile', { state: { activeTab: 'risk-profile' } });
        break;
      case 'create-first-portfolio':
      case 'portfolio-optimization':
        navigate('/portfolio-implementation');
        break;
      case 'urgent-portfolio-review':
        // Create AI chat with urgent analysis
        const urgentEvent = new CustomEvent('createStockChat', {
          detail: { 
            sessionName: 'Akut Portföljanalys',
            message: 'Jag behöver en djupgående analys av min portfölj med fokus på riskhantering och förbättringsförslag. Mina innehav visar betydande förluster och jag behöver vägledning för hur jag ska agera.'
          }
        });
        window.dispatchEvent(urgentEvent);
        navigate('/ai-chat');
        break;
      case 'deep-analysis-learning':
        const learningEvent = new CustomEvent('createStockChat', {
          detail: { 
            sessionName: 'Avancerad Aktieanalys',
            message: 'Jag vill lära mig mer om avancerade analystekniker. Kan du lära mig om fundamental- och teknisk analys, samt hur jag utvärderar aktier mer effektivt?'
          }
        });
        window.dispatchEvent(learningEvent);
        navigate('/ai-chat');
        break;
      case 'market-opportunities':
        navigate('/stock-cases');
        break;
      case 'diversification-advice':
        const diversificationEvent = new CustomEvent('createStockChat', {
          detail: { 
            sessionName: 'Portfölj Diversifiering',
            message: 'Kan du analysera min nuvarande portfölj och ge råd om hur jag kan förbättra diversifieringen för att minska risken?'
          }
        });
        window.dispatchEvent(diversificationEvent);
        navigate('/ai-chat');
        break;
      case 'try-ai-assistant':
        navigate('/ai-chat');
        break;
      case 'weekly-portfolio-check':
        navigate('/portfolio-implementation');
        break;
      case 'discover-advanced-features':
        navigate('/advanced-features');
        break;
      default:
        // Generic AI chat creation
        const genericEvent = new CustomEvent('createStockChat', {
          detail: { 
            sessionName: suggestion.title,
            message: suggestion.description
          }
        });
        window.dispatchEvent(genericEvent);
        navigate('/ai-chat');
    }
    
    onDismiss(); // Close suggestions after action
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragHandleRef.current?.contains(e.target as Node)) return;
    
    e.preventDefault();
    setDragState({
      isDragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
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
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return '📈';
      case 'risk': return '🛡️';
      case 'opportunity': return '⭐';
      case 'learning': return '📚';
      case 'portfolio': return '💼';
      case 'market': return '📊';
      default: return '💡';
    }
  };

  if (suggestions.length === 0 && !isAnalyzing) return null;

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "fixed z-50 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm transition-all duration-300 select-none",
        "w-80 md:w-96",
        isMinimized ? "h-16" : "max-h-[500px]",
        dragState.isDragging ? "cursor-grabbing scale-102" : "cursor-default",
        // Mobile positioning
        "bottom-20 md:bottom-auto md:top-20 right-4"
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) ${dragState.isDragging ? 'scale(1.02)' : 'scale(1)'}`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div 
        ref={dragHandleRef}
        className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 text-white p-3 flex items-center justify-between rounded-t-lg cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          {!isMinimized && (
            <div>
              <h3 className="font-semibold text-sm">Smart Förslag</h3>
              <p className="text-xs opacity-80">
                AI-driven personliga rekommendationer
              </p>
            </div>
          )}
          <Move className="w-3 h-3 opacity-60 ml-1" />
        </div>
        
        <div className="flex items-center gap-1">
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:bg-white/20"
              title="Refresh suggestions"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            onClick={() => onDismiss()}
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
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm">Analyserar dina behov...</p>
              </div>
            </div>
          ) : (
            <>
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <div
                    key={suggestion.id}
                    className="group cursor-pointer border rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-200">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {suggestion.title}
                          </h4>
                          <span className="text-xs">{getCategoryIcon(suggestion.category)}</span>
                          <Badge className={cn("text-xs", getPriorityColor(suggestion.priority))}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                          {suggestion.description}
                        </p>
                        
                        {suggestion.aiInsight && (
                          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-2 border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                              💡 {suggestion.aiInsight}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {suggestion.action}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">
                              {suggestion.relevanceScore}% match
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-3 border-t border-border space-y-2">
                <Button
                  onClick={() => onDismiss(true)}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Visa aldrig smart förslag igen
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default SmartSuggestionsCard;
