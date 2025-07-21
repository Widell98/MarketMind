
import React, { useState } from 'react';
import { Bot, User, Plus, Check, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserHoldings } from '@/hooks/useUserHoldings';

interface StockSuggestion {
  symbol: string;
  name: string;
  sector?: string;
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
  const { addHolding, actualHoldings } = useUserHoldings();
  const { toast } = useToast();

  // Parse markdown formatting
  const parseMarkdown = (text: string): string => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
  };

  // Enhanced stock suggestion extraction focusing on numbered lists and proper validation
  const extractStockSuggestions = (content: string): StockSuggestion[] => {
    const suggestions: StockSuggestion[] = [];
    
    // Prioritized patterns - most specific first
    const patterns = [
      // Pattern 1: "1. Company Name (TICKER)" - numbered lists (highest priority)
      /^\d+\.\s*([^(]+?)\s*\(([A-Z]{1,6})\)/gm,
      
      // Pattern 2: "**Company Name (TICKER)**" - bold format
      /\*\*([^*]+?)\*\*\s*\(([A-Z]{1,6})\)/g,
      
      // Pattern 3: "- Company Name (TICKER)" - bullet points
      /^[-•·▪▫]\s*([^(]+?)\s*\(([A-Z]{1,6})\)/gm,
      
      // Pattern 4: "Company Name (TICKER):" - with colon
      /([A-ZÅÄÖ][a-zåäöA-Z\s&.\-\u00C0-\u017F]+?)\s*\(([A-Z]{1,6})\):/g,
      
      // Pattern 5: "Company Name (TICKER)" - general pattern at sentence start
      /^([A-ZÅÄÖ][a-zåäöA-Z\s&.\-\u00C0-\u017F]+?)\s*\(([A-Z]{1,6})\)/gm,
      
      // Pattern 6: ETF/Fund patterns
      /([A-ZÅÄÖ][a-zåäöA-Z\s&.\-\u00C0-\u017F]+?)\s+(?:ETF|Fond|Index)\s*\(([A-Z]{1,6})\)/gi,
      
      // Pattern 7: Swedish specific patterns
      /([A-ZÅÄÖ][a-zåäöA-Z\s&.\-\u00C0-\u017F]+?)\s+(?:aktie|bolag|AB)\s*\(([A-Z]{1,6})\)/gi,
      
      // Pattern 8: "TICKER: Company Name" format
      /([A-Z]{2,6}):\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.\-\u00C0-\u017F]+?)(?=\s*[-\n.,]|$)/g
    ];

    // Get existing holdings symbols to filter out
    const existingSymbols = new Set(
      actualHoldings.map(holding => holding.symbol?.toUpperCase()).filter(Boolean)
    );

    // Common Swedish words and phrases to exclude
    const excludeWords = new Set([
      'och', 'eller', 'samt', 'med', 'utan', 'för', 'till', 'från', 'av', 'på', 'i', 
      'är', 'har', 'kan', 'ska', 'måste', 'borde', 'skulle', 'denna', 'detta', 'den',
      'det', 'att', 'som', 'vid', 'under', 'över', 'genom', 'inom', 'mot', 'enligt',
      'allokering', 'procent', 'investering', 'portfölj', 'aktie', 'fond', 'bolag',
      'företag', 'marknad', 'sektor', 'risk', 'avkastning', 'tillväxt', 'stabilt',
      'stark', 'god', 'hög', 'låg', 'mellan', 'cirka', 'runt', 'ungefär'
    ]);

    patterns.forEach((pattern, patternIndex) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(content)) !== null) {
        let name, symbol, sector;
        
        // Handle different capture group orders based on pattern
        if (patternIndex === 7) { 
          // Pattern 8: TICKER: Company Name
          symbol = match[1].trim();
          name = match[2].trim();
        } else {
          // Most patterns: Company Name (TICKER) format
          name = match[1].trim();
          symbol = match[2].trim();
        }
        
        // Clean up the name - remove numbers, colons, and common prefixes
        name = name.replace(/^\d+\.\s*/, '').trim(); // Remove leading numbers
        name = name.replace(/^[-•·▪▫]\s*/, '').trim(); // Remove bullet points
        name = name.replace(/:\s*$/, '').trim(); // Remove trailing colons
        name = name.replace(/^(Aktie|Bolag|AB|Inc|Corp|Ltd)[\s:]/i, '').trim();
        name = name.replace(/[\s:](AB|Inc|Corp|Ltd)$/i, '').trim();
        name = name.replace(/\s+/g, ' '); // Normalize spaces
        
        // Enhanced validation checks
        const isValidSuggestion = (
          name.length >= 2 && 
          name.length <= 100 &&
          symbol.length >= 1 &&
          symbol.length <= 6 &&
          !existingSymbols.has(symbol.toUpperCase()) &&
          !suggestions.find(s => s.symbol === symbol.toUpperCase()) &&
          // Check if name contains actual letters (not just numbers/symbols)
          /[a-öA-Ö]/.test(name) &&
          // Check if symbol is all caps
          /^[A-Z]+$/.test(symbol) &&
          // Exclude common Swedish words
          !excludeWords.has(name.toLowerCase()) &&
          // Exclude very short names that are likely words
          !(name.length <= 3 && !/^[A-Z]/.test(name)) &&
          // Exclude names that are just numbers or percentages
          !/^\d+%?$/.test(name.trim()) &&
          // Exclude names that contain only common words
          !name.toLowerCase().split(/\s+/).every(word => excludeWords.has(word))
        );

        if (isValidSuggestion) {
          suggestions.push({
            name: name,
            symbol: symbol.toUpperCase(),
            sector: sector || undefined,
            reason: 'AI-rekommendation'
          });
        }
      }
    });

    // Remove duplicates and sort by name
    const uniqueSuggestions = suggestions.reduce((acc, current) => {
      const exists = acc.find(item => item.symbol === current.symbol);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as StockSuggestion[]);

    console.log('Extracted stock suggestions:', uniqueSuggestions);
    return uniqueSuggestions.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
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
        sector: suggestion.sector || 'Okänd',
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

  // Format message content
  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // Handle headers
      if (line.startsWith('###')) {
        return (
          <h3 key={index} className="font-semibold text-base sm:text-lg mt-4 mb-3 text-gray-900 dark:text-gray-100 leading-tight"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(line.replace('###', '').trim()) }}
          />
        );
      }
      
      if (line.startsWith('##')) {
        return (
          <h2 key={index} className="font-semibold text-lg sm:text-xl mt-5 mb-3 text-gray-900 dark:text-gray-100 leading-tight"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(line.replace('##', '').trim()) }}
          />
        );
      }
      
      // Handle lists
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return (
          <li key={index} className="ml-4 sm:ml-5 text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed mb-2"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(line.trim().substring(1).trim()) }}
          />
        );
      }
      
      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return (
          <li key={index} className="ml-4 sm:ml-5 text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed mb-2 list-decimal"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(line.trim().replace(/^\d+\.\s*/, '')) }}
          />
        );
      }
      
      // Handle regular text with markdown
      const parsedContent = parseMarkdown(line);
      
      return (
        <p 
          key={index} 
          className="text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-3 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: parsedContent }}
        />
      );
    });
  };

  return (
    <div className={`flex gap-3 sm:gap-4 items-start w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' ? (
        <>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 max-w-[75%]">
            <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-4 sm:p-5 border shadow-sm">
              <div className="ai-response">
                {formatMessageContent(message.content)}
              </div>
              
              {/* Stock suggestions - now shows ALL suggestions dynamically */}
              {stockSuggestions.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Aktieförslag från AI ({stockSuggestions.length} st)
                  </p>
                  <div className="flex flex-col gap-3">
                    {stockSuggestions.map((suggestion) => {
                      const isAdded = addedStocks.has(suggestion.symbol);
                      return (
                        <div
                          key={suggestion.symbol}
                          className="flex items-center justify-between gap-4 bg-background/80 rounded-lg p-4 border border-border/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-foreground truncate">
                              {suggestion.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {suggestion.symbol}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={isAdded ? "outline" : "default"}
                            onClick={() => handleAddStock(suggestion)}
                            disabled={isAdded}
                            className="h-9 px-4 text-sm flex-shrink-0"
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Tillagd
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
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
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                  {message.context.isExchangeRequest && (
                    <Badge variant="outline" className="text-sm">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Portföljförslag
                    </Badge>
                  )}
                  {message.context.confidence && (
                    <Badge variant="outline" className="text-sm">
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
          <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-tr-lg p-4 sm:p-5 border border-primary/20 shadow-sm">
            <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs opacity-70 mt-2">
              {message.timestamp.toLocaleTimeString('sv-SE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMessage;
