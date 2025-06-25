
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  Edit3,
  Check,
  X,
  MessageCircle,
  ArrowRightLeft,
  Target,
  Lightbulb
} from 'lucide-react';

interface InteractivePortfolioProps {
  portfolio: any;
  onQuickChat: (message: string) => void;
}

const InteractivePortfolio: React.FC<InteractivePortfolioProps> = ({ 
  portfolio, 
  onQuickChat 
}) => {
  const [editingHolding, setEditingHolding] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState('');

  const holdings = portfolio?.recommended_stocks || [];

  const handleEditClick = (symbol: string) => {
    setEditingHolding(symbol);
    setNewSymbol('');
  };

  const handleCancelEdit = () => {
    setEditingHolding(null);
    setNewSymbol('');
  };

  const handleReplaceStock = (oldSymbol: string, newSymbol: string) => {
    if (!newSymbol.trim()) return;
    
    const message = `Jag vill ersätta ${oldSymbol} med ${newSymbol.toUpperCase()} i min portfölj. Kan du analysera om det är en bra idé och genomföra bytet om det passar min riskprofil?`;
    onQuickChat(message);
    setEditingHolding(null);
    setNewSymbol('');
  };

  const quickPortfolioActions = [
    {
      title: "Optimera portföljen",
      description: "Få förslag på förbättringar",
      action: () => onQuickChat("Analysera min portfölj och ge konkreta förslag på hur jag kan optimera den för bättre risk-justerad avkastning"),
      icon: Target,
      color: "text-blue-600"
    },
    {
      title: "Rebalansera innehav",
      description: "Justera fördelningen",
      action: () => onQuickChat("Hjälp mig att rebalansera min portfölj. Vilka innehav borde jag öka eller minska?"),
      icon: ArrowRightLeft,
      color: "text-green-600"
    },
    {
      title: "Hitta nya möjligheter",
      description: "Upptäck intressanta aktier",
      action: () => onQuickChat("Föreslå några nya aktier som skulle passa bra i min portfölj baserat på min riskprofil och nuvarande innehav"),
      icon: Lightbulb,
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Portfolio Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Portföljhantering</CardTitle>
          <CardDescription className="text-sm">
            Hantera dina innehav genom att prata med AI:n
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3">
            {quickPortfolioActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-4 text-left"
                  onClick={action.action}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${action.color}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Holdings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Dina innehav
            <Badge variant="secondary" className="text-xs">
              {holdings.length} aktier
            </Badge>
          </CardTitle>
          <CardDescription className="text-sm">
            Klicka på en aktie för att ersätta den eller prata med AI:n
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {holdings.length > 0 ? (
            <div className="space-y-3">
              {holdings.map((stock: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium text-sm">{stock.symbol || `Aktie ${index + 1}`}</h4>
                        <p className="text-xs text-muted-foreground">
                          {stock.allocation}% av portföljen
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {stock.expected_return && (
                      <Badge 
                        variant={stock.expected_return >= 0 ? "default" : "destructive"} 
                        className="text-xs"
                      >
                        {stock.expected_return >= 0 ? '+' : ''}{stock.expected_return}%
                      </Badge>
                    )}
                    
                    {editingHolding === stock.symbol ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="AAPL"
                          value={newSymbol}
                          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                          className="w-20 h-8 text-xs"
                          maxLength={10}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleReplaceStock(stock.symbol, newSymbol)}
                          disabled={!newSymbol.trim()}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(stock.symbol)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onQuickChat(`Berätta mer om ${stock.symbol} och varför den är med i min portfölj. Vad är riskerna och möjligheterna?`)}
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm">Ingen portfölj genererad än</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Interaction Tip */}
      <Alert>
        <MessageCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips:</strong> Du kan säga till AI:n "Ersätt AAPL med MSFT" eller "Lägg till mer tech-aktier" 
          för att göra ändringar i din portfölj.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default InteractivePortfolio;
