
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, ChevronDown, ChevronUp, Building2, Target, TrendingUp } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';

interface AIRecommendationsSectionProps {
  onQuickChat?: (message: string) => void;
  onActionClick?: (action: string) => void;
}

const AIRecommendationsSection: React.FC<AIRecommendationsSectionProps> = ({
  onQuickChat,
  onActionClick
}) => {
  const { activePortfolio, loading } = usePortfolio();
  const [isExpanded, setIsExpanded] = useState(false);

  const recommendedStocks = activePortfolio?.recommended_stocks || [];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5" />
            AI-Rekommendationer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Laddar AI-rekommendationer...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendedStocks || recommendedStocks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Rekommendationer
          </CardTitle>
          <CardDescription className="text-sm">
            Personliga investeringsförslag baserat på din riskprofil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <Target className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-medium text-sm mb-1">Inga AI-rekommendationer tillgängliga</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Skapa en riskprofil för att få personliga investeringsförslag
              </p>
              <Button
                size="sm"
                onClick={() => onActionClick?.('create_risk_profile')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Skapa riskprofil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">AI-Rekommendationer</CardTitle>
              <CardDescription className="text-sm">
                {recommendedStocks.length} förslag baserat på din profil
              </CardDescription>
            </div>
          </div>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>
      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Always show first 3 recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {recommendedStocks.slice(0, 3).map((stock, index) => (
              <div key={index} className="p-3 border rounded-lg hover:shadow-sm transition-shadow bg-muted/30">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <h4 className="font-medium text-sm truncate">{stock.name || stock.symbol}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{stock.sector}</p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {stock.allocation || '5'}%
                  </Badge>
                </div>
                {stock.reasoning && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {stock.reasoning}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">AI-rekommenderad</span>
                </div>
              </div>
            ))}
          </div>

          {/* Collapsible content for remaining recommendations */}
          {recommendedStocks.length > 3 && (
            <CollapsibleContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendedStocks.slice(3).map((stock, index) => (
                  <div key={index + 3} className="p-3 border rounded-lg hover:shadow-sm transition-shadow bg-muted/30">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <h4 className="font-medium text-sm truncate">{stock.name || stock.symbol}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{stock.sector}</p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {stock.allocation || '5'}%
                      </Badge>
                    </div>
                    {stock.reasoning && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {stock.reasoning}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">AI-rekommenderad</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          )}

          {/* Show/Hide toggle text */}
          {recommendedStocks.length > 3 && (
            <div className="text-center pt-3 border-t">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Visa färre
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Visa alla {recommendedStocks.length} rekommendationer
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          )}
        </Collapsible>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-4 border-t mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickChat?.('NEW_SESSION:Diskutera AI-rekommendationer:Kan du hjälpa mig förstå och analysera de AI-genererade investeringsrekommendationerna i min portfölj?')}
            className="text-xs flex-1"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Diskutera med AI
          </Button>
          <Button
            size="sm"
            onClick={() => onActionClick?.('refresh_recommendations')}
            className="text-xs flex-1"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Uppdatera förslag
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRecommendationsSection;
