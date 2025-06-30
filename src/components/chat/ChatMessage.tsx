
import React, { useState } from 'react';
import { Bot, User, Plus, Check, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserHoldings } from '@/hooks/useUserHoldings';

interface StockSuggestion {
  symbol: string;
  name: string;
  reason?: string;
}

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: {
      analysisType?: string;
      confidence?: number;
      isExchangeRequest?: boolean;
    };
  };
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [addedStocks, setAddedStocks] = useState<Set<string>>(new Set());
  const { addHolding } = useUserHoldings();
  const { toast } = useToast();

  // Parse markdown formatting
  const parseMarkdown = (text: string): string => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
  };

  // Extract stock suggestions from AI message
  const extractStockSuggestions = (content: string): StockSuggestion[] => {
    const suggestions: StockSuggestion[] = [];
    
    // Look for patterns like "Förslag: [Company] ([TICKER])" or "[Company] ([TICKER])"
    const patterns = [
      /(?:Förslag:|Rekommendation:)\s*([^(]+)\s*\(([A-Z]{2,5})\)/gi,
      /([A-ZÅÄÖ][a-zåäö\s&-]+)\s*\(([A-Z]{2,5})\)/g,
      /\*\*([^*]+)\*\*\s*\(([A-Z]{2,5})\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1].trim();
        const symbol = match[2].trim();
        
        // Skip if already added or if it's not a proper stock suggestion
        if (!suggestions.find(s => s.symbol === symbol) && 
            name.length > 2 && 
            symbol.length >= 2 && 
            symbol.length <= 5) {
          suggestions.push({
            name,
            symbol,
            reason: 'AI-rekommendation'
          });
        }
      }
    });

    return suggestions;
  };

  const stockSuggestions = message.role === 'assistant' ? extractStockSuggestions(message.content) : [];

  const handleAddStock = async (suggestion: StockSuggestion) => {
    try {
      const success = await addHolding({
        holding_type: 'recommendation',
        name: suggestion.name,
        symbol: suggestion.symbol,
        quantity: 0,
        current_value: 0,
        purchase_price: 0,
        currency: 'SEK',
        sector: 'Okänd',
        market: 'Swedish'
      });

      if (success) {
        setAddedStocks(prev => new Set([...prev, suggestion.symbol]));
        toast({
          title: "Aktie tillagd!",
          description: `${suggestion.name} (${suggestion.symbol}) har lagts till i dina AI-rekommendationer`,
        });
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till aktien. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // Handle headers
      if (line.startsWith('###')) {
        return (
          <h3 key={index} className="font-semibold text-sm sm:text-base mt-3 mb-2 text-gray-900 dark:text-gray-100 leading-tight"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(line.replace('###', '').trim()) }}
          />
        );
      }
      
      if (line.startsWith('##')) {
        return (
          <h2 key={index} className="font-semibold text-base sm:text-lg mt-4 mb-2 text-gray-900 dark:text-gray-100 leading-tight"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(line.replace('##', '').trim()) }}
          />
        );
      }
      
      // Handle lists
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return (
          <li key={index} className="ml-3 sm:ml-4 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-1"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(line.trim().substring(1).trim()) }}
          />
        );
      }
      
      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return (
          <li key={index} className="ml-3 sm:ml-4 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-1 list-decimal"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(line.trim().replace(/^\d+\.\s*/, '')) }}
          />
        );
      }
      
      // Handle regular text with markdown
      const parsedContent = parseMarkdown(line);
      
      return (
        <p 
          key={index} 
          className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-2 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: parsedContent }}
        />
      );
    });
  };

  return (
    <div className="flex gap-2 sm:gap-3 items-start w-full">
      {message.role === 'assistant' ? (
        <>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 max-w-full">
            <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-3 sm:p-4 border shadow-sm max-w-full overflow-hidden">
              <div className="ai-response max-w-full overflow-hidden">
                {formatMessageContent(message.content)}
              </div>
              
              {/* Stock suggestions */}
              {stockSuggestions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Aktieförslag från AI
                  </p>
                  <div className="flex flex-col gap-2">
                    {stockSuggestions.map((suggestion) => {
                      const isAdded = addedStocks.has(suggestion.symbol);
                      return (
                        <div
                          key={suggestion.symbol}
                          className="flex items-center justify-between gap-3 bg-background/80 rounded-lg p-3 border border-border/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                              {suggestion.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.symbol}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={isAdded ? "outline" : "default"}
                            onClick={() => handleAddStock(suggestion)}
                            disabled={isAdded}
                            className="h-8 px-3 text-xs flex-shrink-0"
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Tillagd
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Lägg till
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Context badges */}
              {message.context && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                  {message.context.isExchangeRequest && (
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Portföljförslag
                    </Badge>
                  )}
                  {message.context.confidence && (
                    <Badge variant="outline" className="text-xs">
                      Säkerhet: {Math.round(message.context.confidence * 100)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-primary/10 backdrop-blur-sm rounded-2xl rounded-tr-lg p-2.5 sm:p-3 border border-primary/20 shadow-sm max-w-[85%] sm:max-w-md order-2">
            <p className="text-sm sm:text-base text-foreground break-words">{message.content}</p>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-1 order-1">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMessage;
