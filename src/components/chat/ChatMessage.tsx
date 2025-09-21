import React, { useState } from 'react';
import { Bot, User, Plus, Check, TrendingUp } from 'lucide-react';
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
      profileUpdates?: Record<string, unknown>;
      requiresConfirmation?: boolean;
    };
  };
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [addedStocks, setAddedStocks] = useState<Set<string>>(new Set());
  const { addHolding, actualHoldings } = useUserHoldings();
  const { toast } = useToast();

  const extractStockSuggestions = (content: string): StockSuggestion[] => {
    const suggestions: StockSuggestion[] = [];
    const bannedSymbols = new Set(['ISK', 'KF', 'PPM', 'AP7']);
    const bannedNameRegex = /(Investeringssparkonto|Kapitalförsäkring|Fond(er)?|Index(nära)?|ETF(er)?|Sparkonto)/i;
    const patterns = [
      /\*\*([^*]+?)\*\*\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
      /\*\*([^*()]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)\*\*/g,
      /(?:Förslag|Rekommendation|Aktie):\s*([^()\n]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/gi,
      /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
      /\d+\.\s*([^()\n]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
      /-\s*([^()\n]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
      /•\s*([^()\n]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
      /([A-Z]{2,6}(?:[-.][A-Z]{1,3})?):\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+)/g,
      /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{3,})\s+\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)(?=[\s.,!?]|$)/g,
      /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)\s*-\s*Sektor:\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+)/g,
      /(?:^\d+\.|\*|-|•)\s*([^()\n]{2,50}?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/gm,
      /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,50}?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)(?:\s*-|\s*:|\s*,|\s*\.|\s*$)/g,
      /\b([A-Z]{2,6}(?:[-.][A-Z]{1,3})?)\b\s*-\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,50})/g,
    ];

    const existingSymbols = new Set(
      actualHoldings.map((holding) => holding.symbol?.toUpperCase()).filter(Boolean),
    );

    const aktierSection = content.match(
      /(?:^|\n)\s*Aktier\s*:\s*([\s\S]*?)(?:\n\s*\n|(?:^|\n)\s*[A-ZÅÄÖa-zåäö\s]+:\s*|$)/,
    );
    const contentToParse = aktierSection ? aktierSection[1] : content;

    patterns.forEach((pattern, index) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(contentToParse)) !== null) {
        let name;
        let symbol;
        let sector;

        if (index === 7) {
          symbol = match[1].trim();
          name = match[2].trim();
        } else if (index === 9) {
          name = match[1].trim();
          symbol = match[2].trim();
          sector = match[3]?.trim();
        } else if (index === 12) {
          symbol = match[1].trim();
          name = match[2].trim();
        } else {
          name = match[1].trim();
          symbol = match[2].trim();
        }

        name = name.replace(/^(Aktie|Bolag|AB|Inc|Corp|Ltd)[\s:]/i, '').trim();
        name = name.replace(/[\s:](AB|Inc|Corp|Ltd)$/i, '').trim();

        const symbolValid = /^[A-Z]{1,6}(?:[-.][A-Z]{1,3})?$/.test(symbol);
        const isValidSuggestion =
          name.length >= 2 &&
          name.length <= 100 &&
          symbolValid &&
          !existingSymbols.has(symbol.toUpperCase()) &&
          !bannedSymbols.has(symbol.toUpperCase()) &&
          !bannedNameRegex.test(name) &&
          !suggestions.find((s) => s.symbol === symbol.toUpperCase()) &&
          !name.match(/^(och|eller|samt|med|utan|för|till|från|av|på|i|är|har|kan|ska|måste|borde|skulle)$/i) &&
          !!name.match(/[a-öA-Ö]/);

        if (isValidSuggestion) {
          suggestions.push({
            name,
            symbol: symbol.toUpperCase(),
            sector: sector || undefined,
            reason: 'AI-rekommendation',
          });
        }
      }
    });

    const uniqueSuggestions = suggestions.reduce((acc, current) => {
      const exists = acc.find((item) => item.symbol === current.symbol);
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
        market: 'Swedish',
      });

      if (success) {
        setAddedStocks((prev) => new Set([...prev, suggestion.symbol]));
        toast({
          title: 'Aktie tillagd!',
          description: `${suggestion.name} (${suggestion.symbol}) har lagts till i dina AI-rekommendationer`,
        });
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till aktien. Försök igen.',
        variant: 'destructive',
      });
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;

      if (line.startsWith('###')) {
        return (
          <h3
            key={index}
            className="mt-3 mb-2 text-sm font-semibold text-foreground"
            dangerouslySetInnerHTML={{ __html: parseMarkdownSafely(line.replace('###', '').trim()) }}
          />
        );
      }

      if (line.startsWith('##')) {
        return (
          <h2
            key={index}
            className="mt-4 mb-2 text-base font-semibold text-foreground"
            dangerouslySetInnerHTML={{ __html: parseMarkdownSafely(line.replace('##', '').trim()) }}
          />
        );
      }

      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return (
          <li
            key={index}
            className="ml-4 text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: parseMarkdownSafely(line.trim().substring(1).trim()) }}
          />
        );
      }

      if (/^\d+\./.test(line.trim())) {
        return (
          <li
            key={index}
            className="ml-4 list-decimal text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: parseMarkdownSafely(line.trim().replace(/^\d+\.\s*/, '')) }}
          />
        );
      }

      const parsedContent = parseMarkdownSafely(line);
      return (
        <p
          key={index}
          className="mb-2 text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: parsedContent }}
        />
      );
    });
  };

  return (
    <div className={`flex w-full items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' ? (
        <>
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-ai-surface-muted/70 text-ai-text-muted">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 max-w-[75%] space-y-3">
            <div className="rounded-ai-md border border-ai-border/60 bg-ai-bubble px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
              <div className="space-y-2">{formatMessageContent(message.content)}</div>
              <p className="mt-3 text-[11px] text-ai-text-muted">
                {message.timestamp.toLocaleTimeString('sv-SE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {stockSuggestions.length > 0 && (
              <div className="space-y-3 rounded-ai-md border border-ai-border/60 bg-ai-surface px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-medium text-ai-text-muted">
                  <TrendingUp className="h-3 w-3" />
                  Aktieförslag från AI ({stockSuggestions.length} st)
                </p>
                <div className="space-y-2">
                  {stockSuggestions.map((suggestion) => {
                    const isAdded = addedStocks.has(suggestion.symbol);
                    return (
                      <div
                        key={suggestion.symbol}
                        className="flex items-center justify-between gap-3 rounded-ai-sm border border-ai-border/50 bg-ai-bubble px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{suggestion.name}</p>
                          <p className="text-xs text-ai-text-muted">{suggestion.symbol}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? 'outline' : 'default'}
                          onClick={() => handleAddStock(suggestion)}
                          disabled={isAdded}
                          className="h-8 rounded-ai-sm px-3 text-xs"
                        >
                          {isAdded ? (
                            <>
                              <Check className="mr-1 h-3 w-3" /> Tillagd
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1 h-3 w-3" /> Lägg till
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0 max-w-[75%]">
            <div className="rounded-ai-md border border-ai-border/60 bg-ai-bubble-user px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{message.content}</p>
              <p className="mt-3 text-[11px] text-ai-text-muted">
                {message.timestamp.toLocaleTimeString('sv-SE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-ai-surface-muted/70 text-ai-text-muted">
            <User className="h-4 w-4" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMessage;
