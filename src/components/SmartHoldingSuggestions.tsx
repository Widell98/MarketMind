
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Brain,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartSuggestion {
  id: string;
  type: 'buy_more' | 'sell' | 'hold' | 'rebalance';
  confidence: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  priority: number;
}

interface SmartHoldingSuggestionsProps {
  holdingId: string;
  holdingName: string;
  holdingType: string;
  currentValue: number;
  portfolioPercentage: number;
  onSuggestionAction: (suggestionId: string, action: string) => void;
}

const SmartHoldingSuggestions: React.FC<SmartHoldingSuggestionsProps> = ({
  holdingId,
  holdingName,
  holdingType,
  currentValue,
  portfolioPercentage,
  onSuggestionAction
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Generate AI-based suggestions based on holding data
    const generateSuggestions = () => {
      const generatedSuggestions: SmartSuggestion[] = [];

      // Example logic for generating suggestions
      if (portfolioPercentage > 15 && holdingType === 'stock') {
        generatedSuggestions.push({
          id: `${holdingId}_concentration`,
          type: 'sell',
          confidence: 'high',
          title: 'Överväg att minska position',
          description: `${holdingName} utgör ${portfolioPercentage.toFixed(1)}% av portföljen. Överväg att minska för bättre diversifiering.`,
          impact: 'positive',
          priority: 1
        });
      }

      if (portfolioPercentage < 5 && currentValue > 10000 && holdingType === 'stock') {
        generatedSuggestions.push({
          id: `${holdingId}_opportunity`,
          type: 'buy_more',
          confidence: 'medium',
          title: 'Bra tillfälle att öka',
          description: 'Baserat på teknisk analys och marknadssentiment kan detta vara ett bra tillfälle att öka positionen.',
          impact: 'positive',
          priority: 2
        });
      }

      if (holdingType === 'cash' && currentValue > 50000) {
        generatedSuggestions.push({
          id: `${holdingId}_deploy`,
          type: 'rebalance',
          confidence: 'high',
          title: 'Överväg att investera',
          description: 'Du har en stor kassaposition. Överväg att investera delar av den för att öka avkastningspotentialen.',
          impact: 'positive',
          priority: 1
        });
      }

      setSuggestions(generatedSuggestions);
    };

    generateSuggestions();
  }, [holdingId, holdingName, holdingType, currentValue, portfolioPercentage]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'buy_more': return TrendingUp;
      case 'sell': return TrendingDown;
      case 'rebalance': return Target;
      default: return CheckCircle;
    }
  };

  const getSuggestionColor = (type: string, impact: string) => {
    if (type === 'sell') return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20';
    if (type === 'buy_more') return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20';
    return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20';
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">AI-förslag</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="ml-auto w-6 h-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      {suggestions.slice(0, 2).map((suggestion) => {
        const Icon = getSuggestionIcon(suggestion.type);
        return (
          <Card key={suggestion.id} className={cn(
            "border-l-4 transition-all duration-200 hover:shadow-md",
            getSuggestionColor(suggestion.type, suggestion.impact).includes('red') ? "border-l-red-500" :
            getSuggestionColor(suggestion.type, suggestion.impact).includes('green') ? "border-l-green-500" :
            "border-l-blue-500"
          )}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  getSuggestionColor(suggestion.type, suggestion.impact)
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-foreground">
                      {suggestion.title}
                    </h4>
                    <Badge className={cn("text-xs", getConfidenceBadge(suggestion.confidence))}>
                      {suggestion.confidence}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {suggestion.description}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => onSuggestionAction(suggestion.id, 'accept')}
                    >
                      Följ förslag
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={() => onSuggestionAction(suggestion.id, 'dismiss')}
                    >
                      Avfärda
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SmartHoldingSuggestions;
