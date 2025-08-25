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

    // Helper: extract only the "Aktier" section (to avoid ISK/KF, fonder, etc.)
    const getAktierSection = (text: string): string | null => {
      const lines = text.split('\n');
      let start = -1;
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        if (/^(?:[#*\-•]\s*)?Aktier\s*:?$|^\*\*Aktier\*\*:?$|^###?\s*Aktier\s*:?$/i.test(l)) {
          start = i;
          break;
        }
      }
      if (start === -1) return null;
      const collected: string[] = [];
      for (let i = start + 1; i < lines.length; i++) {
        const l = lines[i];
        // Stop when the next major section starts
        if (/^(?:[#*\-•]\s*)?(Fonder|ETF|ETF:|Fonder:|Skatteeffektiva strategier|Diversifieringstips|Risker|Åtgärder|Checklista)\s*:?\s*$/i.test(l.trim())) {
          break;
        }
        collected.push(l);
      }
      const section = collected.join('\n').trim();
      return section.length ? section : null;
    };

    // Build regex patterns with support for hyphenated/dotted tickers like SEB-A, BRK.B
    const TICKER = '([A-Z0-9]{1,6}(?:[-.][A-Z0-9]{1,4})?)';
    const make = (s: string, flags = 'g') => new RegExp(s, flags);

    const patterns: RegExp[] = [
      // Förslag/Rekommendation/Aktie: Namn (TICKER)
      make(`(?:Förslag|Rekommendation|Aktie):\\s*([^()\\\n]+?)\\s*\\(${TICKER}\\)`, 'gi'),
      // **Namn** (TICKER)
      make(`\\*\\*([^*]+?)\\*\\*\\s*\\(${TICKER}\\)`, 'g'),
      // Namn (TICKER) - general
      make(`([A-ZÅÄÖ][a-zåäöA-Z\\s&\.-]{2,80}?)\\s*\\(${TICKER}\\)`, 'g'),
      // 1. Namn (TICKER)
      make(`\\d+\\.\\s*([^()\\\n]+?)\\s*\\(${TICKER}\\)`, 'g'),
      // - Namn (TICKER) | • Namn (TICKER)
      make(`(?:^\\*|^-|^•)\\s*([^()\\\n]{2,80}?)\\s*\\(${TICKER}\\)`, 'gm'),
      // Namn (TICKER) - Sektor: X
      make(`([A-ZÅÄÖ][a-zåäöA-Z\\s&\.-]{2,80}?)\\s*\\(${TICKER}\\)\\s*-\\s*Sektor:\\s*([A-ZÅÄÖ][a-zåäöA-Z\\s&\.-]+)`, 'g'),
      // TICKER: Namn
      make(`([A-Z0-9]{1,6}(?:[-.][A-Z0-9]{1,4})?):\\s*([A-ZÅÄÖ][a-zåäöA-Z\\s&\.-]+)`, 'g'),
      // TICKER - Namn
      make(`([A-Z0-9]{1,6}(?:[-.][A-Z0-9]{1,4})?)\\s*-\\s*([A-ZÅÄÖ][a-zåäöA-Z\\s&\.-]{2,80})`, 'g')
    ];

    // Symbols and names we never consider as stocks
    const EXCLUDED_SYMBOLS = new Set(['ISK', 'KF']);
    const bannedNameRegex = /(investeringssparkonto|kapitalförsäkring|fond|fonder|etf|index|skatt|strategi|diversifiering|tips|portfölj)/i;

    // Prefer to scan only the Aktier section
    const contentToScan = getAktierSection(content) ?? content;

    // Get existing holdings symbols to filter out
    const existingSymbols = new Set(
      actualHoldings
        .map(holding => holding.symbol?.toUpperCase())
        .filter(Boolean)
    );

    patterns.forEach((pattern, idx) => {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(contentToScan)) !== null) {
        let name: string, symbol: string, sector: string | undefined;

        // capture order differences
        if (idx === 5) {
          // Namn (TICKER) - Sektor: X
          name = match[1].trim();
          symbol = match[2].trim();
          sector = match[3]?.trim();
        } else if (idx === 6 || idx === 7) {
          // TICKER: Namn  OR  TICKER - Namn
          symbol = match[1].trim();
          name = match[2].trim();
        } else {
          name = match[1].trim();
          symbol = match[2].trim();
        }

        // Clean up the name - keep AB but remove generic prefixes/suffixes
        name = name.replace(/^(Aktie|Bolag|Inc|Corp|Ltd)[\s:]/i, '').trim();
        name = name.replace(/[\s:](Inc|Corp|Ltd)$/i, '').trim();

        // Normalize symbol
        const normSymbol = symbol.toUpperCase();

        // Validation & filtering
        const isValidSuggestion =
          name.length >= 2 &&
          name.length <= 100 &&
          normSymbol.length >= 1 &&
          normSymbol.length <= 10 &&
          !existingSymbols.has(normSymbol) &&
          !EXCLUDED_SYMBOLS.has(normSymbol) &&
          !suggestions.find(s => s.symbol === normSymbol) &&
          !bannedNameRegex.test(name) &&
          /[a-öA-Ö]/i.test(name) &&
          /^[A-Z0-9]+(?:[-.][A-Z0-9]+)?$/.test(normSymbol);

        if (isValidSuggestion) {
          suggestions.push({
            name,
            symbol: normSymbol,
            sector: sector || undefined,
            reason: 'AI-rekommendation'
          });
        }
      }
    });

    // Remove duplicates and sort by name
    const uniqueSuggestions = suggestions.reduce((acc, current) => {
      const exists = acc.find(item => item.symbol === current.symbol);
      if (!exists) acc.push(current);
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