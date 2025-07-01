
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Edit3,
  Check,
  X,
  MessageCircle,
  ArrowRightLeft,
  Target,
  Lightbulb,
  Trash2
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

  const handleDeleteHolding = (symbol: string) => {
    const message = `Jag vill ta bort ${symbol} från min portfölj. Kan du analysera påverkan på min totala riskprofil och diversifiering?`;
    onQuickChat(message);
  };

  const quickPortfolioActions = [
    {
      title: "Optimera portföljen",
      description: "Få AI-förslag för förbättringar",
      action: () => onQuickChat("Analysera min portfölj och ge konkreta förslag på hur jag kan optimera den för bättre risk-justerad avkastning"),
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Rebalansera innehav",
      description: "Justera fördelningen automatiskt",
      action: () => onQuickChat("Hjälp mig att rebalansera min portfölj. Vilka innehav borde jag öka eller minska för optimal fördelning?"),
      icon: ArrowRightLeft,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Hitta nya möjligheter",
      description: "AI upptäcker intressanta aktier",
      action: () => onQuickChat("Föreslå några nya aktier som skulle passa bra i min portfölj baserat på min riskprofil och nuvarande innehav"),
      icon: Lightbulb,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
    }
  ];

  return (
    <div className="w-full space-y-4">
      {/* AI-drivna snabbåtgärder */}
      <Card>
        <CardHeader className="pb-3 p-4">
          <CardTitle className="text-base sm:text-lg">AI-assisterade åtgärder</CardTitle>
          <CardDescription className="text-sm">
            Låt AI:n optimera din portfölj
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 gap-3">
            {quickPortfolioActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`justify-start h-auto p-4 text-left w-full ${action.bgColor} border-2 hover:scale-[1.02] transition-all duration-200`}
                  onClick={action.action}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${action.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{action.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Aktuella innehav med redigeringsmöjligheter */}
      {holdings.length > 0 && (
        <Card>
          <CardHeader className="pb-3 p-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="truncate">Hantera innehav</span>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {holdings.length} aktier
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              Redigera, ersätt eller diskutera dina aktier med AI:n
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {holdings.map((stock: any, index: number) => (
                <div 
                  key={index}
                  className="p-3 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {stock.symbol || `Aktie ${index + 1}`}
                        </h4>
                        <Badge 
                          variant={stock.expected_return >= 0 ? "default" : "destructive"} 
                          className="text-xs flex-shrink-0"
                        >
                          {stock.expected_return >= 0 ? '+' : ''}{stock.expected_return}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{stock.allocation}% av portföljen</span>
                        {stock.sector && <span>{stock.sector}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {editingHolding === stock.symbol ? (
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="AAPL"
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                            className="w-16 h-7 text-xs"
                            maxLength={10}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleReplaceStock(stock.symbol, newSymbol)}
                            disabled={!newSymbol.trim()}
                            className="h-7 w-7 p-0"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="h-7 w-7 p-0"
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
                            className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            title="Ersätt aktie"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onQuickChat(`Berätta mer om ${stock.symbol} och varför den är med i min portfölj. Vad är riskerna och möjligheterna?`)}
                            className="h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                            title="Diskutera med AI"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHolding(stock.symbol)}
                            className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                            title="Ta bort från portfölj"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Interaction Tips */}
      <Alert>
        <MessageCircle className="h-4 w-4 flex-shrink-0" />
        <AlertDescription className="text-sm">
          <strong>AI-tips:</strong> Säg "Ersätt AAPL med MSFT", "Lägg till mer tech-aktier" 
          eller "Analysera min risk" för att göra ändringar och få insikter om din portfölj.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default InteractivePortfolio;
