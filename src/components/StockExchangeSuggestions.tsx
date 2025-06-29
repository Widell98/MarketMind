
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StockSuggestion {
  name: string;
  ticker: string;
  reason: string;
  weight: string;
  sector: string;
  marketCap: string;
  risk: 'low' | 'medium' | 'high';
}

interface StockExchangeSuggestionsProps {
  suggestions: StockSuggestion[];
  onAcceptSuggestion?: (suggestion: StockSuggestion) => void;
  onViewDetails?: (ticker: string) => void;
}

const StockExchangeSuggestions: React.FC<StockExchangeSuggestionsProps> = ({
  suggestions,
  onAcceptSuggestion,
  onViewDetails
}) => {
  const { toast } = useToast();

  const handleAcceptSuggestion = (suggestion: StockSuggestion) => {
    toast({
      title: "Förslag noterat",
      description: `Du har noterat förslaget att investera i ${suggestion.name}. Kom ihåg att göra egen research innan du investerar.`,
    });
    onAcceptSuggestion?.(suggestion);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <ArrowRightLeft className="w-5 h-5" />
          AI-Förslag för Portföljändringar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  {suggestion.name}
                  <Badge variant="outline" className="text-xs">
                    {suggestion.ticker}
                  </Badge>
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {suggestion.reason}
                </p>
              </div>
              <Badge className={getRiskColor(suggestion.risk)}>
                {suggestion.risk === 'low' ? 'Låg risk' : 
                 suggestion.risk === 'medium' ? 'Medium risk' : 'Hög risk'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <span className="font-medium text-gray-500">Föreslagen vikt:</span>
                <div className="text-gray-900">{suggestion.weight}</div>
              </div>
              <div>
                <span className="font-medium text-gray-500">Sektor:</span>
                <div className="text-gray-900">{suggestion.sector}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AlertTriangle className="w-3 h-3" />
                <span>Detta är utbildningssyfte, inte investeringsråd</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails?.(suggestion.ticker)}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Detaljer
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptSuggestion(suggestion)}
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Notera förslag
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Viktigt:</strong> Dessa förslag är endast för utbildningsändamål. 
              Gör alltid egen research och konsultera en licensierad finansiell rådgivare innan du fattar investeringsbeslut.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockExchangeSuggestions;
