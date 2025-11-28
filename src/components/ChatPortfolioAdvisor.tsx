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
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConversationalPortfolio, type ConversationData } from '@/hooks/useConversationalPortfolio';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import useSheetTickers, { RawSheetTicker, SheetTicker, sanitizeSheetTickerList } from '@/hooks/useSheetTickers';
import StockReplacementDialog from '@/components/StockReplacementDialog';
import { mapEdgeFunctionErrorMessage } from '@/utils/mapEdgeFunctionError';
import { normalizeShareClassTicker, parsePortfolioHoldingsFromCSV } from '@/utils/portfolioCsvImport';
import { hasLikelyTicker, isListedCompany } from '@/utils/listedCompanies';

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
  allocationPercent?: number;
  changePercent?: number;
  rationale?: string;
  riskRole?: string;
  actionType?: string;
  notes?: string;
}

interface AdvisorPlan {
  actionSummary: string;
  riskAlignment: string;
  nextSteps: string[];
  assets: AdvisorPlanAsset[];
  disclaimer?: string;
  rawText?: string;
  complementaryAssets?: AdvisorPlanAsset[];
}

type ConversationHolding = NonNullable<ConversationData['currentHoldings']>[number];

interface StockRecommendation {
  name: string;
  symbol?: string;
  sector?: string;
  reasoning?: string;
  allocation?: number;
  isin?: string;
  actionType?: string;
  changePercent?: number;
  notes?: string;
  expectedPrice?: number;
  expected_price?: number;
  market?: string;
}

interface PortfolioGenerationResult {
  aiResponse?: string;
  plan?: any;
  portfolio?: any;
  riskProfile?: any;
  enhancedPrompt?: string;
  stockRecommendations?: StockRecommendation[];
  complementaryIdeas?: StockRecommendation[];
  mode?: 'new' | 'optimize';
}

interface ReplacementTarget {
  asset: AdvisorPlanAsset;
  index: number;
  recommendation?: StockRecommendation;
}

interface RecommendationUpdateContext {
  index: number;
  updatedRecommendedStocks?: StockRecommendation[];
  updatedAssetAllocation?: any;
  updatedPlanAssets?: AdvisorPlanAsset[];
}

const deepClone = <T,>(value: T): T => {
  if (value == null) {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to deep clone value', error);
    return value;
  }
};

const removeUndefined = <T extends Record<string, any>>(value: T): T => {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return Object.fromEntries(entries) as T;
};

const normalizeAdvisorPlan = (rawPlan: any, fallbackText?: string): AdvisorPlan | null => {
  let plan = rawPlan;

  if (typeof plan === 'string') {
    try {
      plan = JSON.parse(plan);
    } catch (error) {
      console.warn('Unable to parse advisor plan text as JSON', error);
      return null;
    }
  }

  if (!plan || typeof plan !== 'object') {
    return null;
  }

  const toArray = (value: unknown): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return Object.values(value);
    return [];
  };

  const dedupeAssets = (assets: AdvisorPlanAsset[]): AdvisorPlanAsset[] => {
    const seen = new Set<string>();
    return assets.filter(asset => {
      const key = `${asset.name.toLowerCase()}|${(asset.ticker ?? '').toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const parsePercentValue = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const absolute = Math.abs(value);
      if (absolute > 0 && absolute <= 1) {
        return Math.round(value * 100);
      }
      return Math.round(value);
    }

    if (typeof value === 'string') {
      const match = value.match(/-?\d+(?:[.,]\d+)?/);
      if (match) {
        const parsed = parseFloat(match[0].replace(',', '.'));
        if (Number.isFinite(parsed)) {
          return Math.round(parsed);
        }
      }
    }

    return undefined;
  };

  const normalizeActionType = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    if (/behåll|behold|hold|keep/.test(normalized)) return 'hold';
    if (/öka|increase|buy more|köp mer|addera mer/.test(normalized)) return 'increase';
    if (/lägg till|add|nytt|introduc|komplettera|complement/.test(normalized)) return 'add';
    if (/minska|reduce|trim|skala ned|dra ned/.test(normalized)) return 'reduce';
    if (/sälj|sell|exit|avyttra/.test(normalized)) return 'sell';
    if (/rebal/.test(normalized)) return 'rebalance';
    if (/övervaka|bevaka|monitor/.test(normalized)) return 'monitor';

    return normalized;
  };

  const mapAdvisorAsset = (asset: any): AdvisorPlanAsset | null => {
    if (!asset || !asset.name) {
      return null;
    }

    const allocation =
      parsePercentValue(asset.allocation_percent) ??
      parsePercentValue(asset.allocation) ??
      parsePercentValue(asset.target_weight) ??
      parsePercentValue(asset.target_allocation_percent);

    const changePercent =
      parsePercentValue(asset.change_percent) ??
      parsePercentValue(asset.weight_change_percent) ??
      parsePercentValue(asset.delta_percent) ??
      parsePercentValue(asset.adjustment_percent);

    const actionType =
      normalizeActionType(asset.action_type) ||
      normalizeActionType(asset.action) ||
      normalizeActionType(asset.recommendation_type) ||
      normalizeActionType(asset.intent);

    const name = String(asset.name).trim();
    if (!name) {
      return null;
    }

    const tickerValue =
      typeof asset.ticker === 'string'
        ? asset.ticker
        : typeof asset.symbol === 'string'
          ? asset.symbol
          : undefined;

    return {
      name,
      ticker: tickerValue?.trim() ? tickerValue.trim().toUpperCase() : undefined,
      allocationPercent: allocation,
      changePercent: changePercent,
      rationale: asset.rationale || asset.reasoning || asset.analysis || asset.comment || undefined,
      riskRole: asset.risk_role || asset.role || undefined,
      actionType,
      notes: asset.notes || asset.note || undefined,
    };
  };

  const assetCandidates = toArray(plan.recommended_assets)
    .concat(toArray(plan.recommendations))
    .concat(toArray(plan.assets));

  const assets: AdvisorPlanAsset[] = dedupeAssets(
    assetCandidates
      .map(mapAdvisorAsset)
      .filter((asset): asset is AdvisorPlanAsset => Boolean(asset))
  );

  const complementaryCandidates = toArray(plan.complementary_assets)
    .concat(toArray(plan.complementaryIdeas))
    .concat(toArray(plan.complementaryAssets));

  const complementaryAssets: AdvisorPlanAsset[] = dedupeAssets(
    complementaryCandidates
      .map(mapAdvisorAsset)
      .filter((asset): asset is AdvisorPlanAsset => Boolean(asset))
  );

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
    if (typeof value === 'object') {
      return Object.values(value)
        .map(item => (typeof item === 'string' ? item.trim() : ''))
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
    complementaryAssets: complementaryAssets.length > 0 ? complementaryAssets : undefined,
    disclaimer: typeof plan.disclaimer === 'string' ? plan.disclaimer.trim() : undefined,
    rawText: fallbackText,
  };
};

const roundPercent = (value: number): number => {
  const rounded = Math.round(value * 10) / 10;
  return Math.abs(rounded) === 0 ? 0 : rounded;
};

const formatPercentValue = (value?: number | null): string | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  const rounded = roundPercent(value);
  return `${rounded}%`;
};

const formatSignedPercent = (value?: number | null): string | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  const rounded = roundPercent(value);
  const prefix = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
  return `${prefix}${Math.abs(rounded)}%`;
};

const getChangeBadgeClass = (value?: number | null): string => {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return 'text-muted-foreground';
  }

  return value > 0 ? 'text-emerald-600' : 'text-rose-600';
};

const getActionLabel = (actionType?: string): string | null => {
  if (!actionType) {
    return null;
  }

  const normalized = actionType.toLowerCase();
  const mapping: Record<string, string> = {
    hold: 'Behåll positionen',
    increase: 'Öka / förstärk',
    add: 'Lägg till nytt innehav',
    reduce: 'Minska exponeringen',
    sell: 'Sälj / avyttra',
    rebalance: 'Rebalansera',
    monitor: 'Övervaka noggrant',
  };

  return mapping[normalized] ?? actionType;
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
  const [portfolioResult, setPortfolioResult] = useState<PortfolioGenerationResult | null>(null);
  const [recommendedStocks, setRecommendedStocks] = useState<StockRecommendation[]>([]);
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
  const hasInitializedRecommendations = useRef(false);

  const { generatePortfolioFromConversation, loading } = useConversationalPortfolio();
  const { activePortfolio, refetch } = usePortfolio();
  const { refetch: refetchHoldings } = useUserHoldings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const startAiChatSession = useCallback(
    (sessionName: string, initialMessage: string) => {
      navigate('/ai-chatt', {
        state: {
          createNewSession: true,
          sessionName,
          initialMessage,
        },
      });
    },
    [navigate]
  );
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
  const [replacementTarget, setReplacementTarget] = useState<ReplacementTarget | null>(null);
  const [isReplacementDialogOpen, setIsReplacementDialogOpen] = useState(false);

  const generateHoldingId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  useEffect(() => {
    if (!isComplete) return;

    // Previously we redirected immediately to the implementation page once an analysis
    // completed, but this prevented users from seeing the AI response. We now keep the
    // user on the advisor view so the recommendation can be reviewed before navigating
    // away.
  }, [isComplete]);

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  const normalizeTickerSymbol = useCallback(
    (value: string) => normalizeShareClassTicker(value).trim().toUpperCase(),
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

  const stockSelectorOptions = useMemo<StockSearchOption[]>(
    () =>
      combinedTickers.map(ticker => ({
        symbol: ticker.symbol,
        name: ticker.name ?? ticker.symbol,
        currency: ticker.currency ?? null,
        price: typeof ticker.price === 'number' ? ticker.price : null,
        sector: null,
        market: null,
        source: ticker.source ?? null,
      })),
    [combinedTickers]
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
    if (!portfolioResult) {
      return null;
    }

    const aiText = (() => {
      const raw = portfolioResult.aiResponse;
      if (typeof raw === 'string') {
        return raw;
      }
      if (raw && typeof raw === 'object') {
        try {
          return JSON.stringify(raw);
        } catch {
          return undefined;
        }
      }
      return undefined;
    })();

    if (portfolioResult.plan !== undefined) {
      const normalized = normalizeAdvisorPlan(portfolioResult.plan, aiText);
      if (normalized) {
        return normalized;
      }
    }

    if (aiText) {
      const normalized = normalizeAdvisorPlan(aiText, aiText);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }, [portfolioResult]);

  useEffect(() => {
    if (!portfolioResult || hasInitializedRecommendations.current) {
      return;
    }

    const portfolioRecommendations = Array.isArray(portfolioResult.portfolio?.recommended_stocks)
      ? (portfolioResult.portfolio?.recommended_stocks as StockRecommendation[])
      : [];

    if (portfolioRecommendations.length > 0) {
      setRecommendedStocks(portfolioRecommendations);
      hasInitializedRecommendations.current = true;
      return;
    }

    if (structuredResponse?.assets?.length) {
      const fallbackRecommendations: StockRecommendation[] = structuredResponse.assets.map(asset => ({
        name: asset.name,
        symbol: asset.ticker,
        allocation: asset.allocationPercent,
        actionType: asset.actionType,
        changePercent: asset.changePercent,
        reasoning: asset.rationale ?? asset.notes,
        notes: asset.notes,
      }));

      setRecommendedStocks(fallbackRecommendations);
      hasInitializedRecommendations.current = true;
    }
  }, [portfolioResult, structuredResponse]);

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
      id: 'investmentGoalBeginner',
      question: 'Vad är ditt främsta mål med att börja investera?',
      key: 'investmentGoal',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true && conversationData.hasCurrentPortfolio !== true,
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
      showIf: () => conversationData.isBeginnerInvestor === false && conversationData.hasCurrentPortfolio !== true,
      options: [
        { value: 'quick_return', label: 'Snabb avkastning / trading' },
        { value: 'long_term_growth', label: 'Bygga långsiktigt sparande' },
        { value: 'dividend_income', label: 'Extra inkomst via utdelningar' },
        { value: 'other', label: 'Annat' }
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
      id: 'monthlyAmount',
      question: 'Hur mycket planerar du att månadsspara varje månad? (SEK)',
      key: 'monthlyAmount',
      hasOptions: false
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

          const parsed = parsePortfolioHoldingsFromCSV(text).map(holding =>
            createHolding({
              name: holding.name,
              symbol: normalizeShareClassTicker(holding.symbol),
              quantity: holding.quantity,
              purchasePrice: holding.purchasePrice,
              nameManuallyEdited: true,
              priceManuallyEdited: true,
              currency: holding.currency,
              currencyManuallyEdited: holding.currencyProvided,
            })
          );

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
    [createHolding, toast]
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
    const normalizedSymbol = normalizeTickerSymbol(rawValue);

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
          const symbol = holding.symbol ? normalizeTickerSymbol(holding.symbol) : '';
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
        const symbol = holding.symbol ? normalizeTickerSymbol(holding.symbol) : '';
        if (!symbol) {
          return holding;
        }

        const ticker = tickerLookup.get(symbol);
        if (!ticker) {
          return holding;
        }

        let nextHolding = symbol !== holding.symbol ? { ...holding, symbol } : holding;
        let modified = false;
        const resolvedCurrency = ticker.currency?.trim()?.toUpperCase();

        if (nextHolding !== holding) {
          modified = true;
        }

        if (!holding.nameManuallyEdited) {
          const resolvedName = ticker.name?.trim() || symbol;
          if (nextHolding.name !== resolvedName) {
            nextHolding = { ...nextHolding, name: resolvedName };
            modified = true;
          }
        }

        if (
          !nextHolding.currencyManuallyEdited &&
          resolvedCurrency &&
          nextHolding.currency !== resolvedCurrency
        ) {
          nextHolding = { ...nextHolding, currency: resolvedCurrency, currencyManuallyEdited: false };
          modified = true;
        }

        if (
          !nextHolding.priceManuallyEdited &&
          typeof ticker.price === 'number' &&
          Number.isFinite(ticker.price) &&
          ticker.price > 0
        ) {
          const normalizedPrice = parseFloat(ticker.price.toFixed(2));
          if (nextHolding.purchasePrice !== normalizedPrice) {
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
      const normalizedSymbol = holding.symbol ? normalizeTickerSymbol(holding.symbol) : '';
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
      const sanitizedHoldings = holdings.filter(holding => {
        const hasName = typeof holding.name === 'string' && holding.name.trim().length > 0;
        const hasQuantity = typeof holding.quantity === 'number' && Number.isFinite(holding.quantity) && holding.quantity > 0;
        const hasPrice = typeof holding.purchasePrice === 'number' && Number.isFinite(holding.purchasePrice) && holding.purchasePrice > 0;
        return hasName && hasQuantity && hasPrice;
      });

      if (sanitizedHoldings.length === 0) {
        return;
      }

      const uniqueHoldings = Array.from(
        sanitizedHoldings.reduce((map, holding) => {
          const key = `${holding.name.trim().toLowerCase()}|${(holding.symbol ?? '').trim().toLowerCase()}`;
          if (!map.has(key)) {
            map.set(key, holding);
          }
          return map;
        }, new Map<string, ConversationHolding>()).values()
      );

      if (uniqueHoldings.length === 0) {
        return;
      }

      const roundToTwo = (value: number) => Math.round(value * 100) / 100;

      // Transform holdings to match the user_holdings table structure
      const holdingsToInsert = uniqueHoldings.map(holding => {
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
        const quantity = Number.isFinite(holding.quantity) && holding.quantity > 0 ? roundToTwo(holding.quantity) : null;

        const currentValue = quantity && quantity > 0 && resolvedPrice !== null
          ? roundToTwo(resolvedPrice * quantity)
          : quantity && quantity > 0 && manualPrice !== null
            ? roundToTwo(manualPrice * quantity)
            : null;

        if (!quantity) {
          return null;
        }

        const trimmedName = holding.name.trim();

        if (!trimmedName) {
          return null;
        }

        return {
          user_id: user.id,
          name: trimmedName,
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
      }).filter((item): item is {
        user_id: string;
        name: string;
        symbol: string | null;
        quantity: number;
        purchase_price: number | null;
        current_price_per_unit: number | null;
        price_currency: string | null;
        current_value: number | null;
        currency: string;
        holding_type: string;
        purchase_date: string;
      } => Boolean(item));

      if (holdingsToInsert.length === 0) {
        return;
      }

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

  const updateRecommendedStock = async (
    previous: { symbol?: string | null; name?: string | null },
    updated: StockRecommendation,
    context: RecommendationUpdateContext
  ) => {
    if (!user) return;

    try {
      const updates: PromiseLike<any>[] = [];

      if (previous.symbol || previous.name) {
        let holdingsQuery = supabase
          .from('user_holdings')
          .update({
            name: updated.name || updated.symbol || 'Rekommenderad aktie',
            symbol: updated.symbol ?? null,
            sector: updated.sector ?? null,
            market: updated.market ?? null,
            purchase_price: updated.expectedPrice ?? updated.expected_price ?? 0,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('holding_type', 'recommendation');

        if (previous.symbol) {
          holdingsQuery = holdingsQuery.eq('symbol', previous.symbol);
        } else if (previous.name) {
          holdingsQuery = holdingsQuery.eq('name', previous.name);
        }

        updates.push(holdingsQuery);
      } else {
        console.warn('Missing identifier for updating recommended stock');
      }

      const portfolioId = (portfolioResult?.portfolio as { id?: string } | null)?.id;

      if (portfolioId && (context.updatedRecommendedStocks || context.updatedAssetAllocation || context.updatedPlanAssets)) {
        const payload: Record<string, any> = {};

        if (context.updatedRecommendedStocks) {
          payload.recommended_stocks = context.updatedRecommendedStocks;
        }

        if (context.updatedAssetAllocation) {
          payload.asset_allocation = context.updatedAssetAllocation;
        }

        if (Object.keys(payload).length > 0) {
          updates.push(
            supabase
              .from('user_portfolios')
              .update(payload)
              .eq('id', portfolioId)
              .eq('user_id', user.id)
          );
        }
      }

      if (updates.length > 0) {
        const results = await Promise.all(updates);
        const failed = results.find(result => 'error' in result && result.error);
        if (failed && 'error' in failed && failed.error) {
          throw failed.error;
        }
      }
    } catch (error) {
      console.error('Failed to update recommended stock:', error);
      toast({
        title: "Kunde inte uppdatera rekommendationen",
        description: "Förändringen sparades inte i dina rekommenderade innehav.",
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
            if (!isListedCompany(name, symbol) && !hasLikelyTicker(symbol)) {
              return null;
            }
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
            if (!isListedCompany(name, symbol) && !hasLikelyTicker(symbol)) {
              return;
            }
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
    setRecommendedStocks([]);
    hasInitializedRecommendations.current = false;
        
    const isOptimizationFlow = conversationData.hasCurrentPortfolio === true;
    
        if (isOptimizationFlow) {
      addBotMessage(
        'Tack! Jag registrerar din portfölj och sammanställer en översikt åt dig...'
      );
    } else {
      addBotMessage(
        'Tack för alla svar! Jag skapar nu din personliga portföljstrategi...'
      );
    }
    
    // Save user holdings to database if they exist
    if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
      await saveUserHoldings(conversationData.currentHoldings);
    }
    
    const result = await generatePortfolioFromConversation(conversationData);

    if (result) {
      setPortfolioResult(result);
      setIsComplete(true);

    // --- KORREKT LOGIK FÖR ATT KONTROLLERA REGISTRERINGSLÄGE ---
      // Vi använder 'registration' mode från backenden
      const isRegistrationMode = result.mode === 'registration'; 
      const shouldPersistNewRecommendations = !isRegistrationMode; 
      // -----------------------------------------------------------

      // Save user holdings to database if they exist (holding_type: 'stock' - detta är korrekt)
      if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        await saveUserHoldings(conversationData.currentHoldings);
      }
      
      // Sparar nya rekommendationer BARA om vi inte är i registreringsläge
      if (shouldPersistNewRecommendations) { // Denna check är nu avgörande
        // Extract and save AI recommendations from the raw text response
        if (result.aiResponse) {
          await saveAIRecommendationsAsHoldings(result.aiResponse);
        }

        // Also save portfolio recommended stocks if they exist (structured JSON)
        if (
          result.portfolio?.recommended_stocks &&
          Array.isArray(result.portfolio.recommended_stocks) &&
          result.portfolio.recommended_stocks.length > 0
        ) {
          await saveRecommendedStocks(result.portfolio.recommended_stocks);
        }
      }

      await refetch();

      setTimeout(() => {
        // Justera meddelandet till användaren
        if (isRegistrationMode) {
          addBotMessage('✅ Din portfölj är nu registrerad och analyserad. Här är en sammanfattning av ditt nuvarande läge:');
        } else {
          addBotMessage('🎉 Din personliga portföljstrategi är klar! Här är mina rekommendationer:');
        }
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
      
      // Navigate to AI chat to assist with implementation
      const implementationMessage =
        'Hjälp mig att implementera portföljstrategin vi just tog fram och beskriva stegen för att komma igång.';
      navigate(`/ai-chatt?message=${encodeURIComponent(implementationMessage)}`);

      // Show success message after navigation
      setTimeout(() => {
        toast({
          title: "Strategi klar!",
          description: "Öppnar AI-chatt för att guida dig genom att implementera strategin steg för steg.",
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error implementing strategy:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte implementera strategin helt. Kontrollera din profil på implementeringssidan.",
        variant: "destructive",
      });
      
      // Navigate to chat so the user can resolve implementation issues
      navigate('/ai-chatt');
    }
  };

  const openReplacementDialog = (asset: AdvisorPlanAsset, index: number) => {
    const currentRecommendation = recommendedStocks[index];
    setReplacementTarget({ asset, index, recommendation: currentRecommendation });
    setIsReplacementDialogOpen(true);
  };

  const handleConfirmReplacement = async (selection: StockSelectionResult) => {
    if (!replacementTarget) {
      return;
    }

    const { asset, index, recommendation } = replacementTarget;
    const previousRecommendation: StockRecommendation = recommendation ?? {
      name: asset.name,
      symbol: asset.ticker,
      allocation: asset.allocationPercent,
      actionType: asset.actionType,
      changePercent: asset.changePercent,
      reasoning: asset.rationale ?? asset.notes,
      notes: asset.notes,
    };

    const updatedRecommendation: StockRecommendation = {
      ...previousRecommendation,
      name: selection.name || selection.symbol,
      symbol: selection.symbol,
      sector: selection.sector ?? previousRecommendation.sector,
      allocation: previousRecommendation.allocation ?? asset.allocationPercent,
      actionType: previousRecommendation.actionType ?? asset.actionType,
      changePercent: previousRecommendation.changePercent ?? asset.changePercent,
      reasoning:
        previousRecommendation.reasoning ??
        previousRecommendation.notes ??
        asset.rationale ??
        asset.notes ??
        `Ersätter ${previousRecommendation.name ?? asset.name}`,
      notes: previousRecommendation.notes ?? asset.notes,
      expectedPrice: selection.price ?? previousRecommendation.expectedPrice ?? previousRecommendation.expected_price,
      expected_price: selection.price ?? previousRecommendation.expected_price ?? previousRecommendation.expectedPrice,
      market: selection.market ?? previousRecommendation.market,
    };

    if (!updatedRecommendation.reasoning && selection.source) {
      updatedRecommendation.reasoning = `Vald via källa ${selection.source}`;
    }

    const plan = structuredResponse;
    const updatedPlanAssets = plan
      ? plan.assets.map((existingAsset, assetIndex) => {
          if (assetIndex !== index) {
            return existingAsset;
          }

          return {
            ...existingAsset,
            name: updatedRecommendation.name ?? existingAsset.name,
            ticker: updatedRecommendation.symbol ?? existingAsset.ticker,
            rationale: updatedRecommendation.reasoning ?? existingAsset.rationale ?? updatedRecommendation.notes,
            notes: existingAsset.notes ?? updatedRecommendation.notes ?? updatedRecommendation.reasoning ?? existingAsset.notes,
          } as AdvisorPlanAsset;
        })
      : undefined;

    const updatedRecommendedStocks = (() => {
      const existing = Array.isArray(portfolioResult?.portfolio?.recommended_stocks)
        ? deepClone(portfolioResult?.portfolio?.recommended_stocks as StockRecommendation[])
        : [];

      if (index >= existing.length) {
        existing.length = index + 1;
      }

      existing[index] = {
        ...(existing[index] ?? {}),
        ...updatedRecommendation,
      } as StockRecommendation;

      return existing;
    })();

    const updatedAssetAllocation = (() => {
      const currentAllocation = portfolioResult?.portfolio?.asset_allocation;
      if (!currentAllocation) {
        return undefined;
      }

      const clonedAllocation = deepClone(currentAllocation);
      if (!clonedAllocation) {
        return undefined;
      }

      clonedAllocation.stock_recommendations = updatedRecommendedStocks;

      if (Array.isArray(clonedAllocation.recommended_stocks)) {
        const recommendationEntries = [...clonedAllocation.recommended_stocks];
        if (index >= recommendationEntries.length) {
          recommendationEntries.length = index + 1;
        }
        recommendationEntries[index] = removeUndefined({
          ...(recommendationEntries[index] ?? {}),
          ...updatedRecommendation,
        });
        clonedAllocation.recommended_stocks = recommendationEntries;
      }

      const structuredPlan = clonedAllocation.structured_plan;
      if (structuredPlan && typeof structuredPlan === 'object') {
        const planClone = { ...structuredPlan };

        if (updatedPlanAssets) {
          const normalizedToPlanEntry = (entry: AdvisorPlanAsset) =>
            removeUndefined({
              name: entry.name,
              ticker: entry.ticker,
              symbol: entry.ticker,
              allocation_percent: entry.allocationPercent,
              allocation: entry.allocationPercent,
              weight: entry.allocationPercent,
              rationale: entry.rationale ?? entry.notes ?? undefined,
              notes: entry.notes ?? undefined,
              risk_role: entry.riskRole ?? undefined,
              change_percent: entry.changePercent ?? undefined,
              action_type: entry.actionType ?? undefined,
            });

          planClone.recommended_assets = updatedPlanAssets.map(normalizedToPlanEntry);

          if (Array.isArray(planClone.assets)) {
            planClone.assets = updatedPlanAssets.map(entry =>
              removeUndefined({
                ...entry,
                ticker: entry.ticker,
                symbol: entry.ticker,
                allocation_percent: entry.allocationPercent,
                allocation: entry.allocationPercent,
                weight: entry.allocationPercent,
                risk_role: entry.riskRole,
                change_percent: entry.changePercent,
                action_type: entry.actionType,
              })
            );
          }
        }

        clonedAllocation.structured_plan = planClone;
      }

      return clonedAllocation;
    })();

    setRecommendedStocks(prev => {
      const next = [...prev];
      if (index >= next.length) {
        next.length = index + 1;
      }
      next[index] = {
        ...(next[index] ?? {}),
        ...updatedRecommendation,
      } as StockRecommendation;
      return next;
    });

    setPortfolioResult(prev => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        plan: updatedPlanAssets
          ? {
              ...(typeof prev.plan === 'object' && prev.plan !== null ? prev.plan : {}),
              assets: updatedPlanAssets,
            }
          : prev.plan,
        portfolio: {
          ...prev.portfolio,
          recommended_stocks: updatedRecommendedStocks,
          asset_allocation: updatedAssetAllocation ?? prev.portfolio?.asset_allocation,
        },
      };
    });

    toast({
      title: "Rekommendation uppdaterad",
      description: `${updatedRecommendation.name} ersätter ${previousRecommendation.name ?? asset.name}.`,
    });

    const previousIdentifier = {
      symbol: recommendation?.symbol ?? asset.ticker ?? null,
      name: recommendation?.name ?? asset.name,
    };

    setIsReplacementDialogOpen(false);
    setReplacementTarget(null);

    await updateRecommendedStock(previousIdentifier, updatedRecommendation, {
      index,
      updatedRecommendedStocks,
      updatedAssetAllocation,
      updatedPlanAssets,
    });
    await Promise.all([refetchHoldings(), refetch()]);
  };

  const renderAdvisorResponse = () => {
    const aiContent = portfolioResult?.aiResponse;
    if (!aiContent || typeof aiContent !== 'string') {
      return <div className="text-muted-foreground">Inget svar mottaget från AI.</div>;
    }

    const plan = structuredResponse;
    const isOptimization = portfolioResult?.mode === 'optimize';

    const userHoldingsCount = conversationData.currentHoldings?.length ?? 0;
    const goalSummary = conversationData.optimizationGoals?.length
      ? conversationData.optimizationGoals.join(', ')
      : null;

    const reasoningSummary = (() => {
      const parts: string[] = [];

      if (plan?.riskAlignment) {
        parts.push(plan.riskAlignment);
      }

      if (goalSummary) {
        parts.push(`Mål: ${goalSummary}.`);
      }

      if (userHoldingsCount > 0) {
        parts.push(`Bedömningen utgår från ${userHoldingsCount} befintliga innehav.`);
      }

      if (!parts.length) {
        return 'AI:n vägde dina svar och nuvarande innehav för att ge rekommendationen.';
      }

      return parts.join(' ');
    })();

    const wantsComplementaryIdeas = conversationData.optimizationPreference === 'improve_with_new_ideas';
    const complementaryFromResult: StockRecommendation[] = Array.isArray(portfolioResult?.complementaryIdeas)
      ? (portfolioResult?.complementaryIdeas as StockRecommendation[])
      : [];

    const complementaryFromPlan: AdvisorPlanAsset[] = Array.isArray(plan?.complementaryAssets)
      ? (plan?.complementaryAssets as AdvisorPlanAsset[])
      : [];

    const complementaryFromPlanAsRecommendations: StockRecommendation[] = complementaryFromPlan.map(asset => ({
      name: asset.name,
      symbol: asset.ticker,
      reasoning: asset.rationale ?? asset.notes,
      allocation: asset.allocationPercent,
      actionType: asset.actionType,
    }));

    const additionsFromPlan = Array.isArray(plan?.assets)
      ? plan.assets
          .filter(asset => asset.actionType === 'add')
          .map(asset => ({
            name: asset.name,
            symbol: asset.ticker,
            reasoning: asset.rationale ?? asset.notes,
            allocation: asset.allocationPercent,
            actionType: asset.actionType,
          }))
      : [];

    const mergedComplementaryIdeas = [
      ...complementaryFromResult,
      ...complementaryFromPlanAsRecommendations,
      ...additionsFromPlan,
    ];

    const complementaryIdeas: StockRecommendation[] = mergedComplementaryIdeas
      .filter((idea, index, arr) =>
        idea.name &&
        index === arr.findIndex(other => other.name?.toLowerCase() === idea.name?.toLowerCase())
      )
      .filter(idea => {
        if (!isOptimization) {
          return false;
        }

        if (wantsComplementaryIdeas) {
          return true;
        }

        const actionType = idea.actionType?.toLowerCase();
        return actionType === 'add' || actionType === 'increase';
      });

    if (!plan) {
      const renderFallbackParagraph = (paragraph: string, index: number) => {
        const lines = paragraph
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);

        const bulletLines = lines.filter(line => /^[-–•]/.test(line));

        if (bulletLines.length > 0 && bulletLines.length === lines.length) {
          return (
            <ul
              key={`fallback-list-${index}`}
              className="list-disc list-inside space-y-1 text-base leading-7 text-foreground"
            >
              {lines.map((line, lineIndex) => (
                <li key={`fallback-line-${index}-${lineIndex}`}>{line.replace(/^[-–•]\s*/, '')}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`fallback-${index}`} className="text-base leading-7 text-foreground">
            {paragraph}
          </p>
        );
      };

      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Varför denna bedömning?</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{reasoningSummary}</p>
          </div>
          <Card className="border-primary/10 bg-card/80 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="rounded-lg bg-primary/15 p-2 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">AI-svar</CardTitle>
                <p className="text-sm text-muted-foreground">Förhandsgranskning av rekommendationen</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-base leading-7">
              {aiContent
                .split(/\n{2,}/)
                .map(paragraph => paragraph.trim())
                .filter(Boolean)
                .map(renderFallbackParagraph)}
            </CardContent>
          </Card>
        </div>
      );
    }

    const defaultNewPortfolioSteps = [
      'Granska allokeringsförslagen och säkerställ att de matchar din riskprofil.',
      'Öppna implementeringsfliken för att lägga till strategin i din portföljöversikt.',
      'Planera dina första köp och sätt eventuella bevakningsnivåer.',
    ];

    const defaultOptimizationSteps = [
      'Jämför de föreslagna förändringarna med dina nuvarande innehav.',
      'Planera hur och när ombalanseringen ska genomföras i praktiken.',
      'Följ upp resultatet efter genomförd justering tillsammans med AI-assistenten.',
    ];

    const displayNextSteps = plan.nextSteps?.length > 0
      ? plan.nextSteps
      : (isOptimization ? defaultOptimizationSteps : defaultNewPortfolioSteps);

    const summarizedSteps = displayNextSteps.slice(0, 3).join('; ');
    const assetsToDisplay = plan.assets.map((asset, index) => {
      const override = recommendedStocks[index];
      if (!override) {
        return asset;
      }

      return {
        ...asset,
        name: override.name ?? asset.name,
        ticker: override.symbol ?? asset.ticker,
        rationale: override.reasoning ?? asset.rationale ?? override.notes,
        notes: asset.notes ?? override.notes ?? override.reasoning,
      } as AdvisorPlanAsset;
    });

    const assetSummary = assetsToDisplay
      .filter(asset => asset.actionType || asset.allocationPercent)
      .slice(0, 3)
      .map(asset => {
        const label = asset.ticker ? `${asset.name} (${asset.ticker})` : asset.name;
        if (!asset.actionType) {
          return label;
        }

        return `${label} – ${getActionLabel(asset.actionType)}`;
      })
      .join('; ');

    const detailedReasoning = assetSummary
      ? `${reasoningSummary} Nyckelrekommendationer: ${assetSummary}.`
      : reasoningSummary;

    return (
      <div className="space-y-5 text-sm leading-relaxed text-foreground">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary text-primary-foreground p-2 shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                {plan.actionSummary && (
                  <p className="text-base font-semibold text-foreground">{plan.actionSummary}</p>
                )}
                {plan.riskAlignment && (
                  <p className="text-sm text-primary/80">{plan.riskAlignment}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-primary">
              {isOptimization ? (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  Optimering på befintlig portfölj
                </Badge>
              ) : (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  Ny portföljplan
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Varför denna bedömning?</p>
          <p className="mt-1 text-sm leading-6 text-foreground">{detailedReasoning}</p>
        </div>

        {displayNextSteps.length > 0 && (
          <Card className="border-border/80 bg-card/70 shadow-sm">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
              <div className="rounded-md bg-amber-50 p-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Så går du vidare</p>
                <CardTitle className="text-base font-semibold text-foreground">Prioriterade nästa steg</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="mt-1 space-y-2 list-decimal list-inside text-base leading-7">
                {displayNextSteps.map((step, index) => (
                  <li key={`step-${index}`} className="text-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {plan.assets.length > 0 && (
          <div className="space-y-3 rounded-lg border border-border/80 bg-background/50 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Föreslagna åtgärder per tillgång</h4>
              <Badge variant="secondary" className="text-[10px]">
                {plan.assets.length} förslag
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.assets.map((_asset, index) => {
                const displayAsset = assetsToDisplay[index];
                const actionLabel = displayAsset.actionType ? getActionLabel(displayAsset.actionType) : null;
                const allocationDisplay = formatPercentValue(displayAsset.allocationPercent);
                const changeDisplay = formatSignedPercent(displayAsset.changePercent);

                return (
                  <div key={`${displayAsset.name}-${index}`} className="flex h-full flex-col gap-3 rounded-xl border bg-card/70 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-foreground">{displayAsset.name}</p>
                          {displayAsset.ticker && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                              {displayAsset.ticker}
                            </Badge>
                          )}
                        </div>
                        {displayAsset.riskRole && (
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Roll i portföljen: {displayAsset.riskRole}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {actionLabel && (
                            <Badge variant="secondary" className="text-[11px]">
                              Åtgärd: {actionLabel}
                            </Badge>
                          )}
                          {allocationDisplay && !(isOptimization && (!displayAsset.allocationPercent || displayAsset.allocationPercent === 0)) && (
                            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                              Vikt: {allocationDisplay}
                            </Badge>
                          )}
                          {changeDisplay && (
                            <Badge
                              variant="outline"
                              className={`${getChangeBadgeClass(displayAsset.changePercent)} border-border/60 bg-background/80`}
                            >
                              Förändring {changeDisplay}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {displayAsset.rationale && (
                      <p className="text-sm leading-6 text-muted-foreground">{displayAsset.rationale}</p>
                    )}
                    {displayAsset.notes && (
                      <div className="rounded-md border border-dashed border-border/80 bg-muted/20 p-2 text-xs text-muted-foreground">
                        {displayAsset.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isOptimization && complementaryIdeas.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Kompletterande idéer som passar din portfölj</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {complementaryIdeas.map((idea, idx) => (
                <div
                  key={`${idea.name}-${idea.symbol ?? idx}`}
                  className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{idea.name}</p>
                      {idea.symbol && (
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{idea.symbol}</p>
                      )}
                    </div>
                    {(() => {
                      const allocationSuggestion = formatPercentValue(idea.allocation);
                      if (!allocationSuggestion) return null;
                      return (
                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                          Förslag: {allocationSuggestion}
                        </Badge>
                      );
                    })()}
                  </div>
                  {idea.reasoning && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{idea.reasoning}</p>
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
    <>
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
                  
                  {portfolioResult?.mode === 'optimize' ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-primary/20 pt-4 text-sm text-muted-foreground">
                      <p className="min-w-[200px] flex-1">
                        Använd rekommendationerna för att justera dina nuvarande innehav i din portföljöversikt.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            startAiChatSession(
                              'Planera ombalansering',
                              'Hjälp mig att tidsätta och prioritera ombalanseringen baserat på de senaste AI-rekommendationerna.'
                            )
                          }
                        >
                          Planera ombalansering
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleImplementStrategy}
                          disabled={loading}
                        >
                          Uppdatera översikten
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-primary/20 pt-4">
                      <p className="text-sm text-muted-foreground min-w-[200px] flex-1">
                        För över strategin till din portföljöversikt och följ upp genomförandet.
                      </p>
                      <Button
                        onClick={handleImplementStrategy}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={loading}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {loading ? "Implementerar..." : "Implementera Strategin"}
                      </Button>
                    </div>
                  )}
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
      <StockReplacementDialog
        open={isReplacementDialogOpen}
        onOpenChange={(open) => {
          setIsReplacementDialogOpen(open);
          if (!open) {
            setReplacementTarget(null);
          }
        }}
        currentStock={
          replacementTarget
            ? {
                name: replacementTarget.recommendation?.name ?? replacementTarget.asset.name,
                symbol: replacementTarget.recommendation?.symbol ?? replacementTarget.asset.ticker ?? undefined,
              }
            : undefined
        }
        suggestions={stockSelectorOptions}
        onConfirm={handleConfirmReplacement}
      />
    </>
  );
};

export default ChatPortfolioAdvisor;
