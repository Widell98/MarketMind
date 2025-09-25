
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Loader2, Bot, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  source?: 'marketaux';
  contextData?: {
    marketaux?: MarketauxResponsePayload;
  };
}

type MarketauxIntent = 'news' | 'report';

interface MarketauxItem {
  id: string;
  title: string;
  subtitle?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  source?: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface MarketauxResponsePayload {
  source: 'marketaux';
  intent: MarketauxIntent;
  symbol?: string | null;
  query?: string;
  fetchedAt: string;
  summary: string[];
  items: MarketauxItem[];
  raw: unknown;
}

interface MarketauxDetectionResult {
  intent: MarketauxIntent;
  symbol?: string;
}

const reportKeywords = [
  'rapport',
  'rapporten',
  'earnings',
  'delårsrapport',
  'kvartalsrapport',
  'bokslut',
  'resultat',
  'eps',
  'årsrapport',
];

const newsKeywords = [
  'nyhet',
  'nyheter',
  'senaste nytt',
  'headline',
  'rubriker',
  'pressmeddelande',
  'pressrelease',
  'breaking',
  'marknadssiffror',
  'uppdatering',
];

const recencyKeywords = [
  'senaste',
  'nyligen',
  'hur gick',
  'hur var',
  'just nu',
  'vad hände',
  'uppdatering',
  'update',
];

const detectMarketauxIntent = (message: string, companyName: string): MarketauxDetectionResult | null => {
  const normalized = message.toLowerCase();
  const hasQuarterMention = /\bq[1-4]\b/.test(normalized);
  const hasReportKeyword = hasQuarterMention || reportKeywords.some((keyword) => normalized.includes(keyword));
  const hasNewsKeyword = newsKeywords.some((keyword) => normalized.includes(keyword));
  const hasRecencyKeyword = recencyKeywords.some((keyword) => normalized.includes(keyword));
  const mentionsReportExplicitly = normalized.includes('rapport');
  const mentionsNewsExplicitly = normalized.includes('nyhet') || normalized.includes('nyheter');
  const mentionsCompany = normalized.includes(companyName.toLowerCase());
  const ticker = extractTickerSymbol(message);

  if (hasReportKeyword || (mentionsCompany && mentionsReportExplicitly)) {
    if (hasRecencyKeyword || mentionsReportExplicitly) {
      return { intent: 'report', symbol: ticker };
    }
  }

  if (hasNewsKeyword || mentionsNewsExplicitly) {
    if (hasRecencyKeyword || mentionsNewsExplicitly || mentionsCompany) {
      return { intent: 'news', symbol: ticker };
    }
  }

  if (hasRecencyKeyword && mentionsCompany && normalized.includes('marknad')) {
    return { intent: 'news', symbol: ticker };
  }

  return null;
};

const extractTickerSymbol = (message: string): string | undefined => {
  const parenthesisMatch = message.match(/\(([A-Z]{1,5})\)/);
  if (parenthesisMatch) {
    const candidate = parenthesisMatch[1];
    if (!/^Q[1-4]$/.test(candidate)) {
      return candidate;
    }
  }

  const uppercaseMatches = message.match(/\b[A-Z]{2,5}\b/g);
  if (uppercaseMatches) {
    const candidate = uppercaseMatches.find((symbol) => !/^Q[1-4]$/.test(symbol));
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
};

const buildMarketauxQuery = (message: string, companyName: string) => {
  const normalizedCompany = companyName.trim();
  const normalizedMessage = message.trim();
  const lowerMessage = normalizedMessage.toLowerCase();

  const parts = [] as string[];
  if (!lowerMessage.includes(normalizedCompany.toLowerCase())) {
    parts.push(normalizedCompany);
  }
  parts.push(normalizedMessage);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

const formatPublishedDate = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  try {
    return new Intl.DateTimeFormat('sv-SE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsed);
  } catch (error) {
    console.error('Failed to format MarketAux date', error);
    return parsed.toLocaleString();
  }
};

const formatNumberWithCurrency = (value?: number | null, currency?: string) => {
  if (value == null || Number.isNaN(value)) {
    return '–';
  }

  try {
    if (currency) {
      return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(value);
    }

    return new Intl.NumberFormat('sv-SE', {
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.error('Failed to format MarketAux metric', error);
    return value.toString();
  }
};

const renderReportMetadata = (metadata?: Record<string, unknown> | null): JSX.Element | null => {
  if (!metadata) return null;

  const meta = metadata as {
    fiscalPeriod?: string | null;
    fiscalYear?: string | number | null;
    epsActual?: number | null;
    epsEstimate?: number | null;
    revenueActual?: number | null;
    revenueEstimate?: number | null;
    currency?: string | null;
  };

  const rows: Array<{ label: string; value: string }> = [];

  if (meta.fiscalPeriod || meta.fiscalYear) {
    const periodText = [meta.fiscalPeriod, meta.fiscalYear].filter(Boolean).join(' ');
    rows.push({ label: 'Period', value: periodText });
  }

  if (meta.epsActual != null || meta.epsEstimate != null) {
    rows.push({
      label: 'EPS',
      value: `${formatNumberWithCurrency(meta.epsActual)} (est ${formatNumberWithCurrency(meta.epsEstimate)})`,
    });
  }

  if (meta.revenueActual != null || meta.revenueEstimate != null) {
    rows.push({
      label: 'Intäkter',
      value: `${formatNumberWithCurrency(meta.revenueActual, meta.currency ?? undefined)} (est ${formatNumberWithCurrency(meta.revenueEstimate, meta.currency ?? undefined)})`,
    });
  }

  if (!rows.length) {
    return null;
  }

  return (
    <div className="text-xs text-gray-600 dark:text-gray-300 border-t pt-2 mt-2 space-y-1">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-2">
          <span className="font-medium">{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
    </div>
  );
};

interface StockCaseAIChatProps {
  stockCase: {
    id: string;
    title: string;
    company_name: string;
    sector?: string;
    current_price?: number;
    target_price?: number;
    description?: string;
  };
}

const StockCaseAIChat: React.FC<StockCaseAIChatProps> = ({ stockCase }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedContextMessageId, setExpandedContextMessageId] = useState<string | null>(null);

  const createMessageId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const createAndPushFallbackMessage = (text: string) => {
    const fallbackMessage: ChatMessage = {
      id: createMessageId(),
      type: 'ai',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, fallbackMessage]);
    setExpandedContextMessageId(null);
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const detection = detectMarketauxIntent(inputMessage, stockCase.company_name);
      let marketauxContext: MarketauxResponsePayload | null = null;

      if (detection) {
        try {
          const query = buildMarketauxQuery(inputMessage, stockCase.company_name);
          const { data: marketauxData, error: marketauxError } = await supabase.functions.invoke<MarketauxResponsePayload>('marketaux-router', {
            body: {
              query,
              symbol: detection.symbol,
              intent: detection.intent,
            },
          });

          if (marketauxError) {
            console.error('MarketAux fetch error:', marketauxError);
            createAndPushFallbackMessage('Kunde inte hämta färska MarketAux-data just nu. Försök igen senare eller ställ en annan fråga.');
            return;
          }

          if (!marketauxData || !marketauxData.items?.length) {
            createAndPushFallbackMessage('MarketAux hade inga färska datapunkter att dela kring frågan. Testa att formulera om eller fråga om ett annat bolag.');
            return;
          }

          marketauxContext = marketauxData;
        } catch (error) {
          console.error('Unexpected MarketAux error:', error);
          createAndPushFallbackMessage('Det uppstod ett fel vid hämtning av MarketAux-data. Försök igen senare.');
          return;
        }
      }

      // Create enhanced system prompt with micro-template
      const systemPrompt = `Du är en snabb AI-assistent för investeringar specialiserad på ${stockCase.company_name}.

MIKRO-MALL (ANVÄND ALLTID):
📊 **Tes:** [Investeringsteser i 1 mening]
⚠️ **Risk:** [Huvudrisk att beakta]  
📈 **Nivåer:** [Kursnivåer om tillgängliga]

Aktieinformation:
- Företag: ${stockCase.company_name}
- Titel: ${stockCase.title}
${stockCase.sector ? `- Sektor: ${stockCase.sector}` : ''}
${stockCase.current_price ? `- Nuvarande pris: ${stockCase.current_price} SEK` : ''}
${stockCase.target_price ? `- Målkurs: ${stockCase.target_price} SEK` : ''}
${stockCase.description ? `- Beskrivning: ${stockCase.description}` : ''}

KRITISKA REGLER:
- Använd ALLTID mikro-mallen ovan
- Max 70 ord totalt
- Fokusera på ${stockCase.company_name} specifikt
- Ge konkret investeringssyn`;

      const { data, error } = await supabase.functions.invoke('quick-ai-assistant', {
        body: {
          message: inputMessage.trim(),
          userId: user.id,
          systemPrompt,
          model: 'gpt-4o-mini',
          maxTokens: 50,
          temperature: 0.3,
          contextData: marketauxContext ? { marketaux: marketauxContext } : undefined,
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response || 'Jag kunde inte generera ett svar just nu.',
        timestamp: new Date(),
        source: marketauxContext ? 'marketaux' : undefined,
        contextData: marketauxContext ? { marketaux: marketauxContext } : undefined,
      };

      setMessages(prev => [...prev, aiMessage]);
      setExpandedContextMessageId(null);
    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: "Fel",
        description: "Kunde inte få svar från AI-assistenten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI-assistent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 py-4">
            Logga in för att chatta med AI om detta stock case
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI-assistent
            <Badge variant="secondary">Snabb</Badge>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? 'Minimera' : 'Expandera'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-8 h-8 mx-auto mb-2" />
                  <p>Ställ korta frågor om {stockCase.company_name}</p>
                  <p className="text-xs">AI kan snabbt svara på frågor om denna aktie</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="flex-shrink-0">
                          {message.type === 'user' ? (
                            <User className="w-6 h-6 p-1 bg-blue-100 text-blue-600 rounded-full" />
                          ) : (
                            <Bot className="w-6 h-6 p-1 bg-green-100 text-green-600 rounded-full" />
                          )}
                        </div>
                        <div
                          className={`rounded-lg p-3 text-sm ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border'
                          }`}
                        >
                          {message.content}
                          {message.type === 'ai' && message.source === 'marketaux' && message.contextData?.marketaux && (
                            <div className="mt-3 text-xs text-gray-500 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">Källa: MarketAux</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto px-2 py-1 text-xs"
                                  onClick={() =>
                                    setExpandedContextMessageId((prev) =>
                                      prev === message.id ? null : message.id
                                    )
                                  }
                                >
                                  {expandedContextMessageId === message.id ? 'Dölj källdata' : 'Visa källdata'}
                                </Button>
                              </div>

                              {expandedContextMessageId === message.id && (
                                <div className="space-y-3 border rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                                  {message.contextData.marketaux.summary?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] uppercase font-semibold text-gray-500">Sammanfattning</p>
                                      <ul className="mt-1 list-disc pl-4 space-y-1">
                                        {message.contextData.marketaux.summary.map((line, idx) => (
                                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-300">
                                            {line}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {message.contextData.marketaux.items?.length > 0 && (
                                    <div className="space-y-3">
                                      {message.contextData.marketaux.items.map((item) => (
                                        <div key={item.id} className="border rounded-md p-3 bg-white dark:bg-gray-950 space-y-2">
                                          <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                                            {item.subtitle && (
                                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item.subtitle}</p>
                                            )}
                                          </div>

                                          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                                            {item.source && <span>{item.source}</span>}
                                            {item.publishedAt && <span>{formatPublishedDate(item.publishedAt)}</span>}
                                          </div>

                                          {message.contextData?.marketaux.intent === 'report' && renderReportMetadata(item.metadata)}

                                          {item.url && (
                                            <a
                                              href={item.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex text-xs text-blue-600 hover:underline"
                                            >
                                              Öppna källa
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="flex gap-2">
                        <Bot className="w-6 h-6 p-1 bg-green-100 text-green-600 rounded-full" />
                        <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ställ en snabb fråga om ${stockCase.company_name}...`}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Snabb AI-assistent med information om {stockCase.company_name}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default StockCaseAIChat;
