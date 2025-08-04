
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
  const { toast } = useToast();

  useEffect(() => {
    const generateAdvancedSuggestions = () => {
      const generatedSuggestions: SmartSuggestion[] = [];

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

      // Sector diversification
      if (sector && portfolioPercentage > 10) {
        generatedSuggestions.push({
          id: `${holdingId}_sector_diversity`,
          type: 'diversify',
          confidence: 'medium',
          title: 'Sektordiversifiering behövs',
          description: `Stor exponering mot ${sector}-sektorn. Överväg diversifiering.`,
          detailedAnalysis: `Du har en betydande exponering mot ${sector}-sektorn. Olika sektorer presterar olika i olika marknadsförhållanden. Genom att sprida dina investeringar över fler sektorer minskar du risken för att hela portföljen påverkas negativt av problem i en specifik bransch.`,
          impact: 'positive',
          priority: 2,
          riskLevel: 'medium',
          potentialReturn: 'Stabilare avkastning',
          timeframe: 'medium',
          marketCondition: 'Särskilt viktigt vid sektorspecifika nedgångar'
        });
      }

      // Growth opportunity
      if (portfolioPercentage < 5 && currentValue > 10000 && holdingType === 'stock') {
        generatedSuggestions.push({
          id: `${holdingId}_growth_opportunity`,
          type: 'buy_more',
          confidence: 'medium',
          title: 'Tillväxtmöjlighet identifierad',
          description: 'Stark fundamental analys och tekniska indikatorer tyder på uppsida.',
          detailedAnalysis: `${holdingName} visar starka fundamentala värden och teknisk momentum. Positionen är för närvarande underallokeraad i din portfölj. Marknadssentimentet är positivt och analytikers konsensus pekar på uppsida de kommande kvartalen.`,
          impact: 'positive',
          priority: 2,
          riskLevel: 'medium',
          potentialReturn: '15-25% över 12 månader',
          timeframe: 'medium',
          marketCondition: 'Gynnsamt vid fortsatt bull market'
        });
      }

      // Cash deployment
      if (holdingType === 'cash' && currentValue > 50000) {
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

      // Hold recommendation for stable positions
      if (portfolioPercentage >= 5 && portfolioPercentage <= 15 && holdingType === 'stock') {
        generatedSuggestions.push({
          id: `${holdingId}_optimal_hold`,
          type: 'hold',
          confidence: 'high',
          title: 'Optimal allokering',
          description: 'Nuvarande position är väl balanserad inom rekommenderade ramar.',
          detailedAnalysis: `${holdingName} utgör ${portfolioPercentage.toFixed(1)}% av din portfölj, vilket är inom det optimala spannet på 5-15% för enskilda aktier. Positionen bidrar till diversifiering utan att skapa överdriven koncentrationsrisk. Fortsätt att hålla och övervaka utvecklingen.`,
          impact: 'neutral',
          priority: 3,
          riskLevel: 'low',
          potentialReturn: 'Följer marknaden',
          timeframe: 'long',
          marketCondition: 'Stabil i alla marknadslägen'
        });
      }

      // Monitor for volatility
      if (holdingType === 'stock' && portfolioPercentage > 8) {
        generatedSuggestions.push({
          id: `${holdingId}_monitor`,
          type: 'monitor',
          confidence: 'medium',
          title: 'Aktiv övervakning rekommenderas',
          description: 'Betydande position som kräver regelbunden uppföljning.',
          detailedAnalysis: `Med en allokering på ${portfolioPercentage.toFixed(1)}% representerar ${holdingName} en betydande del av din portfölj. Övervaka kvartalsrapporter, analytiker-upgrades/downgrades, och sektorspecifika nyheter. Sätt upp prisalarmer vid ±10% för att få notifikationer om stora rörelser.`,
          impact: 'neutral',
          priority: 4,
          riskLevel: 'medium',
          potentialReturn: 'Förebygger förluster',
          timeframe: 'short',
          marketCondition: 'Kritiskt vid marknadsvolatilitet'
        });
      }

      setSuggestions(generatedSuggestions.filter(s => !dismissedSuggestions.has(s.id)));
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
    .slice(0, 3);

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
      
      {suggestions.length > 3 && (
        <Button variant="ghost" size="sm" className="w-full text-xs h-6 text-muted-foreground">
          +{suggestions.length - 3} fler
        </Button>
      )}
    </div>
  );
};

export default SmartHoldingSuggestions;
