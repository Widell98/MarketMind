
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SmartSuggestionItem from './SmartSuggestionItem';

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

interface SmartHoldingSuggestionsProps {
  holdingId: string;
  holdingName: string;
  holdingType: string;
  currentValue: number;
  portfolioPercentage: number;
  sector?: string;
  onSuggestionAction: (suggestionId: string, action: string) => void;
}

const SmartHoldingSuggestions: React.FC<SmartHoldingSuggestionsProps> = ({
  holdingId,
  holdingName,
  holdingType,
  currentValue,
  portfolioPercentage,
  sector,
  onSuggestionAction
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('dismissedSuggestions');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  
  // Check if suggestions should be shown (cooldown period)
  const shouldShowSuggestions = () => {
    const lastShown = localStorage.getItem(`suggestions_shown_${holdingId}`);
    if (!lastShown) return true;
    
    const cooldownHours = 8; // Show suggestions max once per 8 hours
    const timeDiff = Date.now() - parseInt(lastShown);
    return timeDiff > cooldownHours * 60 * 60 * 1000;
  };
  const { toast } = useToast();

  useEffect(() => {
    if (!shouldShowSuggestions()) {
      setSuggestions([]);
      return;
    }

    const generateAdvancedSuggestions = () => {
      const generatedSuggestions: SmartSuggestion[] = [];

      // Only show critical suggestions (priority 1 and 2)
      
      // Concentration risk analysis
      if (portfolioPercentage > 15 && holdingType === 'stock') {
        generatedSuggestions.push({
          id: `${holdingId}_concentration`,
          type: 'sell',
          confidence: 'high',
          title: 'Hög koncentrationsrisk',
          description: `${holdingName} utgör ${portfolioPercentage.toFixed(1)}% av portföljen - över rekommenderad gräns på 15%.`,
          detailedAnalysis: `En för stor andel av din portfölj är investerad i ${holdingName}. Detta ökar risken betydligt om aktien skulle falla kraftigt. Diversifiering är nyckeln till långsiktig förmögenhetstillväxt.`,
          impact: 'positive',
          priority: 1,
          riskLevel: 'high',
          potentialReturn: 'Minskad risk',
          timeframe: 'short',
          marketCondition: 'Oberoende av marknadsläge'
        });
      }

      // Cash deployment - only for very large amounts
      if (holdingType === 'cash' && currentValue > 100000) {
        generatedSuggestions.push({
          id: `${holdingId}_cash_deployment`,
          type: 'rebalance',
          confidence: 'high',
          title: 'Outnyttjad kapitaleffektivitet',
          description: 'Stor kassaposition genererar låg avkastning i nuvarande räntemiljö.',
          detailedAnalysis: `Du har ${(currentValue / 1000).toFixed(0)}k SEK i kassa som endast genererar minimal avkastning. Med aktuell inflation och låga räntor förlorar dessa pengar köpkraft över tid. Överväg att investera 60-80% i diversifierade tillgångar för att bibehålla köpkraft och skapa långsiktig tillväxt.`,
          impact: 'positive',
          priority: 1,
          riskLevel: 'low',
          potentialReturn: 'Inflation + 3-7% årligen',
          timeframe: 'long',
          marketCondition: 'Särskilt viktigt vid låga räntor'
        });
      }

      const filteredSuggestions = generatedSuggestions.filter(s => !dismissedSuggestions.has(s.id));
      setSuggestions(filteredSuggestions);
      
      // Mark suggestions as shown if any are displayed
      if (filteredSuggestions.length > 0) {
        localStorage.setItem(`suggestions_shown_${holdingId}`, Date.now().toString());
      }
    };

    generateAdvancedSuggestions();
  }, [holdingId, holdingName, holdingType, currentValue, portfolioPercentage, sector, dismissedSuggestions]);

  const handleSuggestionAction = (suggestionId: string, action: string) => {
    if (action === 'dismiss') {
      const updatedDismissed = new Set([...dismissedSuggestions, suggestionId]);
      setDismissedSuggestions(updatedDismissed);
      localStorage.setItem('dismissedSuggestions', JSON.stringify([...updatedDismissed]));
      toast({
        title: "Förslag avfärdat",
        description: "Förslaget har tagits bort från din lista.",
      });
    } else if (action === 'follow') {
      toast({
        title: "Förslag följt",
        description: "Du har valt att följa detta förslag. Läs mer i din portföljrådgivning.",
        duration: 5000,
      });
      onSuggestionAction(suggestionId, action);
    }
  };

  if (!isVisible || suggestions.length === 0) return null;

  const prioritizedSuggestions = suggestions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 1);

  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-3 h-3 text-primary" />
        <span className="text-xs font-medium text-foreground">AI-förslag</span>
        <Badge variant="outline" className="text-xs px-1 py-0 h-4">
          {suggestions.length}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="ml-auto w-4 h-4 p-0 hover:bg-destructive/10"
        >
          <X className="w-2 h-2" />
        </Button>
      </div>
      
      {prioritizedSuggestions.map((suggestion) => (
        <SmartSuggestionItem
          key={suggestion.id}
          suggestion={suggestion}
          onAction={handleSuggestionAction}
        />
      ))}
    </div>
  );
};

export default SmartHoldingSuggestions;
