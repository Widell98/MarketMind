import React, { useMemo, useState } from 'react';
import { Bot, User, Plus, Check, TrendingUp, ChevronDown, Sparkles, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { parseMarkdownSafely } from '@/utils/sanitizer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

  const attachedDocumentNames = useMemo(() => {
    const context = message.context as { documentNames?: unknown; documentIds?: unknown } | undefined;
    const rawNames = Array.isArray(context?.documentNames)
      ? context?.documentNames.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

    if (rawNames.length > 0) {
      return rawNames;
    }

    const rawIds = Array.isArray(context?.documentIds)
      ? context?.documentIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

    return rawIds.length > 0 ? rawIds : null;
  }, [message.context]);

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
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let keyCounter = 0;
    let currentList: { type: 'ol' | 'ul'; marker?: 'disc' | 'dash'; items: string[] } | null = null;
    let pendingListItem: { type: 'ol' | 'ul'; marker?: 'disc' | 'dash'; content: string } | null = null;

    const getKey = () => `message-fragment-${keyCounter++}`;

    const flushPendingAsParagraph = () => {
      if (!pendingListItem) return;

      elements.push(
        <p
          key={getKey()}
          className="mb-1.5 text-[13px] leading-[1.6] text-foreground last:mb-0"
          dangerouslySetInnerHTML={{ __html: parseMarkdownSafely(pendingListItem.content) }}
        />,
      );

      pendingListItem = null;
    };

    const flushList = () => {
      if (!currentList) return;

      const listKey = getKey();
      const ListTag = currentList.type === 'ol' ? 'ol' : 'ul';
      const isDashList = currentList.type === 'ul' && currentList.marker === 'dash';
      const listClassName = `ml-4 ${
        currentList.type === 'ol'
          ? 'list-decimal'
          : isDashList
            ? 'list-none'
            : 'list-disc'
      } space-y-1.5 text-[13px] leading-[1.6] text-foreground`;

      elements.push(
        <ListTag key={listKey} className={listClassName}>
          {currentList.items.map((item, index) => {
            const sanitizedContent = parseMarkdownSafely(item);

            return (
              <li key={`${listKey}-item-${index}`} className={isDashList ? 'flex items-start gap-2' : undefined}>
                {isDashList && <span className="select-none text-[13px] text-foreground">-</span>}
                <span
                  className={isDashList ? 'flex-1 text-[13px] leading-[1.6] text-foreground' : undefined}
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </li>
            );
          })}
        </ListTag>,
      );

      currentList = null;
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        flushPendingAsParagraph();
        flushList();
        elements.push(
          <div
            key={getKey()}
            className="h-3"
            aria-hidden="true"
          />,
        );
        return;
      }

      if (trimmedLine.startsWith('###')) {
        flushPendingAsParagraph();
        flushList();
        elements.push(
          <h3
            key={getKey()}
            className="mt-2.5 text-[13px] font-semibold text-foreground first:mt-0"
            dangerouslySetInnerHTML={{
              __html: parseMarkdownSafely(trimmedLine.replace(/^###\s*/, '').trim()),
            }}
          />,
        );
        return;
      }

      if (trimmedLine.startsWith('##')) {
        flushPendingAsParagraph();
        flushList();
        elements.push(
          <h2
            key={getKey()}
            className="mt-3 text-sm font-semibold text-foreground first:mt-0"
            dangerouslySetInnerHTML={{
              __html: parseMarkdownSafely(trimmedLine.replace(/^##\s*/, '').trim()),
            }}
          />,
        );
        return;
      }

      if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        const contentWithoutMarker = trimmedLine.replace(/^[-•]\s*/, '').trim();

        const isContinuation =
          (currentList && currentList.type === 'ul' && currentList.marker === 'disc') ||
          (pendingListItem && pendingListItem.type === 'ul' && pendingListItem.marker === 'disc');

        if (currentList && currentList.type === 'ul' && currentList.marker === 'disc') {
          currentList.items.push(contentWithoutMarker);
          return;
        }

        if (pendingListItem && pendingListItem.type === 'ul' && pendingListItem.marker === 'disc') {
          currentList = { type: 'ul', marker: 'disc', items: [pendingListItem.content, contentWithoutMarker] };
          pendingListItem = null;
          return;
        }

        flushList();
        flushPendingAsParagraph();

        if (isContinuation) {
          currentList = { type: 'ul', marker: 'disc', items: [contentWithoutMarker] };
        } else {
          pendingListItem = { type: 'ul', marker: 'disc', content: contentWithoutMarker };
        }
        return;
      }

      if (/^\d+\./.test(trimmedLine)) {
        const contentWithoutNumber = trimmedLine.replace(/^\d+\.\s*/, '').trim();

        const isContinuation =
          (currentList && currentList.type === 'ol') ||
          (pendingListItem && pendingListItem.type === 'ol');

        if (currentList && currentList.type === 'ol') {
          currentList.items.push(contentWithoutNumber);
          return;
        }

        if (pendingListItem && pendingListItem.type === 'ol') {
          currentList = { type: 'ol', items: [pendingListItem.content, contentWithoutNumber] };
          pendingListItem = null;
          return;
        }

        flushList();
        flushPendingAsParagraph();

        if (isContinuation) {
          currentList = { type: 'ol', items: [contentWithoutNumber] };
        } else {
          pendingListItem = { type: 'ol', content: contentWithoutNumber };
        }
        return;
      }

      flushPendingAsParagraph();
      flushList();
      elements.push(
        <p
          key={getKey()}
          className="mb-1.5 text-[13px] leading-[1.6] text-foreground last:mb-0"
          dangerouslySetInnerHTML={{ __html: parseMarkdownSafely(line) }}
        />,
      );
    });

    flushList();
    flushPendingAsParagraph();

    return elements;
  };

  const formattedTime = useMemo(
    () =>
      message.timestamp.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [message.timestamp],
  );

  const isoTimestamp = useMemo(() => message.timestamp.toISOString(), [message.timestamp]);

  const assistantDigest = useMemo(() => {
    if (message.role !== 'assistant') {
      return null;
    }

    const lines = message.content.split('\n');
    const headings: string[] = [];
    let bulletSequence = 0;
    let bulletPoints = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('##')) {
        const headingText = trimmed.replace(/^#+\s*/, '').trim();
        if (headingText && headings.length < 3) {
          headings.push(headingText);
        }
      }

      if (trimmed.match(/^(?:[-•]|\d+\.)\s+/)) {
        bulletSequence += 1;
      } else {
        if (bulletSequence > 1) {
          bulletPoints += bulletSequence;
        }
        bulletSequence = 0;
      }
    });

    if (bulletSequence > 1) {
      bulletPoints += bulletSequence;
    }

    const chips: string[] = [];
    headings.slice(0, 2).forEach((heading) => chips.push(heading));

    if (bulletPoints > 0) {
      chips.push(`${bulletPoints} punkter`);
    }

    return chips.length > 0 ? chips : null;
  }, [message.content, message.role]);

  const [showSuggestions, setShowSuggestions] = useState(true);

  return (
    <div className={`flex w-full items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' ? (
        <>
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-[0_12px_28px_rgba(15,23,42,0.12)] ring-1 ring-[#144272]/25 transition-colors dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:ring-transparent dark:shadow-none">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 max-w-[75%] space-y-3">
            <div className="rounded-[18px] border border-[#205295]/18 bg-white/95 px-4 py-3.5 text-foreground shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble dark:px-4 dark:py-3 dark:shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-ai-text-muted">
                <span className="flex items-center gap-1 text-primary/80 dark:text-ai-text-muted">
                  <Sparkles className="h-3.5 w-3.5" />
                  MarketMind
                </span>
                <time dateTime={isoTimestamp}>{formattedTime}</time>
              </div>

              {assistantDigest && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {assistantDigest.map((chip, index) => (
                    <span
                      key={`${message.id}-chip-${index}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[#205295]/25 bg-white/80 px-3 py-1 text-[11px] font-medium text-primary/80 shadow-sm transition-colors dark:border-ai-border/60 dark:bg-ai-surface-muted/60 dark:text-ai-text-muted"
                    >
                      <Sparkles className="h-3 w-3" />
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 space-y-1.5">{formatMessageContent(message.content)}</div>
            </div>

            {stockSuggestions.length > 0 && (
              <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
                <div className="rounded-[16px] border border-[#144272]/18 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-surface dark:shadow-none">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-[16px] px-4 py-3 text-left text-xs font-medium text-primary transition-colors hover:bg-white/70 dark:text-ai-text-muted dark:hover:bg-ai-surface-muted/60"
                    >
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Aktieförslag från AI ({stockSuggestions.length} st)
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSuggestions ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 pt-2">
                    <div className="space-y-2">
                      {stockSuggestions.map((suggestion) => {
                        const isAdded = addedStocks.has(suggestion.symbol);
                        return (
                          <div
                            key={suggestion.symbol}
                            className="flex items-center justify-between gap-3 rounded-[14px] border border-[#205295]/18 bg-white/85 px-3 py-2 shadow-sm transition-colors dark:rounded-ai-sm dark:border-ai-border/50 dark:bg-ai-bubble"
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
                              className="h-8 rounded-full px-4 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 dark:rounded-ai-sm dark:px-3 dark:shadow-none"
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
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0 max-w-[75%] space-y-2">
            <div className="rounded-[18px] border border-[#144272]/22 bg-gradient-to-br from-[#144272]/16 via-white/95 to-[#205295]/14 px-4 py-3.5 text-foreground shadow-[0_18px_46px_rgba(15,23,42,0.1)] backdrop-blur-sm transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble-user dark:px-4 dark:py-3 dark:shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-medium text-ai-text-muted">
                <span>Du</span>
                <time dateTime={isoTimestamp}>{formattedTime}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-[1.6] text-foreground">{message.content}</p>
            </div>
            {attachedDocumentNames && (
              <div className="flex flex-wrap items-center gap-2 pl-1 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <Paperclip className="h-3 w-3" /> Bifogade källor
                </span>
                {attachedDocumentNames.map((name, index) => (
                  <span
                    key={`${message.id}-doc-${index}`}
                    className="inline-flex items-center rounded-full border border-primary/30 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-primary shadow-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-500 to-blue-600 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] ring-1 ring-[#144272]/35 transition-colors dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:ring-transparent dark:shadow-none">
            <User className="h-4 w-4" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMessage;
