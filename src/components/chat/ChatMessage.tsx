import React, { useState } from 'react';
import { Bot, User, Plus, Check, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { parseMarkdownSafely } from '@/utils/sanitizer';
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
const ChatMessage = ({
  message
}: ChatMessageProps) => {
  const [addedStocks, setAddedStocks] = useState<Set<string>>(new Set());
  const {
    addHolding,
    actualHoldings
  } = useUserHoldings();
  const {
    toast
  } = useToast();

  // Parse markdown formatting - replaced with secure version

  // Enhanced stock suggestion extraction with more comprehensive patterns
  const extractStockSuggestions = (content: string): StockSuggestion[] => {
    const suggestions: StockSuggestion[] = [];

    // Multiple regex patterns to catch different formats
    const patterns = [
    // Pattern 1: "Förslag: Company Name (TICKER)"
    /(?:Förslag|Rekommendation|Aktie):\s*([^(]+?)\s*\(([A-Z]{1,6})\)/gi,
    // Pattern 2: "**Company Name** (TICKER)"
    /\*\*([^*]+?)\*\*\s*\(([A-Z]{1,6})\)/g,
    // Pattern 3: "Company Name (TICKER)" - general pattern
    /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+?)\s*\(([A-Z]{1,6})\)/g,
    // Pattern 4: "1. Company Name (TICKER)" - numbered lists
    /\d+\.\s*([^(]+?)\s*\(([A-Z]{1,6})\)/g,
    // Pattern 5: "- Company Name (TICKER)" - bullet points
    /-\s*([^(]+?)\s*\(([A-Z]{1,6})\)/g,
    // Pattern 6: "• Company Name (TICKER)" - bullet points with bullet
    /•\s*([^(]+?)\s*\(([A-Z]{1,6})\)/g,
    // Pattern 7: TICKER followed by company name
    /([A-Z]{2,6}):\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+)/g,
    // Pattern 8: Company name with ticker in brackets at end of sentence
    /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{3,})\s+\(([A-Z]{1,6})\)(?=[\s.,!?]|$)/g,
    // Pattern 9: Company (TICKER) - Sektor: SectorName
    /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+?)\s*\(([A-Z]{1,6})\)\s*-\s*Sektor:\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+)/g];

    // Get existing holdings symbols to filter out
    const existingSymbols = new Set(actualHoldings.map(holding => holding.symbol?.toUpperCase()).filter(Boolean));
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        let name, symbol, sector;

        // Handle different capture group orders based on pattern
        if (patterns.indexOf(pattern) === 6) {
          // Pattern 7: TICKER: Company
          symbol = match[1].trim();
          name = match[2].trim();
        } else if (patterns.indexOf(pattern) === 8) {
          // Pattern 9: Company (TICKER) - Sektor: SectorName
          name = match[1].trim();
          symbol = match[2].trim();
          sector = match[3].trim();
        } else {
          name = match[1].trim();
          symbol = match[2].trim();
        }

        // Clean up the name - remove common prefixes and suffixes
        name = name.replace(/^(Aktie|Bolag|AB|Inc|Corp|Ltd)[\s:]/i, '').trim();
        name = name.replace(/[\s:](AB|Inc|Corp|Ltd)$/i, '').trim();

        // Validation checks
        const isValidSuggestion = name.length >= 2 && name.length <= 100 && symbol.length >= 1 && symbol.length <= 6 && !existingSymbols.has(symbol.toUpperCase()) && !suggestions.find(s => s.symbol === symbol.toUpperCase()) &&
        // Avoid common false positives
        !name.match(/^(och|eller|samt|med|utan|för|till|från|av|på|i|är|har|kan|ska|måste|borde|skulle)$/i) &&
        // Ensure it's not just numbers or special characters
        name.match(/[a-öA-Ö]/) && symbol.match(/^[A-Z]+$/);
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
          description: `${suggestion.name} (${suggestion.symbol}) har lagts till i dina AI-rekommendationer`
        });
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till aktien. Försök igen.",
        variant: "destructive"
      });
    }
  };

  // Format message content
  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;

      // Handle headers
      if (line.startsWith('###')) {
        return <h3 key={index} className="font-semibold text-sm sm:text-base mt-3 mb-2 text-gray-900 dark:text-gray-100 leading-tight" dangerouslySetInnerHTML={{
          __html: parseMarkdownSafely(line.replace('###', '').trim())
        }} />;
      }
      if (line.startsWith('##')) {
        return <h2 key={index} className="font-semibold text-base sm:text-lg mt-4 mb-2 text-gray-900 dark:text-gray-100 leading-tight" dangerouslySetInnerHTML={{
          __html: parseMarkdownSafely(line.replace('##', '').trim())
        }} />;
      }

      // Handle lists
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return <li key={index} className="ml-3 sm:ml-4 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-1" dangerouslySetInnerHTML={{
          __html: parseMarkdownSafely(line.trim().substring(1).trim())
        }} />;
      }

      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return <li key={index} className="ml-3 sm:ml-4 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-1 list-decimal" dangerouslySetInnerHTML={{
          __html: parseMarkdownSafely(line.trim().replace(/^\d+\.\s*/, ''))
        }} />;
      }

      // Handle regular text with markdown
      const parsedContent = parseMarkdownSafely(line);
      return <p key={index} className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-2 leading-relaxed break-words" dangerouslySetInnerHTML={{
        __html: parsedContent
      }} />;
    });
  };
  return <div className={`flex gap-3 sm:gap-4 items-start w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' ? <>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 max-w-[75%]">
            <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-3 sm:p-4 border shadow-sm">
              <div className="ai-response">
                {formatMessageContent(message.content)}
              </div>
              
              {/* Stock suggestions - now shows ALL suggestions dynamically */}
              {stockSuggestions.length > 0 && <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Aktieförslag från AI ({stockSuggestions.length} st)
                  </p>
                  <div className="flex flex-col gap-2">
                    {stockSuggestions.map(suggestion => {
                const isAdded = addedStocks.has(suggestion.symbol);
                return <div key={suggestion.symbol} className="flex items-center justify-between gap-3 bg-background/80 rounded-lg p-3 border border-border/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                              {suggestion.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.symbol}
                            </p>
                          </div>
                          <Button size="sm" variant={isAdded ? "outline" : "default"} onClick={() => handleAddStock(suggestion)} disabled={isAdded} className="h-7 px-3 text-xs flex-shrink-0">
                            {isAdded ? <>
                                <Check className="w-3 h-3 mr-1" />
                                Tillagd
                              </> : <>
                                <Plus className="w-3 h-3 mr-1" />
                                Lägg till
                              </>}
                          </Button>
                        </div>;
              })}
                  </div>
                </div>}
              
              {/* Context badges - removed as it was trying to render an object */}
            </div>
          </div>
        </> : <>
          <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-tr-lg p-3 sm:p-4 border border-primary/20 shadow-sm">
            <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
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
        </>}
    </div>;
};
export default ChatMessage;