
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Building2,
  AlertTriangle,
  ShoppingCart,
  Brain,
  User,
  Star,
  Tag
} from 'lucide-react';
import SmartHoldingSuggestions from './SmartHoldingSuggestions';

interface HoldingCardProps {
  holding: {
    id: string;
    name: string;
    symbol?: string;
    holding_type: string;
    current_value: number;
    quantity?: number;
    purchase_price?: number;
    sector?: string;
    currency: string;
    _originalData?: any;
  };
  portfolioPercentage: number;
  currentPrice?: {
    price: number;
    change: number;
    changePercent: number;
    hasValidPrice: boolean;
    currency: string;
  };
  onDiscuss: (name: string, symbol?: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onAddToPortfolio?: (id: string) => void;
  showAsRecommendation?: boolean;
  showAISuggestions?: boolean;
}

const HoldingCard: React.FC<HoldingCardProps> = ({
  holding,
  portfolioPercentage,
  currentPrice,
  onDiscuss,
  onEdit,
  onDelete,
  onAddToPortfolio,
  showAsRecommendation = false,
  showAISuggestions = false
}) => {
  const formatCurrency = (amount: number, currency = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getHoldingIcon = () => {
    if (holding.holding_type === 'cash') return Wallet;
    if (holding.holding_type === 'stock') return Building2;
    return TrendingUp;
  };

  const Icon = getHoldingIcon();
  const isCash = holding.holding_type === 'cash';
  const isRecommendation = holding.holding_type === 'recommendation';

  const handleSuggestionAction = (suggestionId: string, action: string) => {
    console.log(`Suggestion ${suggestionId} ${action}`);
    // Handle suggestion actions here
    if (action === 'accept') {
      // Navigate to relevant action (buy more, sell, etc.)
      if (suggestionId.includes('_opportunity')) {
        onDiscuss(holding.name, holding.symbol);
      }
    }
  };

  if (showAsRecommendation && isRecommendation) {
    // Recommendation layout similar to the original design
    const originalData = holding._originalData;
    
    return (
      <div className="p-3 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <h4 className="font-medium text-sm truncate">{holding.name}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  <Brain className="w-3 h-3 mr-1" />
                  AI
                </Badge>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {originalData?.description || originalData?.title || 'Rekommendation från AI'}
            </p>

            {originalData?.profiles && (
              <p className="text-xs text-muted-foreground mb-2">
                Av: {originalData.profiles.display_name || originalData.profiles.username}
              </p>
            )}

            {holding.sector && (
              <div className="flex items-center gap-1 flex-wrap mb-2">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {holding.sector}
                </Badge>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t">
              {onAddToPortfolio && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddToPortfolio(holding.id)}
                  className="text-xs bg-white hover:bg-green-50 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 flex-1"
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Lägg till i portfölj
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDiscuss(holding.name, holding.symbol)}
                className="text-xs bg-white hover:bg-purple-50 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300 flex-1"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Diskutera
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(holding.id, holding.name)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">{holding.name}</h3>
                  {holding.symbol && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {holding.symbol}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {holding.holding_type === 'cash' ? 'Kassa' : holding.holding_type}
                  </Badge>
                  {holding.sector && (
                    <span className="text-xs">{holding.sector}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Portfolio Percentage */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-foreground">
                {portfolioPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                av portfölj
              </div>
            </div>
          </div>

          {/* Value Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Värde:</span>
              <div className="font-semibold text-foreground">
                {formatCurrency(holding.current_value, holding.currency)}
              </div>
            </div>

            {!isCash && holding.quantity && (
              <div>
                <span className="text-muted-foreground">Antal:</span>
                <div className="font-semibold text-foreground">
                  {holding.quantity}
                </div>
              </div>
            )}

            {!isCash && currentPrice && (
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Aktuellt pris:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatCurrency(currentPrice.price, currentPrice.currency)}
                    </span>
                    {currentPrice.hasValidPrice && (
                      <div className="flex items-center gap-1">
                        {currentPrice.changePercent >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            currentPrice.changePercent >= 0
                              ? 'text-green-700 border-green-200 bg-green-50'
                              : 'text-red-700 border-red-200 bg-red-50'
                          }`}
                        >
                          {currentPrice.changePercent >= 0 ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                {!currentPrice.hasValidPrice && (
                  <div className="flex items-center gap-1 mt-1 text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-xs">Pris saknas</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min(portfolioPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isCash && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onDiscuss(holding.name, holding.symbol)}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Diskutera
              </Button>
            )}
            
            {isCash && onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onEdit(holding.id)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Redigera
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(holding.id, holding.name)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* AI Suggestions */}
          {showAISuggestions && (
            <SmartHoldingSuggestions
              holdingId={holding.id}
              holdingName={holding.name}
              holdingType={holding.holding_type}
              currentValue={holding.current_value}
              portfolioPercentage={portfolioPercentage}
              onSuggestionAction={handleSuggestionAction}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HoldingCard;
