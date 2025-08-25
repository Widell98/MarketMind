
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
  AlertTriangle
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
  showAISuggestions?: boolean;
}

const HoldingCard: React.FC<HoldingCardProps> = ({
  holding,
  portfolioPercentage,
  currentPrice,
  onDiscuss,
  onEdit,
  onDelete,
  showAISuggestions = true
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

  return (
    <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 shadow-sm hover:shadow-primary/5">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:from-primary/15 group-hover:to-primary/10 transition-all duration-300">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-foreground truncate">{holding.name}</h3>
                  {holding.symbol && (
                    <Badge variant="outline" className="text-xs font-mono px-2 py-1 bg-muted/50">
                      {holding.symbol}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">
                    {holding.holding_type === 'cash' ? 'Kassa' : holding.holding_type}
                  </Badge>
                  {holding.sector && (
                    <span className="text-xs font-medium">{holding.sector}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Portfolio Percentage */}
            <div className="text-right flex-shrink-0 bg-muted/30 rounded-2xl px-4 py-3">
              <div className="text-xl font-bold text-foreground">
                {portfolioPercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                av portfölj
              </div>
            </div>
          </div>

          {/* Value Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-muted/20 rounded-xl p-4">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Värde</span>
              <div className="font-bold text-lg text-foreground mt-1">
                {formatCurrency(holding.current_value, holding.currency)}
              </div>
            </div>

            {!isCash && holding.quantity && (
              <div className="bg-muted/20 rounded-xl p-4">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Antal</span>
                <div className="font-bold text-lg text-foreground mt-1">
                  {holding.quantity}
                </div>
              </div>
            )}

            {!isCash && currentPrice && (
              <div className="col-span-2 bg-gradient-to-r from-muted/10 to-muted/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Aktuellt pris</span>
                  {currentPrice.hasValidPrice && (
                    <div className="flex items-center gap-2">
                      {currentPrice.changePercent >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
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
                <div className="font-bold text-lg text-foreground">
                  {formatCurrency(currentPrice.price, currentPrice.currency)}
                </div>
                {!currentPrice.hasValidPrice && (
                  <div className="flex items-center gap-2 mt-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Pris saknas</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="w-full bg-muted/40 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 rounded-full h-3 transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(portfolioPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!isCash && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-12 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary font-semibold transition-all duration-200 hover:shadow-sm hover:scale-[1.02]"
                onClick={() => onDiscuss(holding.name, holding.symbol)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Diskutera
              </Button>
            )}
            
            {isCash && onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-12 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary font-semibold transition-all duration-200 hover:shadow-sm hover:scale-[1.02]"
                onClick={() => onEdit(holding.id)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Redigera
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-[1.02]"
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
