
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
    
    // Navigate to AI chat and pre-fill the input (without sending)
    navigate('/ai-chatt');
    
    // Small delay to ensure navigation is complete before dispatching event
    setTimeout(() => {
      const event = new CustomEvent('prefillChatInput', {
        detail: { message }
      });
      window.dispatchEvent(event);
    }, 100);
    
    setEditingHolding(null);
    setNewSymbol('');
  };

  const handleQuickAction = (message: string) => {
    // Navigate to AI chat and pre-fill the input (without sending)
    navigate('/ai-chatt');
    
    // Small delay to ensure navigation is complete before dispatching event
    setTimeout(() => {
      const event = new CustomEvent('prefillChatInput', {
        detail: { message }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  const quickPortfolioActions = [
    {
      title: "Optimera portföljen",
      description: "Få förslag på förbättringar",
      message: "Analysera min portfölj och ge konkreta förslag på hur jag kan optimera den för bättre risk-justerad avkastning",
      icon: Target,
      color: "text-blue-600"
    },
    {
      title: "Rebalansera innehav",
      description: "Justera fördelningen",
      message: "Hjälp mig att rebalansera min portfölj. Vilka innehav borde jag öka eller minska?",
      icon: ArrowRightLeft,
      color: "text-green-600"
    },
    {
      title: "Hitta nya möjligheter",
      description: "Upptäck intressanta aktier",
      message: "Föreslå några nya aktier som skulle passa bra i min portfölj baserat på min riskprofil och nuvarande innehav",
      icon: Lightbulb,
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      {/* Portfolio Actions */}
      <Card className="w-full">
        <CardHeader className="pb-3 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base">Portföljhantering</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Hantera dina innehav genom att prata med AI:n
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {quickPortfolioActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-3 sm:p-4 text-left w-full min-w-0"
                  onClick={() => handleQuickAction(action.message)}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 ${action.color}`} />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="font-medium text-xs sm:text-sm truncate">{action.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-1">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Holdings */}
      {holdings.length > 0 && (
        <Card className="w-full">
          <CardHeader className="pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2 min-w-0">
              <span className="truncate flex-1">Dina AI-rekommendationer</span>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {holdings.length} aktier
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Klicka på en aktie för att ersätta den eller prata med AI:n
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-4 md:p-6">
            <div className="space-y-2 sm:space-y-3">
              {holdings.map((stock: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2 min-w-0"
                >
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h4 className="font-medium text-xs sm:text-sm truncate">{stock.symbol || `Aktie ${index + 1}`}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {stock.allocation}% av portföljen
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {stock.expected_return && (
                      <Badge 
                        variant={stock.expected_return >= 0 ? "default" : "destructive"} 
                        className="text-xs whitespace-nowrap hidden xs:inline-flex"
                      >
                        {stock.expected_return >= 0 ? '+' : ''}{stock.expected_return}%
                      </Badge>
                    )}
                    
                    {editingHolding === stock.symbol ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Input
                          placeholder="AAPL"
                          value={newSymbol}
                          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                          className="w-12 sm:w-16 h-6 sm:h-8 text-xs px-1 sm:px-2"
                          maxLength={10}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleReplaceStock(stock.symbol, newSymbol)}
                          disabled={!newSymbol.trim()}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(stock.symbol)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAction(`Berätta mer om ${stock.symbol} och varför den är med i min portfölj. Vad är riskerna och möjligheterna?`)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Interaction Tip */}
      <Alert className="w-full">
        <MessageCircle className="h-4 w-4 flex-shrink-0" />
        <AlertDescription className="text-xs sm:text-sm">
          <strong>Tips:</strong> Du kan säga till AI:n "Ersätt AAPL med MSFT" eller "Lägg till mer tech-aktier" 
          för att göra ändringar i din portfölj.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default InteractivePortfolio;
