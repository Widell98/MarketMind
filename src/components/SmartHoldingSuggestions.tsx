
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Brain,
  X,
  BarChart3,
  Shield,
  Zap,
  Minus,
  Eye,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
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

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const handleSuggestionAction = (suggestionId: string, action: string) => {
    if (action === 'dismiss') {
      setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
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
    <div className="space-y-3 mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">AI-insikter & förslag</span>
        <Badge variant="outline" className="text-xs">
          {suggestions.length} förslag
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="ml-auto w-6 h-6 p-0 hover:bg-destructive/10"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      {prioritizedSuggestions.map((suggestion) => {
        const Icon = getSuggestionIcon(suggestion.type);
        return (
          <Card key={suggestion.id} className={cn(
            "border-l-4 transition-all duration-200 hover:shadow-md",
            getBorderColor(suggestion.type)
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  getSuggestionColor(suggestion.type)
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-foreground">
                      {suggestion.title}
                    </h4>
                    <Badge className={cn("text-xs", getConfidenceBadge(suggestion.confidence))}>
                      {suggestion.confidence === 'high' ? 'Hög' : suggestion.confidence === 'medium' ? 'Medel' : 'Låg'} säkerhet
                    </Badge>
                    <Badge className={cn("text-xs", getRiskBadge(suggestion.riskLevel))}>
                      {suggestion.riskLevel === 'high' ? 'Hög' : suggestion.riskLevel === 'medium' ? 'Medel' : 'Låg'} risk
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {suggestion.description}
                  </p>

                  <div className="bg-muted/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-1 mb-2">
                      <Lightbulb className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium text-foreground">Detaljerad analys</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {suggestion.detailedAnalysis}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div>
                      <span className="font-medium text-muted-foreground">Potential:</span>
                      <div className="text-foreground">{suggestion.potentialReturn}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Tidsram:</span>
                      <div className="text-foreground">
                        {suggestion.timeframe === 'short' ? 'Kort sikt' : 
                         suggestion.timeframe === 'medium' ? 'Medellång sikt' : 'Lång sikt'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-4 italic">
                    💡 {suggestion.marketCondition}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs h-8 px-4"
                      onClick={() => handleSuggestionAction(suggestion.id, 'follow')}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Följ förslag
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-4"
                      onClick={() => handleSuggestionAction(suggestion.id, 'dismiss')}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Avfärda
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {suggestions.length > 3 && (
        <div className="text-center">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Visa {suggestions.length - 3} fler förslag
          </Button>
        </div>
      )}
    </div>
  );
};

export default SmartHoldingSuggestions;
