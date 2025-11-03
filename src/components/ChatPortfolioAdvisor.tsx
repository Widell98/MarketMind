import React, { useState, useRef, useEffect, useMemo, useId, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Brain,
  Send,
  User,
  Bot,
  TrendingUp,
  Plus,
  Trash2,
  Check,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConversationalPortfolio, type ConversationData } from '@/hooks/useConversationalPortfolio';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import useSheetTickers, { RawSheetTicker, SheetTicker, sanitizeSheetTickerList } from '@/hooks/useSheetTickers';
import { mapEdgeFunctionErrorMessage } from '@/utils/mapEdgeFunctionError';

interface QuestionOption {
  value: string;
  label: string;
}

interface Question {
  id: string;
  question: string;
  key: string;
  hasOptions: boolean;
  options?: QuestionOption[];
  showIf?: () => boolean;
  processAnswer?: (answer: string | string[]) => any;
  multiSelect?: boolean;
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  hasOptions?: boolean;
  options?: QuestionOption[];
  hasHoldingsInput?: boolean;
  questionId?: string;
  multiSelect?: boolean;
}

interface Holding {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  nameManuallyEdited: boolean;
  priceManuallyEdited: boolean;
  currency: string;
  currencyManuallyEdited: boolean;
}


interface AdvisorPlanAsset {
  name: string;
  ticker?: string;
  allocationPercent: number;
  rationale?: string;
  riskRole?: string;
}

interface AdvisorPlan {
  actionSummary: string;
  riskAlignment: string;
  nextSteps: string[];
  assets: AdvisorPlanAsset[];
  disclaimer?: string;
  rawText?: string;
}

type ConversationHolding = NonNullable<ConversationData['currentHoldings']>[number];

const normalizeAdvisorPlan = (plan: any, fallbackText?: string): AdvisorPlan | null => {
  if (!plan || typeof plan !== 'object') {
    return null;
  }

  const assetCandidates = Array.isArray(plan.recommended_assets)
    ? plan.recommended_assets
    : Array.isArray(plan.recommendations)
      ? plan.recommendations
      : [];

  const assets: AdvisorPlanAsset[] = assetCandidates
    .map((asset: any) => {
      if (!asset || !asset.name) {
        return null;
      }

      const allocation = typeof asset.allocation_percent === 'number'
        ? asset.allocation_percent
        : typeof asset.allocation_percent === 'string'
        ? parseInt(asset.allocation_percent.replace(/[^\d]/g, ''), 10)
        : typeof asset.allocation === 'number'
        ? asset.allocation
        : typeof asset.allocation === 'string'
        ? parseInt(asset.allocation.replace(/[^\d]/g, ''), 10)
        : 0;

      return {
        name: String(asset.name).trim(),
        ticker: asset.ticker || asset.symbol || undefined,
        allocationPercent: Number.isFinite(allocation) ? allocation : 0,
        rationale: asset.rationale || asset.reasoning || asset.analysis || undefined,
        riskRole: asset.risk_role || asset.role || undefined,
      };
    })
    .filter((asset): asset is AdvisorPlanAsset => Boolean(asset));

  const toList = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(item => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(/\n+/)
        .map(item => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const actionSummary =
    (typeof plan.action_summary === 'string' && plan.action_summary.trim()) ||
    (typeof plan.summary === 'string' && plan.summary.trim()) ||
    (Array.isArray(plan.summary) ? plan.summary.map((item: any) => String(item).trim()).join(' ') : '');

  const riskAlignment =
    (typeof plan.risk_alignment === 'string' && plan.risk_alignment.trim()) ||
    (typeof plan.riskAnalysis === 'string' && plan.riskAnalysis.trim()) ||
    (Array.isArray(plan.risk_analysis)
      ? plan.risk_analysis.map((item: any) => String(item).trim()).join(' ')
      : '');

  const nextSteps = toList(plan.next_steps || plan.action_plan || plan.implementation_plan);

  return {
    actionSummary,
    riskAlignment,
    nextSteps,
    assets,
    disclaimer: typeof plan.disclaimer === 'string' ? plan.disclaimer.trim() : undefined,
    rawText: fallbackText,
  };
};

const supportedCurrencies = [
  'SEK',
  'USD',
  'EUR',
  'GBP',
  'NOK',
  'DKK',
  'CHF',
  'CAD',
  'AUD'
];

const matchCurrencyFromText = (text?: string | null): string | undefined => {
  if (!text) {
    return undefined;
  }

  const upper = text.toUpperCase();
  const codeMatches = upper.match(/[A-Z]{3}/g);

  if (codeMatches && codeMatches.length > 0) {
    for (const code of codeMatches) {
      if (supportedCurrencies.includes(code)) {
        return code;
      }
    }

    return undefined;
  }

  if (/SEK|KRON/iu.test(upper)) return 'SEK';
  if (/USD|DOLLAR/iu.test(upper)) return 'USD';
  if (/EUR|EURO/iu.test(upper)) return 'EUR';
  if (/GBP|POUND/iu.test(upper)) return 'GBP';
  if (/NOK/iu.test(upper)) return 'NOK';
  if (/DKK/iu.test(upper)) return 'DKK';
  if (/CHF/iu.test(upper)) return 'CHF';
  if (/CAD/iu.test(upper)) return 'CAD';
  if (/AUD/iu.test(upper)) return 'AUD';

  return undefined;
};

const ChatPortfolioAdvisor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [portfolioResult, setPortfolioResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingToRemove, setHoldingToRemove] = useState<Holding | null>(null);
  const [showHoldingsInput, setShowHoldingsInput] = useState(false);
  const [localLoading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [pendingMultiSelect, setPendingMultiSelect] = useState<string[]>([]);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const { generatePortfolioFromConversation, loading } = useConversationalPortfolio();
  const { refetch } = usePortfolio();
  const { refetch: refetchHoldings } = useUserHoldings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { tickers, isLoading: tickersLoading, error: tickersError } = useSheetTickers();
  const rawTickerListId = useId();
  const tickerDatalistId = `advisor-sheet-tickers-${rawTickerListId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [dynamicTickers, setDynamicTickers] = useState<SheetTicker[]>([]);
  const [finnhubPriceCache, setFinnhubPriceCache] = useState<Record<string, { price: number; currency: string | null }>>({});
  const symbolLookupTimeouts = useRef<Map<string, number>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportingHoldings, setIsImportingHoldings] = useState(false);

  const generateHoldingId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  const combinedTickers = useMemo(() => {
    const map = new Map<string, SheetTicker>();

    const normalizeName = (name?: string | null) => name?.trim().toLowerCase() ?? null;

    const mergeTicker = (ticker: SheetTicker) => {
      const symbol = ticker.symbol.toUpperCase();
      const existing = map.get(symbol);

      if (!existing) {
        const cached = finnhubPriceCache[symbol];
        map.set(symbol, {
          ...ticker,
          symbol,
          price: cached?.price ?? ticker.price ?? null,
          currency: cached?.currency ?? ticker.currency ?? null
        });
        return;
      }

      const existingName = normalizeName(existing.name);
      const newName = normalizeName(ticker.name);
      const symbolName = symbol.toLowerCase();
      const namesMatch = Boolean(existingName && newName && (existingName === newName || existingName === symbolName || newName === symbolName));

      const existingSource = existing.source ?? null;
      const newSource = ticker.source ?? null;

      if (existingSource === 'sheet' && newSource !== 'sheet' && existingName && newName && !namesMatch) {
        return;
      }

      if (newSource === 'sheet' && existingSource !== 'sheet') {
        const cached = finnhubPriceCache[symbol];
        map.set(symbol, {
          ...existing,
          ...ticker,
          symbol,
          price: cached?.price ?? ticker.price ?? existing.price ?? null,
          currency: cached?.currency ?? ticker.currency ?? existing.currency ?? null
        });
        return;
      }

      const shouldUpdateName = (!existingName || existingName === symbolName) && newName && newName !== symbolName;
      const shouldUpdatePrice = (!existing.price && ticker.price) || (!existing.currency && ticker.currency);
      const shouldReplace = shouldUpdateName || shouldUpdatePrice || (namesMatch && existingSource !== newSource);

      if (shouldReplace) {
        const cached = finnhubPriceCache[symbol];
        map.set(symbol, {
          ...existing,
          ...ticker,
          symbol,
          price: cached?.price ?? ticker.price ?? existing.price ?? null,
          currency: cached?.currency ?? ticker.currency ?? existing.currency ?? null
        });
      }
    };

    tickers.forEach(mergeTicker);
    dynamicTickers.forEach(mergeTicker);

    return Array.from(map.values());
  }, [tickers, dynamicTickers, finnhubPriceCache]);

  const tickerLookup = useMemo(() => {
    const map = new Map<string, SheetTicker>();
    combinedTickers.forEach(ticker => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });
    return map;
  }, [combinedTickers]);

  const tickerOptions = useMemo(
    () =>
      combinedTickers.map(ticker => {
        const label =
          ticker.name && ticker.name !== ticker.symbol
            ? `${ticker.name} (${ticker.symbol})`
            : ticker.symbol;
        const priceLabel =
          typeof ticker.price === 'number' && Number.isFinite(ticker.price) && ticker.price > 0
            ? ` – ${priceFormatter.format(ticker.price)}${
                ticker.currency ? ` ${ticker.currency}` : ''
              }`.trimEnd()
            : '';

        return (
          <option
            key={ticker.symbol}
            value={ticker.symbol}
            label={`${label}${priceLabel}`}
          />
        );
      }),
    [combinedTickers, priceFormatter]
  );

  const lookupTickerData = useCallback(
    async (symbol: string) => {
      const normalizedSymbol = symbol.trim().toUpperCase();

      if (!normalizedSymbol) {
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke<{ tickers?: RawSheetTicker[] }>('list-sheet-tickers', {
          body: { query: normalizedSymbol }
        });

        if (error) {
          throw new Error(error.message ?? 'Kunde inte hämta tickers.');
        }

        const list = Array.isArray(data?.tickers)
          ? sanitizeSheetTickerList(data?.tickers, typeof data?.source === 'string' ? data.source : 'yahoo')
          : [];

        if (list.length > 0) {
          setDynamicTickers(prev => {
            const map = new Map<string, SheetTicker>();

            const mergeTicker = (ticker: SheetTicker) => {
              const symbol = ticker.symbol.toUpperCase();
              const existing = map.get(symbol);

              if (!existing) {
                map.set(symbol, ticker);
                return;
              }

              const normalizeName = (name?: string | null) => name?.trim().toLowerCase() ?? null;
              const existingName = normalizeName(existing.name);
              const newName = normalizeName(ticker.name);
              const symbolName = symbol.toLowerCase();
              const namesMatch = Boolean(existingName && newName && (existingName === newName || existingName === symbolName || newName === symbolName));

              const existingSource = existing.source ?? null;
              const newSource = ticker.source ?? null;

              if (existingSource === 'sheet' && newSource !== 'sheet' && existingName && newName && !namesMatch) {
                return;
              }

              if (newSource === 'sheet' && existingSource !== 'sheet') {
                map.set(symbol, { ...existing, ...ticker, symbol });
                return;
              }

              const shouldUpdateName = (!existingName || existingName === symbolName) && newName && newName !== symbolName;
              const shouldUpdatePrice = (!existing.price && ticker.price) || (!existing.currency && ticker.currency);
              const shouldReplace = shouldUpdateName || shouldUpdatePrice || (namesMatch && existingSource !== newSource);

              if (shouldReplace) {
                map.set(symbol, { ...existing, ...ticker, symbol });
              }
            };

            prev.forEach(item => mergeTicker(item));
            list.forEach(item => mergeTicker(item));

            return Array.from(map.values());
          });
        }
      } catch (error) {
        console.warn('Failed to fetch ticker suggestions:', error);
      }

      if (!finnhubPriceCache[normalizedSymbol]) {
        try {
          const { data: priceData, error: priceError } = await supabase.functions.invoke<{ price?: number; currency?: string | null }>(
            'get-ticker-price',
            {
              body: { symbol: normalizedSymbol }
            }
          );

          if (priceError) {
            const message = mapEdgeFunctionErrorMessage(
              priceError.message,
              'Kunde inte hämta live-pris.',
            );
            throw new Error(message);
          }

          const resolvedPrice =
            typeof priceData?.price === 'number' && Number.isFinite(priceData.price) && priceData.price > 0
              ? priceData.price
              : null;
          const resolvedCurrency =
            typeof priceData?.currency === 'string' && priceData.currency.trim().length > 0
              ? priceData.currency.trim().toUpperCase()
              : null;

          if (resolvedPrice !== null) {
            setFinnhubPriceCache(prev => {
              const existing = prev[normalizedSymbol];
              if (existing && existing.price === resolvedPrice && existing.currency === resolvedCurrency) {
                return prev;
              }

              return {
                ...prev,
                [normalizedSymbol]: {
                  price: resolvedPrice,
                  currency: resolvedCurrency ?? null
                }
              };
            });
          }
        } catch (error) {
          console.warn('Failed to fetch Finnhub price:', error);
        }
      }
    },
    [finnhubPriceCache]
  );

  const scheduleTickerLookup = useCallback(
    (holdingId: string, symbol: string) => {
      const trimmed = symbol.trim();
      const timeouts = symbolLookupTimeouts.current;
      const existingTimeout = timeouts.get(holdingId);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeouts.delete(holdingId);
      }

      if (typeof window === 'undefined' || trimmed.length < 2) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        void lookupTickerData(trimmed.toUpperCase());
      }, 350);

      timeouts.set(holdingId, timeoutId);
    },
    [lookupTickerData]
  );

  const structuredResponse = useMemo(() => {
    if (portfolioResult?.plan) {
      return normalizeAdvisorPlan(portfolioResult.plan, portfolioResult.aiResponse);
    }

    if (!portfolioResult?.aiResponse) {
      return null;
    }

    try {
      const parsed = JSON.parse(portfolioResult.aiResponse);
      return normalizeAdvisorPlan(parsed, portfolioResult.aiResponse);
    } catch (error) {
      console.warn('Kunde inte tolka AI-svaret som JSON:', error);
      return null;
    }
  }, [portfolioResult?.plan, portfolioResult?.aiResponse]);

  const questions: Question[] = [
    {
      id: 'experienceLevel',
      question: 'Hur länge har du investerat på börsen?',
      key: 'investmentExperienceLevel',
      hasOptions: true,
      options: [
        { value: 'beginner', label: 'Nybörjare (<1 år)' },
        { value: 'intermediate', label: 'Några år (1–3 år)' },
        { value: 'advanced', label: 'Erfaren (3+ år)' }
      ]
    },
    {
      id: 'age',
      question: 'Hur gammal är du?',
      key: 'age',
      hasOptions: false,
      processAnswer: (answer: string | string[]) => {
        const value = Array.isArray(answer) ? answer[0] ?? '' : answer;
        const digitsOnly = value.replace(/[^0-9]/g, '');
        if (digitsOnly.length === 0) {
          return conversationData.age;
        }

        const parsedAge = parseInt(digitsOnly, 10);
        if (Number.isFinite(parsedAge) && parsedAge >= 18 && parsedAge <= 100) {
          return parsedAge;
        }

        return conversationData.age;
      }
    },
    {
      id: 'hasPortfolio',
      question: 'Har du redan några investeringar som du vill optimera?',
      key: 'hasCurrentPortfolio',
      hasOptions: true,
      options: [
        { value: 'yes', label: 'Ja, jag har befintliga investeringar' },
        { value: 'no', label: 'Nej, jag börjar från början' }
      ],
      processAnswer: (answer: string | string[]) => {
        const value = Array.isArray(answer) ? answer[0] ?? '' : answer;
        return value === 'yes';
      }
    },
    {
      id: 'tradingFrequency',
      question: 'Hur ofta handlar du aktier eller andra tillgångar?',
      key: 'tradingFrequency',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false && conversationData.hasCurrentPortfolio === true,
      options: [
        { value: 'rarely', label: 'Sällan (några gånger per år)' },
        { value: 'monthly', label: 'Någon gång i månaden' },
        { value: 'weekly', label: 'Varje vecka eller oftare' }
      ]
    },
    {
      id: 'investedCapital',
      question: 'Hur mycket kapital har du ungefär investerat hittills?',
      key: 'portfolioSize',
      hasOptions: true,
      showIf: () => conversationData.hasCurrentPortfolio === true,
      options: [
        { value: 'under_10000', label: 'Under 10 000 kr' },
        { value: '10000_50000', label: '10 000 – 50 000 kr' },
        { value: '50000_200000', label: '50 000 – 200 000 kr' },
        { value: 'over_200000', label: 'Mer än 200 000 kr' }
      ]
    },
    {
      id: 'beginnerStartCapital',
      question: 'Hur mycket är du beredd att börja investera med?',
      key: 'availableCapital',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'under_1000', label: 'Mindre än 1 000 kr' },
        { value: '1000_10000', label: '1 000 – 10 000 kr' },
        { value: '10000_50000', label: '10 000 – 50 000 kr' },
        { value: 'over_50000', label: 'Mer än 50 000 kr' }
      ]
    },
    {
      id: 'investmentGoalBeginner',
      question: 'Vad är ditt främsta mål med att börja investera?',
      key: 'investmentGoal',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'long_term_savings', label: 'Bygga ett långsiktigt sparande' },
        { value: 'learn_and_test', label: 'Lära mig mer och testa på' },
        { value: 'specific_goal', label: 'Spara till något specifikt (t.ex. bostad, resa)' },
        { value: 'quick_return', label: 'Snabb avkastning' }
      ]
    },
    {
      id: 'investmentGoalExperienced',
      question: 'Vad är ditt främsta mål med investeringarna?',
      key: 'investmentGoal',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false,
      options: [
        { value: 'quick_return', label: 'Snabb avkastning / trading' },
        { value: 'long_term_growth', label: 'Bygga långsiktigt sparande' },
        { value: 'dividend_income', label: 'Extra inkomst via utdelningar' },
        { value: 'other', label: 'Annat' }
      ]
    },
    {
      id: 'timeHorizonBeginner',
      question: 'Hur lång tidshorisont har du för ditt sparande?',
      key: 'timeHorizon',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'short', label: 'Kortsiktigt (0–2 år)' },
        { value: 'medium', label: 'Medellång sikt (3–5 år)' },
        { value: 'long', label: 'Långsiktigt (5+ år)' },
        { value: 'unknown', label: 'Vet inte än' }
      ]
    },
    {
      id: 'timeHorizonExperienced',
      question: 'Hur lång tidshorisont har du på ditt sparande?',
      key: 'timeHorizon',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false,
      options: [
        { value: 'short', label: 'Kortsiktigt (0–2 år)' },
        { value: 'medium', label: 'Medellång sikt (3–5 år)' },
        { value: 'long', label: 'Långsiktigt (5+ år)' }
      ]
    },
    {
      id: 'preferredAssets',
      question: 'Vilka tillgångar är du mest intresserad av?',
      key: 'preferredAssets',
      hasOptions: true,
      options: [
        { value: 'stocks', label: 'Aktier' },
        { value: 'investment_companies', label: 'Investmentbolag' },
        { value: 'crypto', label: 'Kryptovalutor' },
        { value: 'commodities', label: 'Råvaror (t.ex. guld, olja)' }
      ]
    },
    {
      id: 'riskBeginner',
      question: 'Hur ser du på risk?',
      key: 'riskTolerance',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'conservative', label: 'Vill undvika risk – hellre stabilt och tryggt' },
        { value: 'balanced', label: 'Kan ta viss risk för chans till högre avkastning' },
        { value: 'aggressive', label: 'Gillar risk – vill ha möjlighet till riktigt hög avkastning' }
      ]
    },
    {
      id: 'riskExperienced',
      question: 'Vilken risknivå känns rimlig för dig?',
      key: 'riskTolerance',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false,
      options: [
        { value: 'conservative', label: 'Låg risk' },
        { value: 'balanced', label: 'Medelrisk' },
        { value: 'aggressive', label: 'Hög risk' }
      ]
    },
    {
      id: 'monthlyInvestment',
      question: 'Hur mycket planerar du att investera varje månad?',
      key: 'monthlyAmount',
      hasOptions: false,
      processAnswer: (answer: string | string[]) => {
        const value = Array.isArray(answer) ? answer.join(', ') : answer;
        return value.trim();
      }
    },
    {
      id: 'marketReaction',
      question: 'Hur reagerar du när portföljen tappar i värde?',
      key: 'marketCrashReaction',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false && conversationData.hasCurrentPortfolio === true,
      options: [
        { value: 'sell', label: 'Jag blir orolig och vill sälja' },
        { value: 'wait', label: 'Jag försöker avvakta' },
        { value: 'buy_more', label: 'Jag ser det som ett köptillfälle' }
      ]
    },
    {
      id: 'aiSupportExperienced',
      question: 'Vad vill du främst att AI:n ska hjälpa dig med?',
      key: 'portfolioHelp',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false,
      options: [
        { value: 'long_term_portfolio', label: 'Bygga en långsiktig portfölj' },
        { value: 'analyze_holdings', label: 'Ge analyser på mina aktier' },
        { value: 'find_new_investments', label: 'Hitta nya intressanta investeringar' },
        { value: 'learn_more', label: 'Lära mig mer om investeringar' }
      ]
    },
    {
      id: 'aiSupportBeginner',
      question: 'Vad vill du främst att AI:n ska hjälpa dig med?',
      key: 'portfolioHelp',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'step_by_step', label: 'Komma igång steg-för-steg' },
        { value: 'learn_basics', label: 'Lära mig grunderna om aktier & investmentbolag' },
        { value: 'starter_portfolio', label: 'Få förslag på en enkel startportfölj' },
        { value: 'investment_inspiration', label: 'Inspiration till olika investeringstyper (aktier, investmentbolag, krypto m.m.)' }
      ]
    },
    {
      id: 'sectorInterests',
      question: 'Vilka branscher intresserar dig mest? Du kan klicka på alternativen nedan eller ange egna.',
      key: 'sectors',
      hasOptions: true,
      multiSelect: true,
      options: [
        { value: 'Tech & IT', label: 'Tech & IT' },
        { value: 'Hälsa & Life Science', label: 'Hälsa & Life Science' },
        { value: 'Energi', label: 'Energi' },
        { value: 'Konsument & Handel', label: 'Konsument & Handel' },
        { value: 'Fordon & Transport', label: 'Fordon & Transport' },
        { value: 'Finans', label: 'Finans' },
        { value: 'Industri', label: 'Industri' },
        { value: 'Fastigheter', label: 'Fastigheter' },
        { value: 'Grön Energi & Hållbarhet', label: 'Grön Energi & Hållbarhet' },
        { value: 'Spel & Underhållning', label: 'Spel & Underhållning' },
        { value: 'Annat', label: 'Annat' }
      ],
      processAnswer: (answer: string | string[]) => {
        const values = Array.isArray(answer)
          ? answer
          : answer
              .split(',')
              .map(item => item.trim())
              .filter(item => item.length > 0);
        return values.filter((item, index) => values.indexOf(item) === index);
      }
    }
  ];

  const resetMultiSelectState = useCallback(() => {
    setPendingMultiSelect([]);
    setPendingQuestionId(null);
  }, []);

  const prepareQuestionForAnswer = useCallback(
    (question: Question | null) => {
      setActiveQuestion(question);
      if (question?.multiSelect) {
        setPendingQuestionId(question.id);
        setPendingMultiSelect([]);
      } else {
        resetMultiSelectState();
      }
    },
    [resetMultiSelectState]
  );

  const toggleMultiSelectOption = useCallback(
    (questionId: string, value: string) => {
      setPendingQuestionId(prevId => {
        if (prevId !== questionId) {
          setPendingMultiSelect([value]);
          return questionId;
        }

        setPendingMultiSelect(prev => {
          if (prev.includes(value)) {
            return prev.filter(item => item !== value);
          }
          return [...prev, value];
        });
        return prevId;
      });
    },
    []
  );

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation only once
    if (!isInitialized.current) {
      isInitialized.current = true;
      const firstQuestion = questions[0];
      prepareQuestionForAnswer(firstQuestion);
      addBotMessage(
        firstQuestion.question,
        firstQuestion.hasOptions,
        firstQuestion.options,
        false,
        firstQuestion.id,
        firstQuestion.multiSelect
      );
      setWaitingForAnswer(true);
    }
  }, [prepareQuestionForAnswer, questions]);

  const addBotMessage = (
    content: string,
    hasOptions: boolean = false,
    options?: QuestionOption[],
    hasHoldingsInput: boolean = false,
    questionId?: string,
    multiSelect?: boolean
  ) => {
    const message: Message = {
      id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      type: 'bot',
      content,
      timestamp: new Date(),
      hasOptions,
      options,
      hasHoldingsInput,
      questionId,
      multiSelect
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const createHolding = useCallback(
    (overrides: Partial<Holding> = {}): Holding => ({
      id: generateHoldingId(),
      name: '',
      symbol: '',
      quantity: 0,
      purchasePrice: 0,
      nameManuallyEdited: false,
      priceManuallyEdited: false,
      currency: 'SEK',
      currencyManuallyEdited: false,
      ...overrides
    }),
    [generateHoldingId]
  );

  const addHolding = () => {
    const newHolding = createHolding();
    setHoldings(prev => [...prev, newHolding]);
  };

  const parseLocaleNumber = (value: string) => {
    const sanitized = value
      .replace(/\s+/g, '')
      .replace(/[^0-9,\.\-]/g, '')
      .replace(/kr/gi, '')
      .replace(/\u00a0/g, '');

    if (!sanitized) {
      return NaN;
    }

    let normalized = sanitized;

    const hasComma = sanitized.includes(',');
    const hasDot = sanitized.includes('.');

    if (hasComma && hasDot) {
      // Assume dot as thousands separator and comma as decimal separator
      normalized = sanitized.replace(/\./g, '').replace(/,/g, '.');
    } else if (hasComma) {
      normalized = sanitized.replace(/,/g, '.');
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const normalizeHeader = (header: string) => {
    const normalized = header.trim().toLowerCase();

    if (!normalized) return null;

    if (/(symbol|ticker)/.test(normalized)) return 'symbol' as const;
    if (/(kortnamn)/.test(normalized)) return 'symbol' as const;
    if (/(isin)/.test(normalized)) return 'symbol' as const;
    if (/(name|namn|företag|company|bolag)/.test(normalized) && !/kortnamn/.test(normalized)) {
      return 'name' as const;
    }
    if (/(quantity|antal|shares|mängd|aktier|innehav|volym|volume)/.test(normalized)) return 'quantity' as const;
    if (/(purchase|köppris|pris|inköpspris|cost|avg|gav|kurs)/.test(normalized)) return 'purchasePrice' as const;
    if (/(currency|valuta)/.test(normalized)) return 'currency' as const;

    return null;
  };

  const extractCurrencyFromHeader = (header: string) => matchCurrencyFromText(header);

  const inferCurrencyFromSymbol = (symbolRaw: string) => {
    const symbol = symbolRaw.trim().toUpperCase();
    if (symbol.endsWith('.ST')) return 'SEK';
    if (symbol.endsWith('.OL')) return 'NOK';
    if (symbol.endsWith('.CO')) return 'DKK';
    if (symbol.endsWith('.HE')) return 'EUR';
    if (symbol.endsWith('.L')) return 'GBP';
    return undefined;
  };

  const isLikelyISIN = (value: string) => {
    const normalized = value.trim().toUpperCase();
    return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(normalized);
  };

  const parseHoldingsFromCSV = useCallback(
    (text: string): Holding[] => {
      const sanitizedText = text.replace(/\uFEFF/g, '');

      const lines = sanitizedText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        return [];
      }

      const detectDelimiter = (line: string) => {
        const semicolonCount = (line.match(/;/g) || []).length;
        const commaCount = (line.match(/,/g) || []).length;
        if (semicolonCount === 0 && commaCount === 0) {
          return ',';
        }
        return semicolonCount >= commaCount ? ';' : ',';
      };

      const headerLine = lines[0];
      let delimiter = detectDelimiter(headerLine);
      let headerParts = headerLine
        .split(delimiter)
        .map(part => part.replace(/^"|"$/g, '').replace(/^\uFEFF/, ''));

      if (headerParts.length === 1 && delimiter === ',' && headerLine.includes(';')) {
        delimiter = ';';
        headerParts = headerLine.split(delimiter).map(part => part.replace(/^"|"$/g, ''));
      }

      const mappedHeaders = headerParts.map(part => normalizeHeader(part));
      const headerCurrencyHints = headerParts.map(part => extractCurrencyFromHeader(part));
      const hasHeaderRow = mappedHeaders.some(Boolean);

      const columnIndices: Record<'name' | 'symbol' | 'quantity' | 'purchasePrice' | 'currency', number[]> = {
        name: [],
        symbol: [],
        quantity: [],
        purchasePrice: [],
        currency: []
      };

      if (hasHeaderRow) {
        mappedHeaders.forEach((field, index) => {
          if (field) {
            columnIndices[field].push(index);
          }
        });
      } else {
        const defaultOrder: Array<'name' | 'symbol' | 'quantity' | 'purchasePrice' | 'currency'> = [
          'name',
          'symbol',
          'quantity',
          'purchasePrice',
          'currency'
        ];
        headerParts.forEach((_, index) => {
          if (index < defaultOrder.length) {
            columnIndices[defaultOrder[index]].push(index);
          }
        });
      }

      const startIndex = hasHeaderRow ? 1 : 0;
      const prioritizePurchasePriceIndices = (indices: number[]): number[] => {
        if (!indices || indices.length === 0) {
          return indices;
        }

        const gavMatches = new Set<number>();

        indices.forEach(index => {
          const header = headerParts[index];
          if (typeof header === 'string' && /gav/iu.test(header)) {
            gavMatches.add(index);
          }
        });

        if (gavMatches.size === 0) {
          return indices;
        }

        const prioritized: number[] = [];

        gavMatches.forEach(index => {
          if (!prioritized.includes(index)) {
            prioritized.push(index);
          }
        });

        indices.forEach(index => {
          if (!gavMatches.has(index) && !prioritized.includes(index)) {
            prioritized.push(index);
          }
        });

        return prioritized;
      };

      const parsedHoldings: Holding[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const parts = line
          .split(delimiter)
          .map(part => part.replace(/^"|"$/g, '').replace(/^\uFEFF/, '').trim());
        const getValue = (field: 'name' | 'symbol' | 'quantity' | 'purchasePrice' | 'currency') => {
          const rawIndices = columnIndices[field];
          const indices =
            field === 'purchasePrice' ? prioritizePurchasePriceIndices(rawIndices) : rawIndices;
          if (!indices || indices.length === 0) {
            return '';
          }

          for (const index of indices) {
            if (typeof index !== 'number') continue;
            const value = parts[index];
            if (typeof value === 'string' && value.trim().length > 0) {
              return value;
            }
          }

          const [firstIndex] = indices;
          return typeof firstIndex === 'number' ? parts[firstIndex] ?? '' : '';
        };

        const quantityIndices = columnIndices.quantity;
        let quantity = NaN;
        for (const index of quantityIndices) {
          if (typeof index !== 'number') continue;
          const raw = parts[index] ?? '';
          const parsed = parseLocaleNumber(raw);
          if (Number.isFinite(parsed) && parsed > 0) {
            quantity = parsed;
            break;
          }
        }

        const currencyRaw = getValue('currency');
        const currencyFromValue = matchCurrencyFromText(currencyRaw);

        const purchasePriceCandidates = prioritizePurchasePriceIndices(columnIndices.purchasePrice);
        let purchasePrice = NaN;
        let priceCurrencyHint: string | undefined;

        const candidateValues: Array<{ value: number; hint?: string }> = [];

        for (const index of purchasePriceCandidates) {
          if (typeof index !== 'number') continue;
          const raw = parts[index] ?? '';
          const parsed = parseLocaleNumber(raw);

          if (Number.isFinite(parsed) && parsed > 0) {
            candidateValues.push({
              value: parsed,
              hint: headerCurrencyHints[index]
            });
          }
        }

        if (candidateValues.length > 0) {
          const exactCurrencyMatch = currencyFromValue
            ? candidateValues.find(candidate => candidate.hint === currencyFromValue)
            : undefined;

          const withoutHint = candidateValues.find(candidate => !candidate.hint);
          const selectedCandidate = exactCurrencyMatch || withoutHint || candidateValues[0];

          purchasePrice = selectedCandidate.value;
          priceCurrencyHint = selectedCandidate.hint;
        }

        if (Number.isNaN(quantity)) {
          const fallbackRaw = getValue('quantity');
          const fallbackParsed = parseLocaleNumber(fallbackRaw);
          if (Number.isFinite(fallbackParsed) && fallbackParsed > 0) {
            quantity = fallbackParsed;
          }
        }

        if (Number.isNaN(purchasePrice)) {
          const fallbackRaw = getValue('purchasePrice');
          const fallbackParsed = parseLocaleNumber(fallbackRaw);
          if (Number.isFinite(fallbackParsed) && fallbackParsed > 0) {
            purchasePrice = fallbackParsed;
          }
        }

        const nameRaw = getValue('name');
        const symbolRaw = (() => {
          const indices = columnIndices.symbol;
          if (!indices || indices.length === 0) {
            return '';
          }

          let fallback = '';
          for (const index of indices) {
            if (typeof index !== 'number') continue;
            const raw = parts[index];
            if (typeof raw !== 'string') continue;
            const trimmed = raw.trim();
            if (!trimmed) continue;

            if (!isLikelyISIN(trimmed)) {
              return trimmed;
            }

            if (!fallback) {
              fallback = trimmed;
            }
          }

          return fallback;
        })();
        const hasValidQuantity = Number.isFinite(quantity) && quantity > 0;
        const hasValidPrice = Number.isFinite(purchasePrice) && purchasePrice > 0;
        const hasNameOrSymbol = Boolean(nameRaw.trim() || symbolRaw.trim());

        if (!hasValidQuantity || !hasValidPrice || !hasNameOrSymbol) {
          continue;
        }

        const inferredFromSymbol = inferCurrencyFromSymbol(symbolRaw);
        const resolvedCurrency = (
          currencyFromValue ||
          priceCurrencyHint ||
          inferredFromSymbol ||
          'SEK'
        );
        const currencyProvided = Boolean(currencyFromValue || priceCurrencyHint || inferredFromSymbol);

        parsedHoldings.push(
          createHolding({
            name: nameRaw.trim() || symbolRaw.trim().toUpperCase(),
            symbol: symbolRaw.trim().toUpperCase(),
            quantity,
            purchasePrice,
            nameManuallyEdited: true,
            priceManuallyEdited: true,
            currency: resolvedCurrency,
            currencyManuallyEdited: currencyProvided
          })
        );
      }

      return parsedHoldings;
    },
    [createHolding]
  );

  const handleHoldingsFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setIsImportingHoldings(true);

      const resetInput = () => {
        if (event.target) {
          event.target.value = '';
        }
      };

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = typeof reader.result === 'string' ? reader.result : '';

          const parsed = parseHoldingsFromCSV(text);

          if (!parsed.length) {
            throw new Error('Kunde inte tolka några innehav från CSV-filen. Kontrollera formatet.');
          }

          setHoldings(parsed);
          toast({
            title: 'Innehav importerade',
            description: `${parsed.length} innehav har laddats in från din CSV-fil.`,
          });
        } catch (error) {
          console.error('Failed to parse holdings CSV:', error);
          toast({
            title: 'Fel vid import',
            description: error instanceof Error ? error.message : 'Kunde inte läsa CSV-filen. Försök igen.',
            variant: 'destructive',
          });
        } finally {
          setIsImportingHoldings(false);
          resetInput();
        }
      };

      reader.onerror = () => {
        console.error('File reading error');
        toast({
          title: 'Fel vid import',
          description: 'Kunde inte läsa CSV-filen. Försök igen.',
          variant: 'destructive',
        });
        setIsImportingHoldings(false);
        resetInput();
      };

      reader.readAsText(file);
    },
    [parseHoldingsFromCSV, toast]
  );

  const openHoldingsFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleHoldingNameChange = (id: string, value: string) => {
    setHoldings(prev =>
      prev.map(holding =>
        holding.id === id
          ? {
              ...holding,
              name: value,
              nameManuallyEdited: value.trim().length > 0
            }
          : holding
      )
    );
  };

  const handleHoldingSymbolChange = (id: string, rawValue: string) => {
    const normalizedSymbol = rawValue.trim().toUpperCase();

    setHoldings(prev =>
      prev.map(holding => {
        if (holding.id !== id) {
          return holding;
        }

        const ticker = normalizedSymbol ? tickerLookup.get(normalizedSymbol) : undefined;
        const resolvedTickerCurrency = ticker?.currency?.trim()?.toUpperCase();
        const symbolChanged = normalizedSymbol !== (holding.symbol?.trim().toUpperCase() || '');

        let updatedHolding: Holding = {
          ...holding,
          symbol: normalizedSymbol,
          priceManuallyEdited: symbolChanged ? false : holding.priceManuallyEdited
        };

        if (!holding.currencyManuallyEdited) {
          if (resolvedTickerCurrency) {
            updatedHolding = {
              ...updatedHolding,
              currency: resolvedTickerCurrency,
              currencyManuallyEdited: false
            };
          } else if (!normalizedSymbol) {
            updatedHolding = {
              ...updatedHolding,
              currency: 'SEK',
              currencyManuallyEdited: false
            };
          }
        }

        if (ticker) {
          if (!holding.nameManuallyEdited) {
            const resolvedName = ticker.name?.trim() || normalizedSymbol;
            if (holding.name !== resolvedName) {
              updatedHolding = {
                ...updatedHolding,
                name: resolvedName
              };
            }
          }

          if (
            !holding.priceManuallyEdited &&
            typeof ticker.price === 'number' &&
            Number.isFinite(ticker.price) &&
            ticker.price > 0
          ) {
            const normalizedPrice = parseFloat(ticker.price.toFixed(2));
            if (holding.purchasePrice !== normalizedPrice) {
              updatedHolding = {
                ...updatedHolding,
                purchasePrice: normalizedPrice
              };
            }
          }
        }

        if (!ticker && normalizedSymbol.length === 0 && !holding.currencyManuallyEdited && holding.currency !== 'SEK') {
          updatedHolding = {
            ...updatedHolding,
            currency: 'SEK',
            currencyManuallyEdited: false
          };
        }

        return updatedHolding;
      })
    );

    scheduleTickerLookup(id, normalizedSymbol);
  };

  const handleHoldingQuantityChange = (id: string, rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    setHoldings(prev =>
      prev.map(holding =>
        holding.id === id
          ? {
              ...holding,
              quantity: Number.isFinite(parsed) ? parsed : 0
            }
          : holding
      )
    );
  };

  const handleHoldingPurchasePriceChange = (id: string, rawValue: string) => {
    const parsed = parseFloat(rawValue);
    setHoldings(prev =>
      prev.map(holding =>
        holding.id === id
          ? {
              ...holding,
              purchasePrice: Number.isFinite(parsed) ? parsed : 0,
              priceManuallyEdited: rawValue.trim().length > 0
            }
          : holding
        )
    );
  };

  const handleHoldingCurrencyChange = (id: string, rawValue: string) => {
    const normalized = rawValue.trim().toUpperCase();
    setHoldings(prev =>
      prev.map(holding => {
        if (holding.id !== id) {
          return holding;
        }

        if (!normalized || normalized === 'AUTO') {
          const symbol = holding.symbol?.trim().toUpperCase() || '';
          const tickerCurrency = symbol ? tickerLookup.get(symbol)?.currency?.trim()?.toUpperCase() : undefined;
          const fallbackCurrency = holding.currency?.trim()?.toUpperCase() || 'SEK';

          return {
            ...holding,
            currency: tickerCurrency || fallbackCurrency,
            currencyManuallyEdited: false
          };
        }

        return {
          ...holding,
          currency: normalized,
          currencyManuallyEdited: true
        };
      })
    );
  };

  useEffect(() => {
    if (tickerLookup.size === 0) {
      return;
    }

    setHoldings(prev => {
      let hasChanges = false;

      const updatedHoldings = prev.map(holding => {
        const symbol = holding.symbol?.trim().toUpperCase();
        if (!symbol) {
          return holding;
        }

        const ticker = tickerLookup.get(symbol);
        if (!ticker) {
          return holding;
        }

        let nextHolding = holding;
        let modified = false;
        const resolvedCurrency = ticker.currency?.trim()?.toUpperCase();

        if (!holding.nameManuallyEdited) {
          const resolvedName = ticker.name?.trim() || symbol;
          if (holding.name !== resolvedName) {
            nextHolding = { ...nextHolding, name: resolvedName };
            modified = true;
          }
        }

        if (!holding.currencyManuallyEdited && resolvedCurrency && holding.currency !== resolvedCurrency) {
          nextHolding = { ...nextHolding, currency: resolvedCurrency, currencyManuallyEdited: false };
          modified = true;
        }

        if (
          !holding.priceManuallyEdited &&
          typeof ticker.price === 'number' &&
          Number.isFinite(ticker.price) &&
          ticker.price > 0
        ) {
          const normalizedPrice = parseFloat(ticker.price.toFixed(2));
          if (holding.purchasePrice !== normalizedPrice) {
            nextHolding = { ...nextHolding, purchasePrice: normalizedPrice };
            modified = true;
          }
        }

        if (modified) {
          hasChanges = true;
        }

        return nextHolding;
      });

      return hasChanges ? updatedHoldings : prev;
    });
  }, [tickerLookup]);

  useEffect(() => {
    return () => {
      symbolLookupTimeouts.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      symbolLookupTimeouts.current.clear();
    };
  }, []);

  const removeHolding = (id: string) => {
    setHoldings(prev => prev.filter(holding => holding.id !== id));
  };

  const handleHoldingDeleteConfirm = () => {
    if (holdingToRemove) {
      removeHolding(holdingToRemove.id);
      setHoldingToRemove(null);
    }
  };

  const submitHoldings = () => {
    // Normalize holdings with ticker data so currency/exchange aligns with the Google Sheet reference
    const normalizedHoldings = holdings.map(holding => {
      const normalizedSymbol = holding.symbol?.trim().toUpperCase() || '';
      const ticker = normalizedSymbol ? tickerLookup.get(normalizedSymbol) : undefined;
      const resolvedCurrency = ticker?.currency?.trim()?.toUpperCase() || holding.currency?.trim()?.toUpperCase() || 'SEK';

      return {
        ...holding,
        symbol: normalizedSymbol,
        currency: resolvedCurrency
      };
    });

    // More flexible validation - symbol is optional but encouraged
    const validHoldings = normalizedHoldings.filter(h =>
      h.name && h.name.trim() !== '' &&
      h.quantity > 0 &&
      h.purchasePrice > 0
    );

    if (validHoldings.length === 0) {
      toast({
        title: "Inga innehav angivna",
        description: "Du måste ange minst ett innehav med namn, antal och köppris för att fortsätta.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation of what was added
    const conversationHoldings = validHoldings.map(h => ({
      id: h.id,
      name: h.name,
      quantity: h.quantity,
      purchasePrice: h.purchasePrice,
      symbol: h.symbol?.trim() ? h.symbol : undefined,
      currency: h.currency
    }));

    const holdingsText = conversationHoldings
      .map(h => {
        const currencyLabel = h.currency?.trim()?.toUpperCase() || 'SEK';
        const symbolText = h.symbol ? ` (${h.symbol})` : '';
        return `${h.name}${symbolText}: ${h.quantity} st à ${h.purchasePrice} ${currencyLabel}`;
      })
      .join(', ');

    addUserMessage(`Mina nuvarande innehav: ${holdingsText}`);

    // Update conversation data
    const updatedData = {
      ...conversationData,
      currentHoldings: conversationHoldings
    };
    setConversationData(updatedData);
    
    setShowHoldingsInput(false);
    setWaitingForAnswer(false);
    
    // Show confirmation message
    setTimeout(() => {
      addBotMessage(`Perfekt! Jag har registrerat dina ${validHoldings.length} innehav. Nu kan jag analysera din befintliga portfölj och ge bättre rekommendationer.`);
      
      setTimeout(() => {
        moveToNextQuestion();
      }, 1500);
    }, 1000);
  };

  const getCurrentQuestion = () => {
    return activeQuestion;
  };

  const handleAnswer = (answer: string | string[]) => {
    if (!waitingForAnswer || isComplete) return;

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Special handling for portfolio holdings
    if (currentQuestion.id === 'hasPortfolio' && !Array.isArray(answer) && answer === 'yes') {
      // Find the label for the answer
      const option = currentQuestion.options?.find(opt => opt.value === answer);
      const displayAnswer = option ? option.label : answer;
      
      addUserMessage(displayAnswer);
      setWaitingForAnswer(false);
      resetMultiSelectState();

      // Process the answer
      let processedAnswer: any = answer;
      if (currentQuestion.processAnswer) {
        processedAnswer = currentQuestion.processAnswer(answer);
      }

      // Update conversation data
      const updatedData = {
        ...conversationData,
        [currentQuestion.key]: processedAnswer
      };
      setConversationData(updatedData);

      // Show holdings input form
      setTimeout(() => {
        addBotMessage(
          'Perfekt! Ange dina nuvarande innehav nedan så kan jag analysera din portfölj och ge bättre rekommendationer.',
          false,
          undefined,
          true
        );
        setShowHoldingsInput(true);
        setHoldings([createHolding()]);
      }, 1000);

      prepareQuestionForAnswer(null);

      return;
    }

    // Normal question handling
    // Find the label for the answer if it has options
    let displayAnswer: string;
    if (Array.isArray(answer)) {
      if (currentQuestion.hasOptions && currentQuestion.options) {
        const labelMap = new Map(currentQuestion.options.map(opt => [opt.value, opt.label]));
        displayAnswer = answer.map(value => labelMap.get(value) ?? value).join(', ');
      } else {
        displayAnswer = answer.join(', ');
      }
    } else {
      displayAnswer = answer;
      if (currentQuestion.hasOptions && currentQuestion.options) {
        const option = currentQuestion.options.find(opt => opt.value === answer);
        if (option) {
          displayAnswer = option.label;
        }
      }
    }

    addUserMessage(displayAnswer);
    setWaitingForAnswer(false);
    resetMultiSelectState();

    // Process the answer
    let processedAnswer: any = answer;
    if (currentQuestion.processAnswer) {
      processedAnswer = currentQuestion.processAnswer(answer);
    }

    // Update conversation data
    const updatedData = {
      ...conversationData,
      [currentQuestion.key]: processedAnswer
    };

    if (currentQuestion.id === 'experienceLevel') {
      updatedData.isBeginnerInvestor = processedAnswer === 'beginner';
    }

    if (currentQuestion.key === 'monthlyAmount') {
      let numericAnswer: number | null = null;

      if (typeof processedAnswer === 'string') {
        const cleaned = processedAnswer.replace(/[^0-9.,-]/g, '').replace(',', '.');
        if (cleaned.length > 0) {
          const parsed = Number(cleaned);
          if (!Number.isNaN(parsed)) {
            numericAnswer = parsed;
          }
        }
      } else if (typeof processedAnswer === 'number' && Number.isFinite(processedAnswer)) {
        numericAnswer = processedAnswer;
      }

      if (numericAnswer !== null) {
        (updatedData as ConversationData).monthlyAmountNumeric = Math.round(numericAnswer);
      } else {
        delete (updatedData as ConversationData).monthlyAmountNumeric;
      }
    }
    setConversationData(updatedData);

    // Move to next question
    setTimeout(() => {
      moveToNextQuestion();
    }, 1000);
  };

  const moveToNextQuestion = () => {
    let nextStep = currentStep + 1;
    
    // Skip questions that shouldn't be shown
    while (nextStep < questions.length) {
      const nextQuestion = questions[nextStep];
      if (!nextQuestion.showIf || nextQuestion.showIf()) {
        break;
      }
      nextStep++;
    }

    if (nextStep >= questions.length) {
      // Conversation complete
      prepareQuestionForAnswer(null);
      completeConversation();
    } else {
      setCurrentStep(nextStep);
      const nextQuestion = questions[nextStep];

      prepareQuestionForAnswer(nextQuestion);
      setTimeout(() => {
        addBotMessage(
          nextQuestion.question,
          nextQuestion.hasOptions,
          nextQuestion.options,
          false,
          nextQuestion.id,
          nextQuestion.multiSelect
        );
        setWaitingForAnswer(true);
      }, 500);
    }
  };

  const confirmMultiSelectSelection = () => {
    if (!activeQuestion || !activeQuestion.multiSelect) {
      return;
    }

    if (pendingMultiSelect.length === 0) {
      return;
    }

    handleAnswer(pendingMultiSelect);
  };

  const saveUserHoldings = async (holdings: ConversationHolding[]) => {
    if (!user || holdings.length === 0) return;

    try {
      const roundToTwo = (value: number) => Math.round(value * 100) / 100;

      // Transform holdings to match the user_holdings table structure
      const holdingsToInsert = holdings.map(holding => {
        const trimmedSymbol = typeof holding.symbol === 'string' ? holding.symbol.trim() : '';
        const normalizedSymbol = trimmedSymbol.length > 0 ? trimmedSymbol.toUpperCase() : null;
        const ticker = normalizedSymbol ? tickerLookup.get(normalizedSymbol) : undefined;

        const sheetPrice = ticker && typeof ticker.price === 'number' && Number.isFinite(ticker.price) && ticker.price > 0
          ? roundToTwo(ticker.price)
          : null;
        const manualPrice = holding.purchasePrice > 0 ? roundToTwo(holding.purchasePrice) : null;
        const resolvedPrice = sheetPrice ?? manualPrice;
        const baseCurrency = ticker?.currency?.trim()?.toUpperCase() || holding.currency?.trim()?.toUpperCase() || 'SEK';
        const priceCurrency = resolvedPrice !== null || manualPrice !== null ? baseCurrency : null;
        const quantity = Number.isFinite(holding.quantity) && holding.quantity > 0 ? holding.quantity : 0;

        const currentValue = quantity > 0 && resolvedPrice !== null
          ? roundToTwo(resolvedPrice * quantity)
          : quantity > 0 && manualPrice !== null
            ? roundToTwo(manualPrice * quantity)
            : null;

        return {
          user_id: user.id,
          name: holding.name,
          symbol: normalizedSymbol,
          quantity,
          purchase_price: manualPrice,
          current_price_per_unit: resolvedPrice,
          price_currency: priceCurrency,
          current_value: currentValue,
          currency: baseCurrency,
          holding_type: 'stock', // Default to stock
          purchase_date: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('user_holdings')
        .insert(holdingsToInsert);

      if (error) {
        console.error('Error saving user holdings:', error);
        throw error;
      }

      await refetchHoldings({ silent: true });
    } catch (error) {
      console.error('Failed to save user holdings:', error);
      toast({
        title: "Varning",
        description: "Kunde inte spara dina innehav. De kommer fortfarande att analyseras av AI:n.",
        variant: "destructive",
      });
    }
  };

  const saveRecommendedStocks = async (recommendedStocks: any[]) => {
    if (!user || !recommendedStocks || recommendedStocks.length === 0) return;

    try {
      // Transform recommended stocks to holdings format
      const holdingsToInsert = recommendedStocks.map(stock => ({
        user_id: user.id,
        name: stock.name || stock.symbol || 'Rekommenderad aktie',
        symbol: stock.symbol || null,
        quantity: 0, // No quantity yet, these are recommendations
        purchase_price: stock.expected_price || 0,
        current_value: 0, // No current value since not purchased yet
        currency: 'SEK',
        holding_type: 'recommendation', // Mark as recommendation
        purchase_date: new Date().toISOString(),
        sector: stock.sector || null,
        market: stock.market || 'Swedish'
      }));

      const { error } = await supabase
        .from('user_holdings')
        .insert(holdingsToInsert);

      if (error) {
        console.error('Error saving recommended stocks:', error);
        throw error;
      }
      
      toast({
        title: "Rekommendationer sparade",
        description: `${recommendedStocks.length} AI-rekommenderade aktier har sparats i din översikt`,
      });
    } catch (error) {
      console.error('Failed to save recommended stocks:', error);
      toast({
        title: "Varning", 
        description: "Kunde inte spara AI-rekommendationerna som innehav",
        variant: "destructive",
      });
    }
  };

  const saveAIRecommendationsAsHoldings = async (aiResponse: string) => {
    if (!user) return;

    try {
      const recommendations = extractStockRecommendationsFromAI(aiResponse);

      if (recommendations.length === 0) {
        return;
      }

      // Transform recommendations to holdings format
      const holdingsToInsert = recommendations.map(rec => ({
        user_id: user.id,
        name: rec.name,
        symbol: rec.symbol || null,
        quantity: 0, // No quantity yet, these are recommendations
        purchase_price: rec.expected_price || 0,
        current_value: 0, // No current value since not purchased yet
        currency: 'SEK',
        holding_type: 'recommendation', // Mark as recommendation
        purchase_date: new Date().toISOString(),
        sector: rec.sector || null,
        market: 'Swedish'
      }));

      const { error } = await supabase
        .from('user_holdings')
        .insert(holdingsToInsert);

      if (error) {
        console.error('Error saving AI recommendations as holdings:', error);
        throw error;
      }
      
      toast({
        title: "AI-rekommendationer sparade",
        description: `${holdingsToInsert.length} AI-rekommenderade aktier har lagts till i din översikt`,
      });

      // Refresh holdings data
      await refetchHoldings();

    } catch (error) {
      console.error('Failed to save AI recommendations:', error);
      toast({
        title: "Varning", 
        description: "Kunde inte spara alla AI-rekommendationer",
        variant: "destructive",
      });
    }
  };

  const extractStockRecommendationsFromAI = (aiResponse: string) => {
    try {
      const parsed = JSON.parse(aiResponse);

      const candidateArrays: any[][] = [];

      if (Array.isArray(parsed)) {
        candidateArrays.push(parsed);
      }

      if (parsed && typeof parsed === 'object') {
        const directRecommendations = parsed.recommendations || parsed.recommended_assets || parsed.assets;
        if (Array.isArray(directRecommendations)) {
          candidateArrays.push(directRecommendations);
        }

        if (parsed.plan && typeof parsed.plan === 'object') {
          const planRecommendations = parsed.plan.recommended_assets || parsed.plan.recommendations;
          if (Array.isArray(planRecommendations)) {
            candidateArrays.push(planRecommendations);
          }
        }
      }

      for (const recs of candidateArrays) {
        if (!Array.isArray(recs)) continue;

        const normalized = recs
          .map((rec: any) => {
            if (!rec) return null;
            const name = rec.name || rec.asset || rec.title;
            if (!name) return null;

            const symbol = rec.symbol || rec.ticker || rec.code || '';
            return {
              name,
              symbol: symbol || undefined,
              sector: rec.sector,
              expected_price: rec.expected_price || rec.target_price || rec.price_target
            };
          })
          .filter(Boolean) as Array<{ name: string; symbol?: string; sector?: string; expected_price?: number }>;

        if (normalized.length > 0) {
          return normalized.slice(0, 8);
        }
      }
    } catch (e) {
      console.warn('AI response not valid JSON, using regex extraction');
    }

    // Look for common patterns in AI responses that indicate stock recommendations
    const patterns = [
      // Pattern for "Rekommenderade aktier:" followed by list
      /rekommenderade\s+aktier?[:\s]+(.*?)(?=\n\n|$)/gis,
      // Pattern for "Förslag:" followed by list  
      /förslag[:\s]+(.*?)(?=\n\n|$)/gis,
      // Pattern for "Köp:" followed by list
      /köp[:\s]+(.*?)(?=\n\n|$)/gis,
      // Pattern for bullet points with stock names
      /[-•]\s*([A-ZÅÄÖ][a-zåäöA-ZÅÄÖ\s&]+)(?:\s*\([A-Z]+\))?(?:\s*[-–]\s*[^.\n]+)?/g,
      // Pattern for numbered lists with companies
      /\d+\.\s*([A-ZÅÄÖ][a-zåäöA-ZÅÄÖ\s&]+)(?:\s*\([A-Z]+\))?/g
    ];

    const recommendations: Array<{
      name: string;
      symbol?: string;
      sector?: string;
      expected_price?: number;
    }> = [];

    // Try each pattern
    for (const pattern of patterns) {
      const matches = aiResponse.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract company name and potential symbol
          const cleanMatch = match.replace(/^[-•\d+\.\s]+/, '').trim();
          const symbolMatch = cleanMatch.match(/\(([A-Z]+)\)/);
          const symbol = symbolMatch ? symbolMatch[1] : undefined;
          const name = cleanMatch.replace(/\s*\([A-Z]+\).*$/, '').trim();
          
          // Basic validation - should be a reasonable company name
          if (name.length > 2 && name.length < 50 && /^[A-ZÅÄÖ]/.test(name)) {
            // Check if we already have this recommendation
            const exists = recommendations.some(r => r.name.toLowerCase() === name.toLowerCase());
            if (!exists) {
              recommendations.push({
                name,
                symbol,
                sector: extractSectorFromContext(aiResponse, name),
                expected_price: extractPriceFromContext(aiResponse, name)
              });
            }
          }
        });
      }
    }

    // Also look for well-known Swedish companies mentioned in context
    const knownSwedishStocks = [
      'Investor', 'Volvo', 'Ericsson', 'H&M', 'Spotify', 'Evolution Gaming',
      'Elekta', 'Atlas Copco', 'Sandvik', 'SKF', 'Telia', 'Nordea',
      'SEB', 'Handelsbanken', 'Swedbank', 'Kinnevik', 'ICA Gruppen',
      'Getinge', 'Boliden', 'SSAB', 'Saab', 'Autoliv'
    ];

    knownSwedishStocks.forEach(stock => {
      const regex = new RegExp(`\\b${stock}\\b`, 'gi');
      if (regex.test(aiResponse)) {
        const exists = recommendations.some(r => r.name.toLowerCase() === stock.toLowerCase());
        if (!exists) {
          recommendations.push({
            name: stock,
            sector: getKnownStockSector(stock),
          });
        }
      }
    });

    return recommendations.slice(0, 8); // Limit to 8 recommendations
  };

  const extractSectorFromContext = (text: string, companyName: string): string | undefined => {
    const sectors = ['teknologi', 'hälsa', 'finans', 'industri', 'konsument', 'energi', 'fastighet'];
    const lowerText = text.toLowerCase();
    const companyIndex = lowerText.indexOf(companyName.toLowerCase());
    
    if (companyIndex !== -1) {
      const contextWindow = lowerText.substring(Math.max(0, companyIndex - 100), companyIndex + 100);
      for (const sector of sectors) {
        if (contextWindow.includes(sector)) {
          return sector.charAt(0).toUpperCase() + sector.slice(1);
        }
      }
    }
    return undefined;
  };

  const extractPriceFromContext = (text: string, companyName: string): number | undefined => {
    const companyIndex = text.toLowerCase().indexOf(companyName.toLowerCase());
    if (companyIndex !== -1) {
      const contextWindow = text.substring(Math.max(0, companyIndex - 50), companyIndex + 100);
      const priceMatch = contextWindow.match(/(\d+(?:[.,]\d+)?)\s*(?:kr|sek|kronor)/i);
      if (priceMatch) {
        return parseFloat(priceMatch[1].replace(',', '.'));
      }
    }
    return undefined;
  };

  const getKnownStockSector = (stockName: string): string => {
    const sectorMap: Record<string, string> = {
      'Investor': 'Finans',
      'Volvo': 'Industri', 
      'Ericsson': 'Teknologi',
      'H&M': 'Konsument',
      'Spotify': 'Teknologi',
      'Evolution Gaming': 'Teknologi',
      'Elekta': 'Hälsa',
      'Atlas Copco': 'Industri',
      'Sandvik': 'Industri',
      'SKF': 'Industri',
      'Telia': 'Teknologi',
      'Nordea': 'Finans',
      'SEB': 'Finans',
      'Handelsbanken': 'Finans',
      'Swedbank': 'Finans',
      'Saab': 'Industri'
    };
    return sectorMap[stockName] || 'Övrigt';
  };

  const completeConversation = async () => {
    setIsGenerating(true);
    addBotMessage('Tack för alla svar! Jag skapar nu din personliga portföljstrategi...');
    
    // Save user holdings to database if they exist
    if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
      await saveUserHoldings(conversationData.currentHoldings);
    }
    
    const result = await generatePortfolioFromConversation(conversationData);
    
    if (result) {
      setPortfolioResult(result);
      setIsComplete(true);
      
      // Extract and save AI recommendations from the response
      if (result.aiResponse) {
        await saveAIRecommendationsAsHoldings(result.aiResponse);
      }
      
      // Also save portfolio recommended stocks if they exist
      if (result.portfolio?.recommended_stocks && Array.isArray(result.portfolio.recommended_stocks) && result.portfolio.recommended_stocks.length > 0) {
        await saveRecommendedStocks(result.portfolio.recommended_stocks);
      }
      
      await refetch();
      
      setTimeout(() => {
        addBotMessage('🎉 Din personliga portföljstrategi är klar! Här är mina rekommendationer:');
      }, 1000);
    }
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim() && waitingForAnswer) {
      handleAnswer(currentInput.trim());
      setCurrentInput('');
    }
  };

  const handleImplementStrategy = async () => {
    try {
      // Show immediate feedback
      toast({
        title: "Implementerar strategi",
        description: "Din portföljstrategi implementeras och profilen uppdateras...",
      });

      // Refresh both portfolio and holdings data to ensure we have the latest
      await Promise.all([
        refetch(),
        refetchHoldings()
      ]);
      
      // Navigate to implementation page
      navigate('/portfolio-implementation');
      
      // Show success message after navigation
      setTimeout(() => {
        toast({
          title: "Strategi implementerad!",
          description: "Din portföljstrategi är nu aktiv och redo att användas. Innehaven visas nu i översikten.",
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error implementing strategy:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte implementera strategin helt. Kontrollera din profil på implementeringssidan.",
        variant: "destructive",
      });
      
      // Navigate anyway since the portfolio might still be created
      navigate('/portfolio-implementation');
    }
  };

  const renderAdvisorResponse = () => {
    const aiContent = portfolioResult?.aiResponse;
    if (!aiContent || typeof aiContent !== 'string') {
      return <div className="text-muted-foreground">Inget svar mottaget från AI.</div>;
    }

    const plan = structuredResponse;

    if (!plan) {
      return (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {aiContent
            .split(/\n{2,}/)
            .map(paragraph => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`fallback-${index}`}>{paragraph}</p>
            ))}
        </div>
      );
    }

    return (
      <div className="space-y-5 text-sm leading-relaxed text-foreground">
        {plan.actionSummary && (
          <p className="text-base font-medium text-foreground">{plan.actionSummary}</p>
        )}

        {plan.riskAlignment && (
          <p className="text-muted-foreground">{plan.riskAlignment}</p>
        )}

        {plan.nextSteps.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Så går du vidare</h4>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              {plan.nextSteps.map((step, index) => (
                <li key={`step-${index}`} className="text-foreground">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {plan.assets.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Köpplan & allokering</h4>
            <div className="mt-2 space-y-2">
              {plan.assets.map((asset, index) => (
                <div
                  key={`${asset.name}-${asset.ticker ?? index}`}
                  className="rounded-lg border border-border/60 bg-background/70 p-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-semibold text-foreground">{asset.name}</span>
                      {asset.ticker && (
                        <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                          {asset.ticker}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary">{asset.allocationPercent}%</span>
                  </div>
                  {asset.rationale && (
                    <p className="mt-2 text-sm text-muted-foreground">{asset.rationale}</p>
                  )}
                  {asset.riskRole && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Roll i portföljen: {asset.riskRole}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.disclaimer && (
          <p className="text-xs text-muted-foreground italic border-t border-border/60 pt-3">
            {plan.disclaimer}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[75vh] lg:h-[80vh] xl:h-[85vh] bg-transparent overflow-hidden">
      {/* Chat Header - matching AIChat style */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">AI Portfolio Rådgivare</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Personlig konsultation</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
            Konsultation
          </Badge>
        </div>
      </div>

      {/* Messages Container - matching AIChat style */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.type === 'bot' ? (
                <div className="flex gap-2 sm:gap-3 items-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-3 sm:p-4 border shadow-sm">
                      <div className="prose prose-sm max-w-none text-foreground">
                        <p className="text-sm sm:text-base leading-relaxed mb-0">{message.content}</p>
                      </div>
                      
                      {/* Show predefined options if available */}
                      {message.hasOptions && message.options && waitingForAnswer && !showHoldingsInput && message.questionId === activeQuestion?.id && (
                        <div className="mt-3 sm:mt-4 space-y-3">
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {message.options.map((option) => {
                              const isSelected =
                                message.multiSelect &&
                                pendingQuestionId === message.questionId &&
                                pendingMultiSelect.includes(option.value);

                              return (
                                <Button
                                  key={option.value}
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  className={`text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                      : 'bg-background/80 hover:bg-background border-border/50 hover:border-border'
                                  }`}
                                  onClick={() =>
                                    message.multiSelect && message.questionId
                                      ? toggleMultiSelectOption(message.questionId, option.value)
                                      : handleAnswer(option.value)
                                  }
                                >
                                  {option.label}
                                </Button>
                              );
                            })}
                          </div>

                          {message.multiSelect && (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={confirmMultiSelectSelection}
                                disabled={pendingMultiSelect.length === 0}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                Bekräfta val
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPendingMultiSelect([]);
                                  setPendingQuestionId(message.questionId ?? null);
                                }}
                                disabled={pendingMultiSelect.length === 0}
                                className="text-xs sm:text-sm"
                              >
                                Rensa val
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Holdings Input Form */}
                      {message.hasHoldingsInput && showHoldingsInput && (
                        <div className="mt-4 space-y-4">
                          <div className="text-sm text-muted-foreground mb-3 space-y-2">
                            <p className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600" />
                              Fyll i dina innehav nedan. Symbol/ticker är valfritt men rekommenderat för bättre analys.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Du kan också importera en CSV-fil med kolumnerna namn, symbol, antal, köppris och valuta.
                            </p>
                            {tickersLoading && (
                              <p className="text-xs text-muted-foreground">Hämtar tickerlista från Google Sheets...</p>
                            )}
                            {tickersError && (
                              <p className="text-xs text-muted-foreground">{tickersError}</p>
                            )}
                            {!tickersLoading && !tickersError && tickers.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Välj en symbol från listan eller skriv in den manuellt för att fylla i namn och pris automatiskt.
                              </p>
                            )}
                          </div>

                          <div className="max-h-60 overflow-y-auto space-y-3">
                            {holdings.map(holding => (
                              <div
                                key={holding.id}
                                className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-3 bg-background/50 rounded-lg border"
                              >
                                <Input
                                  placeholder="Företagsnamn *"
                                  value={holding.name}
                                  onChange={(e) => handleHoldingNameChange(holding.id, e.target.value)}
                                  className="text-xs sm:text-sm"
                                  required
                                />
                                <Input
                                  placeholder={tickersLoading ? 'Hämtar tickers...' : 'Symbol (t.ex. AAPL)'}
                                  value={holding.symbol}
                                  onChange={(e) => handleHoldingSymbolChange(holding.id, e.target.value)}
                                  className="text-xs sm:text-sm"
                                  list={tickerDatalistId}
                                />
                                <Input
                                  type="number"
                                  placeholder="Antal *"
                                  value={holding.quantity || ''}
                                  onChange={(e) => handleHoldingQuantityChange(holding.id, e.target.value)}
                                  className="text-xs sm:text-sm"
                                  required
                                  min="1"
                                />
                                <Input
                                  type="number"
                                  placeholder={`Köppris (${holding.currency || 'SEK'}) *`}
                                  value={holding.purchasePrice || ''}
                                  onChange={(e) => handleHoldingPurchasePriceChange(holding.id, e.target.value)}
                                  className="text-xs sm:text-sm"
                                  required
                                  min="0"
                                  step="0.01"
                                />
                                <Select
                                  value={holding.currencyManuallyEdited ? holding.currency : 'AUTO'}
                                  onValueChange={(value) => handleHoldingCurrencyChange(holding.id, value)}
                                >
                                  <SelectTrigger className="text-xs sm:text-sm">
                                    <SelectValue placeholder="Valuta" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AUTO">Auto (ticker)</SelectItem>
                                    {supportedCurrencies.map(currency => (
                                      <SelectItem key={currency} value={currency}>
                                        {currency}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setHoldingToRemove(holding)}
                                  className="h-8 sm:h-9 px-2 text-red-600 hover:text-red-700"
                                  disabled={holdings.length === 1}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <datalist id={tickerDatalistId}>{tickerOptions}</datalist>

                          <AlertDialog
                            open={!!holdingToRemove}
                            onOpenChange={(open) => {
                              if (!open) {
                                setHoldingToRemove(null);
                              }
                            }}
                          >
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-lg font-semibold">
                                  Ta bort innehav
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-muted-foreground">
                                  Är du säker på att du vill ta bort {holdingToRemove?.name || 'detta innehav'}? Denna åtgärd kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg">
                                  Avbryt
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleHoldingDeleteConfirm}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Holdings Summary */}
                          {holdings.some(h => h.name && h.quantity > 0 && h.purchasePrice > 0) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-800 mb-2">Innehav att registrera:</p>
                              <div className="space-y-1">
                                {holdings
                                  .filter(h => h.name && h.name.trim() !== '' && h.quantity > 0 && h.purchasePrice > 0)
                                  .map(h => (
                                    <div key={h.id} className="text-xs text-green-700 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      {h.name}{h.symbol && h.symbol.trim() ? ` (${h.symbol})` : ''}: {h.quantity} st à {h.purchasePrice} {(h.currency || 'SEK')}
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv,text/csv"
                              className="hidden"
                              onChange={handleHoldingsFileUpload}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={openHoldingsFileDialog}
                              disabled={isImportingHoldings}
                              className="flex items-center gap-1 text-xs sm:text-sm"
                            >
                              <Upload className="w-3 h-3" />
                              {isImportingHoldings ? 'Importerar...' : 'Importera CSV'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addHolding}
                              className="flex items-center gap-1 text-xs sm:text-sm"
                            >
                              <Plus className="w-3 h-3" />
                              Lägg till innehav
                            </Button>
                            <Button
                              onClick={submitHoldings}
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-xs sm:text-sm"
                            >
                              Fortsätt med konsultation
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 sm:gap-3 items-start justify-end">
                  <div className="bg-primary/10 backdrop-blur-sm rounded-2xl rounded-tr-lg p-2.5 sm:p-3 border border-primary/20 shadow-sm max-w-[80%] sm:max-w-md">
                    <p className="text-sm sm:text-base text-foreground">{message.content}</p>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Show AI response when complete */}
          {isComplete && portfolioResult && (
            <div className="flex gap-2 sm:gap-3 items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-primary/10 backdrop-blur-sm rounded-2xl rounded-tl-lg p-3 sm:p-4 border border-primary/20 shadow-sm">
                  <div className="prose prose-sm max-w-none text-foreground">
                    {renderAdvisorResponse()}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <Button 
                      onClick={handleImplementStrategy}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={loading}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {loading ? "Implementerar..." : "Implementera Strategin"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex gap-2 sm:gap-3 items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-3 sm:p-4 border shadow-sm">
                <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                  <span>Analyserar dina svar och skapar strategi...</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Chat Input - matching AIChat style */}
      {waitingForAnswer && !isComplete && !showHoldingsInput && (
        <div className="flex-shrink-0 p-3 sm:p-4 border-t bg-card/30 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={activeQuestion?.multiSelect ? 'Skriv ett eget svar här...' : 'Skriv ditt svar här...'}
                className="pr-12 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors text-sm sm:text-base h-9 sm:h-10"
                disabled={isComplete}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!currentInput.trim() || isComplete}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 h-9 sm:h-10 px-3 sm:px-4"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatPortfolioAdvisor;
