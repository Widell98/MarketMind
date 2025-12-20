import React, { useMemo, useState } from 'react';
import { Bot, User, Plus, Check, TrendingUp, ChevronDown, Sparkles, Paperclip, ExternalLink } from 'lucide-react';
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
      stock_suggestions?: Array<{ name: string; ticker: string; reason?: string }>;
      tavilyFallbackUsed?: boolean;
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

    const patterns: Array<{ regex: RegExp; map: (match: RegExpExecArray) => { name: string; symbol: string; sector?: string } }> = [
      {
        regex: /\*\*([^*]+?)\*\*\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /\*\*([^*()]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)\*\*/g,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /(?:Förslag|Rekommendation|Aktie):\s*([^()\n]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/gi,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /\d+\.\s*([^()\n]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /-\s*([^()\n]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /•\s*([^()\n]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/g,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /([A-Z]{2,6}(?:[-.][A-Z]{1,3})?):\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+)/g,
        map: (match) => ({ symbol: match[1], name: match[2] }),
      },
      {
        regex: /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{3,})\s+\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)(?=[\s.,!?]|$)/g,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)\s*-\s*Sektor:\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.-]+)/g,
        map: (match) => ({ name: match[1], symbol: match[2], sector: match[3] }),
      },
      {
        regex: /(?:^\d+\.|\*|-|•)\s*([^()\n]{2,50}?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)/gm,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,50}?)\s*\(([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\)(?:\s*-|\s*:|\s*,|\s*\.|\s*$)/g,
        map: (match) => ({ name: match[1], symbol: match[2] }),
      },
      {
        regex: /\b([A-Z]{2,6}(?:[-.][A-Z]{1,3})?)\b\s*-\s*([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,50})/g,
        map: (match) => ({ symbol: match[1], name: match[2] }),
      },
      {
        regex: /\b([A-Z]{1,6}(?:[-.][A-Z]{1,3})?)\s*\(([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,100})\)/g,
        map: (match) => ({ symbol: match[1], name: match[2] }),
      },
    ];

    const existingSymbols = new Set(
      actualHoldings.map((holding) => holding.symbol?.toUpperCase()).filter(Boolean),
    );

    const aktierSection = content.match(
      /(?:^|\n)\s*Aktier\s*:\s*([\s\S]*?)(?:\n\s*\n|(?:^|\n)\s*[A-ZÅÄÖa-zåäö\s]+:\s*|$)/,
    );
    const contentToParse = aktierSection ? aktierSection[1] : content;

    const cleanName = (rawName: string) =>
      rawName
        .replace(/["'“”‘’]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/[,:;]+$/g, '')
        .trim();

    const resolveNameFromContext = (symbol: string, currentName: string) => {
      const contextualPatterns = [
        new RegExp(`([A-ZÅÄÖ][a-zåäöA-Z\\s&.-]{2,})\\s+\\(${symbol}\\)`, 'g'),
        new RegExp(`([A-ZÅÄÖ][a-zåäöA-Z\\s&.-]{2,})\\s+${symbol}\\b`, 'g'),
        new RegExp(`${symbol}\\s+\\(([A-ZÅÄÖ][a-zåäöA-Z\\s&.-]{2,})\\)`, 'g'),
      ];

      for (const contextualRegex of contextualPatterns) {
        const match = contextualRegex.exec(content);
        if (match?.[1]) {
          return cleanName(match[1]);
        }
      }

      return currentName;
    };

    patterns.forEach(({ regex, map }) => {
      let match;
      const localRegex = new RegExp(regex.source, regex.flags);
      while ((match = localRegex.exec(contentToParse)) !== null) {
        const mapped = map(match);
        let name = cleanName(mapped.name);
        let symbol = mapped.symbol.trim();
        const sector = mapped.sector?.trim();

        name = name.replace(/^(Aktie|Bolag|AB|Inc|Corp|Ltd)[\s:]/i, '').trim();
        name = name.replace(/[\s:](AB|Inc|Corp|Ltd)$/i, '').trim();

        name = resolveNameFromContext(symbol, name);

        const symbolValid = /^[A-Z]{1,6}(?:[-.][A-Z]{1,3})?$/.test(symbol);
        const isValidSuggestion =
          name.length >= 2 &&
          name.length <= 100 &&
          symbolValid &&
          !existingSymbols.has(symbol.toUpperCase()) &&
          !bannedSymbols.has(symbol.toUpperCase()) &&
          !bannedNameRegex.test(name) &&
          !suggestions.find((s) => s.symbol === symbol.toUpperCase()) &&
          (name.toUpperCase() !== name || name === symbol.toUpperCase()) &&
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

  const stockSuggestions = useMemo(() => {
    if (message.role !== 'assistant') return [];
    
    const contextSuggestions = (message.context as { stock_suggestions?: Array<{ name: string; ticker: string; reason?: string }> } | undefined)?.stock_suggestions;
    if (contextSuggestions && Array.isArray(contextSuggestions) && contextSuggestions.length > 0) {
      return contextSuggestions.map(s => ({
        name: s.name,
        symbol: s.ticker,
        reason: s.reason || 'AI-rekommendation',
      }));
    }
    
    return extractStockSuggestions(message.content);
  }, [message]);

  const tavilyFallbackUsed = message.context?.tavilyFallbackUsed === true;

  const { sources, contentWithoutSources } = useMemo(() => {
    if (message.role !== 'assistant') {
      return { sources: [], contentWithoutSources: message.content };
    }
    
    const urlPattern = /https?:\/\/[^\s\)]+/g;
    const extractedSources: string[] = [];
    let cleanedContent = message.content;
    
    const sourcesMatch = message.content.match(/(?:^|\n)\s*Källor\s*:\s*\n([\s\S]*?)(?:\n\s*\n|$)/i);
    if (sourcesMatch) {
      const sourcesText = sourcesMatch[1];
      const urls = sourcesText.match(urlPattern);
      if (urls) {
        extractedSources.push(...urls);
      }
      cleanedContent = message.content.replace(/(?:^|\n)\s*Källor\s*:\s*\n[\s\S]*?$/i, '').trim();
    } else {
      const lines = message.content.split('\n');
      const trailingUrls: string[] = [];
      let urlStartIndex = -1;
      
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const urlMatch = line.match(urlPattern);
        if (urlMatch && line.split(/\s+/).length <= 2 && !line.match(/[a-öA-Ö]{3,}/)) {
          trailingUrls.unshift(...urlMatch);
          urlStartIndex = i;
        } else {
          break;
        }
      }
      
      if (trailingUrls.length > 0 && urlStartIndex >= 0) {
        extractedSources.push(...trailingUrls);
        cleanedContent = lines.slice(0, urlStartIndex).join('\n').trim();
      }
    }
    
    const validSources = Array.from(new Set(extractedSources)).filter(url => {
      try {
        new URL(url);
        const lowerUrl = url.toLowerCase();
        return !lowerUrl.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i) && 
               !lowerUrl.includes('data:');
      } catch {
        return false;
      }
    });
    
    return {
      sources: validSources,
      contentWithoutSources: cleanedContent,
    };
  }, [message.content, message.role]);

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

    // Detect holdings ranking pattern: **SYMBOL:** Avkastning: X%, Resultat i kronor: Y SEK
    // Also handles numbered lists: 1. **SYMBOL:** Avkastning: X%, Resultat i kronor: Y SEK
    const detectHoldingsRanking = (lines: string[]): { start: number; end: number; holdings: Array<{ symbol: string; returnPercent: string; returnAmount: string }> } | null => {
      const holdingsPatterns = [
        /^\*\*([A-Z0-9-]+)\*\*:\s*Avkastning:\s*([+-]?[\d,]+\.?\d*)%,\s*Resultat i kronor:\s*([+-]?[\d\s]+)\s*SEK/i,
        /^\d+\.\s*\*\*([A-Z0-9-]+)\*\*:\s*Avkastning:\s*([+-]?[\d,]+\.?\d*)%,\s*Resultat i kronor:\s*([+-]?[\d\s]+)\s*SEK/i,
        /^-\s*\*\*([A-Z0-9-]+)\*\*:\s*Avkastning:\s*([+-]?[\d,]+\.?\d*)%,\s*Resultat i kronor:\s*([+-]?[\d\s]+)\s*SEK/i,
        /^\*\*([A-Z0-9-]+)\*\*:\s*([+-]?[\d,]+\.?\d*)%\s*\(([+-]?[\d\s]+)\s*SEK\)/i,
        /^\d+\.\s*\*\*([A-Z0-9-]+)\*\*:\s*([+-]?[\d,]+\.?\d*)%\s*\(([+-]?[\d\s]+)\s*SEK\)/i,
      ];
      
      let startIndex = -1;
      const holdings: Array<{ symbol: string; returnPercent: string; returnAmount: string }> = [];
      
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        let matched = false;
        
        for (const pattern of holdingsPatterns) {
          const match = trimmed.match(pattern);
          if (match) {
            if (startIndex === -1) {
              startIndex = i;
            }
            holdings.push({
              symbol: match[1],
              returnPercent: match[2],
              returnAmount: match[3].replace(/\s/g, ''),
            });
            matched = true;
            break;
          }
        }
        
        if (startIndex !== -1 && !matched && holdings.length > 0) {
          // Stop if we found a non-matching line after finding holdings
          if (trimmed && !trimmed.match(/^(\d+\.|[-•]|\*\*[A-Z0-9-]+\*\*:)/)) {
            break;
          }
        }
      }
      
      if (holdings.length >= 2 && startIndex !== -1) {
        return { start: startIndex, end: startIndex + holdings.length, holdings };
      }
      
      return null;
    };

    const holdingsRanking = detectHoldingsRanking(lines);

    const flushPendingAsParagraph = () => {
      if (!pendingListItem) return;

      elements.push(
        <p
          key={getKey()}
          className="mb-1 text-[13px] leading-[1.6] text-foreground last:mb-0"
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
      } space-y-0.5 text-[13px] leading-[1.6] text-foreground`;

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

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();

      // Skip lines that are part of holdings ranking (will be rendered separately)
      if (holdingsRanking && lineIndex >= holdingsRanking.start && lineIndex < holdingsRanking.end) {
        if (lineIndex === holdingsRanking.start) {
          flushPendingAsParagraph();
          flushList();
          
          // Render holdings ranking as a nice table
          elements.push(
            <div
              key={getKey()}
              className="my-3 overflow-hidden rounded-lg border border-[#205295]/18 bg-white/95 shadow-sm dark:border-ai-border/60 dark:bg-ai-surface-muted/50"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#205295]/18 bg-[#144272]/5 dark:border-ai-border/40 dark:bg-ai-surface-muted/30">
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-foreground/80 uppercase tracking-wide">Innehav</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold text-foreground/80 uppercase tracking-wide">Avkastning</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold text-foreground/80 uppercase tracking-wide">Resultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdingsRanking.holdings.map((holding, idx) => {
                      const returnPercentNum = parseFloat(holding.returnPercent.replace(/,/g, ''));
                      const returnAmountNum = parseFloat(holding.returnAmount.replace(/,/g, ''));
                      const isPositive = returnPercentNum >= 0;
                      const returnColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                      
                      // Format percentage with sign
                      const formattedPercent = holding.returnPercent.startsWith('+') || holding.returnPercent.startsWith('-')
                        ? `${holding.returnPercent}%`
                        : `${returnPercentNum >= 0 ? '+' : ''}${holding.returnPercent}%`;
                      
                      // Format amount with sign and proper spacing (add space every 3 digits)
                      const cleanAmount = holding.returnAmount.replace(/\s/g, '');
                      const formattedAmountValue = cleanAmount.startsWith('+') || cleanAmount.startsWith('-')
                        ? cleanAmount
                        : `${returnAmountNum >= 0 ? '+' : ''}${cleanAmount}`;
                      
                      // Add space separators for thousands
                      const amountWithSpaces = formattedAmountValue.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
                      const formattedAmount = `${amountWithSpaces} SEK`;
                      
                      return (
                        <tr
                          key={`holding-${idx}`}
                          className="border-b border-[#205295]/10 last:border-0 hover:bg-[#144272]/5 dark:border-ai-border/30 dark:hover:bg-ai-surface-muted/40 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <span className="text-[13px] font-semibold text-foreground">{holding.symbol}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-[13px] font-medium ${returnColor}`}>
                              {formattedPercent}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-[13px] font-medium ${returnColor}`}>
                              {formattedAmount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        return;
      }

      if (trimmedLine === '') {
        flushPendingAsParagraph();
        flushList();
        elements.push(
          <div
            key={getKey()}
            className="h-2"
            aria-hidden="true"
          />,
        );
        return;
      }

      if (trimmedLine === '--' || trimmedLine === '---' || trimmedLine === '——') {
        return;
      }

      if (trimmedLine.startsWith('###')) {
        flushPendingAsParagraph();
        flushList();
        elements.push(
          <h3
            key={getKey()}
            className="mt-2 text-xs font-bold text-foreground first:mt-0 uppercase tracking-wide opacity-90"
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
            className="mt-2.5 text-[13px] font-bold text-foreground first:mt-0"
            dangerouslySetInnerHTML={{
              __html: parseMarkdownSafely(trimmedLine.replace(/^##\s*/, '').trim()),
            }}
          />,
        );
        return;
      }

      if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        const contentWithoutMarker = trimmedLine.replace(/^[-•]\s*/, '').trim();
        
        const urlPattern = /^https?:\/\/[^\s\)]+$/;
        if (urlPattern.test(contentWithoutMarker.trim())) {
          return;
        }

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
        
        const urlPattern = /^https?:\/\/[^\s\)]+$/;
        if (urlPattern.test(contentWithoutNumber.trim())) {
          return;
        }

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
      
      const urlOnlyPattern = /^https?:\/\/[^\s\)]+$/;
      if (urlOnlyPattern.test(trimmedLine)) {
        return;
      }

      flushPendingAsParagraph();
      flushList();
      elements.push(
        <p
          key={getKey()}
          className="mb-1 text-[13px] leading-[1.6] text-foreground last:mb-0"
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
    <div className={`flex w-full items-start gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' ? (
        <>
          <div className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white/90 text-primary shadow-[0_12px_28px_rgba(15,23,42,0.12)] ring-1 ring-[#144272]/25 transition-colors dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:ring-transparent dark:shadow-none flex-shrink-0">
            <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
          <div className="flex-1 min-w-0 max-w-[85%] sm:max-w-[80%] lg:max-w-[85%] space-y-1.5 sm:space-y-2">
            <div className="rounded-xl sm:rounded-[16px] border border-[#205295]/18 bg-white/95 px-3 py-2.5 sm:px-4 sm:py-3 text-foreground shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble dark:shadow-sm">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-ai-text-muted mb-1 sm:mb-1.5">
                <span className="flex items-center gap-0.5 sm:gap-1 text-primary/80 dark:text-ai-text-muted">
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  MarketMind
                </span>
                <time dateTime={isoTimestamp}>{formattedTime}</time>
              </div>

              {assistantDigest && (
                <div className="mb-1.5 sm:mb-2 flex flex-wrap gap-1 sm:gap-1.5">
                  {assistantDigest.map((chip, index) => (
                    <span
                      key={`${message.id}-chip-${index}`}
                      className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-[#205295]/25 bg-white/80 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-primary/80 shadow-sm transition-colors dark:border-ai-border/60 dark:bg-ai-surface-muted/60 dark:text-ai-text-muted"
                    >
                      <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-0.5 sm:space-y-1">{formatMessageContent(contentWithoutSources)}</div>
              
              {tavilyFallbackUsed && (
                <div className="mt-1.5 sm:mt-2 rounded-lg border border-amber-200 bg-amber-50/80 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
                  <strong>OBS:</strong> Realtidssökning kunde inte genomföras. Svaret baseras på befintlig kunskap.
                </div>
              )}

              {sources.length > 0 && (
                <div className="mt-2 sm:mt-3 border-t border-[#205295]/18 pt-1.5 sm:pt-2 dark:border-ai-border/40">
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                    <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-ai-text-muted" />
                    <span className="text-[9px] sm:text-[10px] font-semibold text-ai-text-muted uppercase tracking-wide">Källor</span>
                    <span className="text-[9px] sm:text-[10px] text-ai-text-muted/70">({sources.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {sources.map((source, index) => {
                      try {
                        const url = new URL(source);
                        const domain = url.hostname.replace('www.', '');
                        let displayName = domain;
                        
                        if (displayName.length > 35) {
                          displayName = `${displayName.substring(0, 32)}...`;
                        }
                        
                        return (
                          <a
                            key={`${message.id}-source-${index}`}
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-0.5 sm:gap-1 rounded-md border border-[#205295]/25 bg-white/90 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-medium text-primary/90 transition-all hover:bg-white hover:text-primary hover:shadow-sm hover:-translate-y-0.5 hover:border-primary/40 dark:border-ai-border/60 dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:hover:bg-ai-surface-muted dark:hover:text-foreground dark:hover:border-ai-border"
                            title={source}
                          >
                            <ExternalLink className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <span className="max-w-[120px] sm:max-w-[150px] truncate">
                              {displayName}
                            </span>
                          </a>
                        );
                      } catch {
                        return null;
                      }
                    })}
                  </div>
                </div>
              )}
            </div>

            {stockSuggestions.length > 0 && (
              <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
                <div className="rounded-xl sm:rounded-[14px] border border-[#144272]/18 bg-white/92 shadow-sm backdrop-blur-sm transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-surface dark:shadow-none">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-xl sm:rounded-[14px] px-2.5 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-[11px] font-medium text-primary transition-colors hover:bg-white/70 dark:text-ai-text-muted dark:hover:bg-ai-surface-muted/60"
                    >
                      <span className="flex items-center gap-1 sm:gap-1.5">
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Aktieförslag ({stockSuggestions.length} st)
                      </span>
                      <ChevronDown className={`h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform ${showSuggestions ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2.5 sm:px-3 pb-2 sm:pb-3 pt-0.5 sm:pt-1">
                    <div className="space-y-1 sm:space-y-1.5">
                      {stockSuggestions.map((suggestion) => {
                        const isAdded = addedStocks.has(suggestion.symbol);
                        return (
                          <div
                            key={suggestion.symbol}
                            className="flex items-center justify-between gap-1.5 sm:gap-2 rounded-lg sm:rounded-[10px] border border-[#205295]/18 bg-white/85 px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-sm transition-colors dark:rounded-ai-sm dark:border-ai-border/50 dark:bg-ai-bubble"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] sm:text-[12px] font-medium text-foreground">{suggestion.name}</p>
                              <p className="text-[9px] sm:text-[10px] text-ai-text-muted">{suggestion.symbol}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={isAdded ? 'outline' : 'default'}
                              onClick={() => handleAddStock(suggestion)}
                              disabled={isAdded}
                              className="h-5 sm:h-6 rounded-full px-2 sm:px-3 text-[9px] sm:text-[10px] font-medium shadow-sm transition-all hover:-translate-y-0.5 dark:rounded-ai-sm dark:shadow-none flex-shrink-0"
                            >
                              {isAdded ? (
                                <>
                                  <Check className="mr-0.5 sm:mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5" /> 
                                  <span className="hidden xs:inline">Tillagd</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-0.5 sm:mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5" /> 
                                  <span className="hidden xs:inline">Lägg till</span>
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
          <div className="min-w-0 max-w-[85%] sm:max-w-[80%] lg:max-w-[85%] space-y-1 sm:space-y-1.5">
            <div className="rounded-xl sm:rounded-[16px] border border-[#144272]/22 bg-gradient-to-br from-[#144272]/16 via-white/95 to-[#205295]/14 px-3 py-2.5 sm:px-4 sm:py-3 text-foreground shadow-[0_18px_46px_rgba(15,23,42,0.1)] backdrop-blur-sm transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble-user dark:shadow-sm">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-ai-text-muted mb-0.5 sm:mb-1">
                <span>Du</span>
                <time dateTime={isoTimestamp}>{formattedTime}</time>
              </div>
              <p className="whitespace-pre-wrap break-words text-xs sm:text-[13px] leading-[1.5] sm:leading-[1.6] text-foreground">{message.content}</p>
            </div>
            {attachedDocumentNames && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 pl-0.5 sm:pl-1">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-primary/10 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-primary">
                  <Paperclip className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> 
                  <span className="hidden xs:inline">Bifogat</span>
                </span>
                {attachedDocumentNames.map((name, index) => (
                  <span
                    key={`${message.id}-doc-${index}`}
                    className="inline-flex items-center rounded-full border border-primary/30 bg-white/80 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-primary shadow-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-500 to-blue-600 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] ring-1 ring-[#144272]/35 transition-colors dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:ring-transparent dark:shadow-none flex-shrink-0">
            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMessage;
