import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Target,
  Minus,
  Eye,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartSuggestion {
  id: string;
  type: 'buy_more' | 'sell' | 'hold' | 'rebalance' | 'monitor' | 'diversify';
  confidence: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detailedAnalysis: string;
  impact: 'positive' | 'negative' | 'neutral';
  priority: number;
  riskLevel: 'low' | 'medium' | 'high';
  potentialReturn: string;
  timeframe: 'short' | 'medium' | 'long';
  marketCondition: string;
}

interface SmartSuggestionItemProps {
  suggestion: SmartSuggestion;
  onAction: (suggestionId: string, action: string) => void;
}

const SmartSuggestionItem: React.FC<SmartSuggestionItemProps> = ({
  suggestion,
  onAction
}) => {
  const [expanded, setExpanded] = useState(false);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'buy_more': return TrendingUp;
      case 'sell': return TrendingDown;
      case 'rebalance': return Target;
      case 'hold': return Minus;
      case 'monitor': return Eye;
      case 'diversify': return BarChart3;
      default: return CheckCircle;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'sell': return 'text-destructive bg-destructive/10';
      case 'buy_more': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20';
      case 'rebalance': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20';
      case 'hold': return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950/30';
      case 'monitor': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20';
      case 'diversify': return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'sell': return 'border-l-destructive';
      case 'buy_more': return 'border-l-green-500';
      case 'rebalance': return 'border-l-blue-500';
      case 'hold': return 'border-l-green-600';
      case 'monitor': return 'border-l-orange-500';
      case 'diversify': return 'border-l-purple-500';
      default: return 'border-l-muted-foreground';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const Icon = getSuggestionIcon(suggestion.type);

  return (
    <Card className={cn(
      "border-l-2 transition-all duration-200",
      getBorderColor(suggestion.type)
    )}>
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
            getSuggestionColor(suggestion.type)
          )}>
            <Icon className="w-3 h-3" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <h4 className="font-medium text-xs text-foreground truncate">
                {suggestion.title}
              </h4>
              <Badge className={cn("text-xs px-1 py-0 h-4", getConfidenceBadge(suggestion.confidence))}>
                {suggestion.confidence === 'high' ? 'H' : suggestion.confidence === 'medium' ? 'M' : 'L'}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground leading-tight mb-1 line-clamp-2">
              {suggestion.description}
            </p>
            
            {expanded && (
              <div className="bg-muted/20 rounded p-2 mb-2">
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {suggestion.detailedAnalysis}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-muted-foreground">Potential:</span>
                    <div className="text-foreground">{suggestion.potentialReturn}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Tidsram:</span>
                    <div className="text-foreground">
                      {suggestion.timeframe === 'short' ? 'Kort' : 
                       suggestion.timeframe === 'medium' ? 'Medel' : 'Lång'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-1 items-center">
              <Button
                size="sm"
                variant="default"
                className="text-xs h-6 px-2"
                onClick={() => onAction(suggestion.id, 'follow')}
              >
                Följ
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-6 px-2"
                onClick={() => onAction(suggestion.id, 'dismiss')}
              >
                Avfärda
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-6 px-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Mindre' : 'Mer'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartSuggestionItem;