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
  mode?: 'new' | 'optimize' | 'registration'; // Updated to include registration mode
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

  // ... (resten av koden är oförändrad fram till renderAdvisorResponse)

  const renderAdvisorResponse = () => {
    const aiContent = portfolioResult?.aiResponse;
    if (!aiContent || typeof aiContent !== 'string') {
      return <div className="text-muted-foreground">Inget svar mottaget från AI.</div>;
    }

    const plan = structuredResponse;
    const isOptimization = portfolioResult?.mode === 'optimize';
    const isRegistration = portfolioResult?.mode === 'registration'; // CHECK FOR REGISTRATION MODE

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

    // ... (Complementary assets logic remains the same)

    // ... (Fallback renderer logic remains the same)

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

    // Add default steps for registration mode
    const defaultRegistrationSteps = [
      'Portföljen är nu registrerad i din översikt.',
      'Du kan följa värdeutvecklingen under "Min Portfölj".',
      'Starta en ny analys senare om du vill ha konkreta köp/sälj-råd.'
    ];

    const displayNextSteps = plan.nextSteps?.length > 0
      ? plan.nextSteps
      : (isRegistration ? defaultRegistrationSteps : (isOptimization ? defaultOptimizationSteps : defaultNewPortfolioSteps));

    // ... (summarizedSteps logic)

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
              {isRegistration ? (
                 <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  Portföljanalys (Nuläge)
                </Badge>
              ) : isOptimization ? (
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
          <p className="mt-1 text-sm leading-6 text-foreground">{isRegistration ? reasoningSummary : detailedReasoning}</p>
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
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isRegistration ? 'Analys av dina innehav' : 'Föreslagna åtgärder per tillgång'}
              </h4>
              <Badge variant="secondary" className="text-[10px]">
                {plan.assets.length} {isRegistration ? 'innehav' : 'förslag'}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.assets.map((_asset, index) => {
                const displayAsset = assetsToDisplay[index];
                const actionLabel = displayAsset.actionType ? getActionLabel(displayAsset.actionType) : null;
                const allocationDisplay = formatPercentValue(displayAsset.allocationPercent);
                const changeDisplay = formatSignedPercent(displayAsset.changePercent);

                // Don't show action label if it is just "Monitor" or "Hold" in registration mode to keep it clean
                const showActionLabel = actionLabel && (!isRegistration || (displayAsset.actionType !== 'hold' && displayAsset.actionType !== 'monitor'));
                
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
                          {showActionLabel && (
                            <Badge variant="secondary" className="text-[11px]">
                              Åtgärd: {actionLabel}
                            </Badge>
                          )}
                          {allocationDisplay && !(isOptimization && (!displayAsset.allocationPercent || displayAsset.allocationPercent === 0)) && (
                            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                              Vikt: {allocationDisplay}
                            </Badge>
                          )}
                          {changeDisplay && !isRegistration && ( // Hide change % in registration mode
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

        {!isRegistration && isOptimization && complementaryIdeas.length > 0 && (
          <div className="space-y-2">
            {/* ... complementary ideas content ... */}
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
  
  // ... rest of component ...

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
