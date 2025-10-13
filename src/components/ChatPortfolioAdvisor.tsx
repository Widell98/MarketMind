import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Send,
  User,
  Bot,
  CheckCircle,
  TrendingUp,
  Plus,
  Trash2,
  Check,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import useSheetTickers, { SheetTicker } from '@/hooks/useSheetTickers';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  hasOptions?: boolean;
  options?: Array<{ value: string; label: string }>;
  hasHoldingsInput?: boolean;
}

interface Holding {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  nameManuallyEdited: boolean;
  priceManuallyEdited: boolean;
}

interface ConversationData {
  isBeginnerInvestor?: boolean;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
  monthlyAmount?: string;
  hasCurrentPortfolio?: boolean;
  currentHoldings?: Holding[];
  age?: number;
  experience?: string;
  sectors?: string[];
  interests?: string[];
  companies?: string[];
  industryInterests?: string;
  portfolioHelp?: string;
  portfolioSize?: string;
  rebalancingFrequency?: string;
  // Enhanced fields
  monthlyIncome?: string;
  availableCapital?: string;
  emergencyFund?: string;
  financialObligations?: string[];
  sustainabilityPreference?: string;
  geographicPreference?: string;
  marketCrashReaction?: string;
  volatilityComfort?: number;
  marketExperience?: string;
  currentAllocation?: string;
  previousPerformance?: string;
  sectorExposure?: string[];
  investmentStyle?: string;
  dividendYieldRequirement?: string;
  maxDrawdownTolerance?: number;
  specificGoalAmount?: string;
  taxConsideration?: string;
}

interface AdvisorRecommendation {
  name: string;
  ticker?: string;
  reason?: string;
}

interface AdvisorResponse {
  summary: string;
  recommendations: AdvisorRecommendation[];
}

interface RefinementMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

function parseAdvisorResponse(body: string) {
  const [summaryText, jsonPart] = body.split('---JSON---');
  let recommendations = [];
  try {
    const parsed = JSON.parse(jsonPart.trim());
    recommendations = parsed.recommendations || [];
  } catch {
    recommendations = [];
  }
  return { summary: summaryText.trim(), recommendations };
}

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
  const [showHoldingsInput, setShowHoldingsInput] = useState(false);
  const [localLoading, setLoading] = useState(false);
  const [refinementMessages, setRefinementMessages] = useState<RefinementMessage[]>([]);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefinementLoading, setIsRefinementLoading] = useState(false);
  const [hasInitializedRefinement, setHasInitializedRefinement] = useState(false);
  const isInitialized = useRef(false);

  const { generatePortfolioFromConversation, loading } = useConversationalPortfolio();
  const { refetch } = usePortfolio();
  const { refetch: refetchHoldings } = useUserHoldings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const refinementEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { tickers, isLoading: tickersLoading, error: tickersError } = useSheetTickers();
  const rawTickerListId = useId();
  const tickerDatalistId = `advisor-sheet-tickers-${rawTickerListId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  const tickerLookup = useMemo(() => {
    const map = new Map<string, SheetTicker>();
    tickers.forEach(ticker => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });
    return map;
  }, [tickers]);

  const tickerOptions = useMemo(
    () =>
      tickers.map(ticker => {
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
    [tickers, priceFormatter]
  );

  const advisorResponse = useMemo<AdvisorResponse | null>(() => {
    if (!portfolioResult?.aiResponse || typeof portfolioResult.aiResponse !== 'string') {
      return null;
    }
    try {
      return parseAdvisorResponse(portfolioResult.aiResponse);
    } catch (error) {
      console.error('Failed to parse advisor response', error);
      return null;
    }
  }, [portfolioResult?.aiResponse]);

  const questions = [
    {
      id: 'intro',
      question: 'Hej! Jag är din AI-portföljrådgivare för att göra en bedömning av din riskprofil behöver du först svara på ett par frågor. Har du investerat tidigare eller är det nytt för dig?',
      key: 'isBeginnerInvestor',
      hasOptions: true,
      options: [
        { value: 'beginner', label: 'Ny inom investeringar (mindre än 2 års erfarenhet)' },
        { value: 'experienced', label: 'Har flera års erfarenhet av investeringar' }
      ],
      processAnswer: (answer: string) => answer === 'beginner'
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
      processAnswer: (answer: string) => answer === 'yes'
    },
    {
      id: 'age',
      question: 'Hur gammal är du? Detta hjälper mig förstå din investeringshorisont.',
      key: 'age',
      hasOptions: false,
      processAnswer: (answer: string) => parseInt(answer) || 25
    },
    {
      id: 'industryInterests',
      question: 'Vilka branscher eller bolag är du extra intresserad av att investera i?',
      key: 'industryInterests',
      type: 'text',
      hasOptions: false,
      showIf: () => true
    },
    // Enhanced questions for beginners
    {
      id: 'monthlyIncome',
      question: 'Vad har du ungefär för månadsinkomst? Detta hjälper mig förstå din investeringskapacitet.',
      key: 'monthlyIncome',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: '20000-30000', label: '20 000 - 30 000 kr' },
        { value: '30000-45000', label: '30 000 - 45 000 kr' },
        { value: '45000-60000', label: '45 000 - 60 000 kr' },
        { value: '60000+', label: 'Över 60 000 kr' }
      ]
    },
    {
      id: 'availableCapital',
      question: 'Hur mycket sparkapital har du tillgängligt för investeringar just nu?',
      key: 'availableCapital',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: '10000-50000', label: '10 000 - 50 000 kr' },
        { value: '50000-100000', label: '50 000 - 100 000 kr' },
        { value: '100000-250000', label: '100 000 - 250 000 kr' },
        { value: '250000+', label: 'Över 250 000 kr' }
      ]
    },
    {
      id: 'emergencyFund',
      question: 'Har du en buffert för oväntade utgifter?',
      key: 'emergencyFund',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'yes_full', label: 'Ja, 6+ månaders utgifter' },
        { value: 'yes_partial', label: 'Ja, 1-3 månaders utgifter' },
        { value: 'no', label: 'Nej, ingen buffert än' }
      ]
    },
    {
      id: 'sustainabilityPreference',
      question: 'Hur viktigt är hållbarhet (ESG) för dig?',
      key: 'sustainabilityPreference',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'very_important', label: 'Mycket viktigt - bara hållbara investeringar' },
        { value: 'somewhat_important', label: 'Ganska viktigt - föredrar hållbara alternativ' },
        { value: 'not_priority', label: 'Inte prioritet - fokuserar på avkastning' }
      ]
    },
    {
      id: 'geographicPreference',
      question: 'Vad föredrar du geografiskt?',
      key: 'geographicPreference',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'sweden_only', label: 'Mest svenska företag' },
        { value: 'europe', label: 'Europiska marknader' },
        { value: 'usa', label: 'Amerikanska marknaden' },
        { value: 'global', label: 'Global spridning' }
      ]
    },
    {
      id: 'marketCrashReaction',
      question: 'Om börsen föll 20% på en månad, hur skulle du reagera då?',
      key: 'marketCrashReaction',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'sell_all', label: 'Sälja allt för att stoppa förlusterna' },
        { value: 'sell_some', label: 'Sälja en del av innehaven' },
        { value: 'hold', label: 'Behålla allt och vänta' },
        { value: 'buy_more', label: 'Köpa mer medan det är billigt' }
      ]
    },
    // Enhanced questions for experienced investors with existing portfolio
    {
      id: 'marketExperience',
      question: 'Hur många år har du investerat aktivt?',
      key: 'marketExperience',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false && conversationData.hasCurrentPortfolio === true,
      options: [
        { value: '2-5', label: '2-5 år' },
        { value: '5-10', label: '5-10 år' },
        { value: '10-20', label: '10-20 år' },
        { value: '20+', label: 'Över 20 år' }
      ]
    },
    {
      id: 'previousPerformance',
      question: 'Hur har din portfölj presterat jämfört med marknaden?',
      key: 'previousPerformance',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false && conversationData.hasCurrentPortfolio === true,
      options: [
        { value: 'outperformed', label: 'Bättre än marknaden' },
        { value: 'matched', label: 'Samma som marknaden' },
        { value: 'underperformed', label: 'Sämre än marknaden' },
        { value: 'unsure', label: 'Osäker/har inte mätt' }
      ]
    },
    {
      id: 'investmentStyle',
      question: 'Vilken investeringsstil föredrar du?',
      key: 'investmentStyle',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false,
      options: [
        { value: 'value', label: 'Value - undervärderade företag' },
        { value: 'growth', label: 'Growth - snabbt växande företag' },
        { value: 'dividend', label: 'Dividend - fokus på utdelningar' },
        { value: 'momentum', label: 'Momentum - trender och teknisk analys' },
        { value: 'mixed', label: 'Blandad strategi' }
      ]
    },
    {
      id: 'dividendYieldRequirement',
      question: 'Vad har du för krav på direktavkastning?',
      key: 'dividendYieldRequirement',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false,
      options: [
        { value: 'high', label: 'Hög (4%+) - vill ha regelbunden inkomst' },
        { value: 'moderate', label: 'Måttlig (2-4%) - utdelning är trevligt' },
        { value: 'low', label: 'Låg (<2%) - fokuserar på kursuppgång' },
        { value: 'none', label: 'Ingen - vill att företag återinvesterar' }
      ]
    },
    // Common enhanced questions
    {
      id: 'interests',
      question: 'Vilka branscher intresserar dig mest? Detta hjälper mig föreslå relevanta investeringar. (t.ex. teknik, hälsa, miljö, bank, spel, fastigheter)',
      key: 'interests',
      hasOptions: false,
      showIf: () => conversationData.isBeginnerInvestor === true,
      processAnswer: (answer: string) => answer.split(',').map(item => item.trim()).filter(item => item)
    },
    {
      id: 'companies',
      question: 'Vilka företag eller varumärken använder du ofta eller tycker om? (Du kan nämna flera)',
      key: 'companies',
      hasOptions: false,
      showIf: () => conversationData.isBeginnerInvestor === true,
      processAnswer: (answer: string) => answer.split(',').map(item => item.trim()).filter(item => item)
    },
    {
      id: 'goal',
      question: 'Vad är ditt huvudsakliga mål med investeringarna? (du kan skriva valfritt)',
      key: 'investmentGoal',
      hasOptions: true,
      options: [
        { value: 'pension', label: 'Pensionssparande' },
        { value: 'wealth', label: 'Förmögenhetsuppbyggnad' },
        { value: 'income', label: 'Regelbunden inkomst' },
        { value: 'house', label: 'Bostadsköp' },
        { value: 'education', label: 'Utbildning/Barn' }
      ]
    },
    {
      id: 'timeHorizon',
      question: 'Hur lång tid tänker du investera pengarna?',
      key: 'timeHorizon',
      hasOptions: true,
      options: [
        { value: 'short', label: 'Kort sikt (1-3 år)' },
        { value: 'medium', label: 'Medellång sikt (3-7 år)' },
        { value: 'long', label: 'Lång sikt (7-15 år)' },
        { value: 'very_long', label: 'Mycket lång sikt (15+ år)' }
      ]
    },
    {
      id: 'risk',
      question: 'Hur känner du inför risk i dina investeringar?',
      key: 'riskTolerance',
      hasOptions: true,
      options: [
        { value: 'conservative', label: 'Konservativ (låg risk)' },
        { value: 'balanced', label: 'Balanserad (måttlig risk)' },
        { value: 'aggressive', label: 'Aggressiv (hög risk)' }
      ]
    },
    {
      id: 'monthlyAmount',
      question: 'Ungefär hur mycket tänker du investera per månad? (skriv summan i kronor)',
      key: 'monthlyAmount',
      hasOptions: false
    },
    {
      id: 'portfolioHelp',
      question: 'Hur vill du att jag hjälper dig?',
      key: 'portfolioHelp',
      hasOptions: true,
      showIf: () => conversationData.hasCurrentPortfolio === false && conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'simple_start', label: 'Hjälp mig börja enkelt' },
        { value: 'diverse_portfolio', label: 'Skapa diversifierad portfölj' },
        { value: 'growth_focused', label: 'Fokusera på tillväxt' },
        { value: 'dividend_income', label: 'Prioritera utdelning' }
      ]
    },
    {
      id: 'rebalancing',
      question: 'Hur ofta vill du justera din portfölj?',
      key: 'rebalancingFrequency',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false && conversationData.hasCurrentPortfolio === true,
      options: [
        { value: 'monthly', label: 'Månadsvis' },
        { value: 'quarterly', label: 'Kvartalsvis' },
        { value: 'yearly', label: 'Årligen' },
        { value: 'rarely', label: 'Sällan' }
      ]
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('ChatPortfolioAdvisor useEffect triggered', {
      isInitialized: isInitialized.current,
      messagesLength: messages.length
    });

    // Start conversation only once
    if (!isInitialized.current) {
      console.log('Starting conversation - adding first question');
      isInitialized.current = true;
      const firstQuestion = questions[0];
      addBotMessage(firstQuestion.question, firstQuestion.hasOptions, firstQuestion.options);
      setWaitingForAnswer(true);
    }
  }, []); // Empty dependency array

  useEffect(() => {
    if (!isComplete) {
      setRefinementMessages([]);
      setRefinementInput('');
      setHasInitializedRefinement(false);
      setIsRefinementLoading(false);
    }
  }, [isComplete]);

  useEffect(() => {
    if (!isComplete || hasInitializedRefinement) {
      return;
    }

    if (advisorResponse) {
      const recommendationLines = advisorResponse.recommendations
        ?.map(recommendation => {
          const parts = [
            recommendation.name,
            recommendation.ticker ? `(${recommendation.ticker})` : '',
            recommendation.reason ? `– ${recommendation.reason}` : ''
          ].filter(Boolean);
          return parts.length > 0 ? `• ${parts.join(' ')}`.trim() : '';
        })
        .filter(Boolean)
        .join('\n');

      const introParts = [
        'Vad tycker du om dessa rekommendationer?',
        advisorResponse.summary ? `Sammanfattning: ${advisorResponse.summary}` : null,
        recommendationLines ? `Rekommendationer:\n${recommendationLines}` : null,
        'Berätta vad du vill justera, så hjälper jag dig att finjustera portföljen.'
      ].filter(Boolean);

      setRefinementMessages([
        {
          id: `assistant-intro-${Date.now()}`,
          role: 'assistant',
          content: introParts.join('\n\n')
        }
      ]);
      setHasInitializedRefinement(true);
    } else if (portfolioResult?.aiResponse) {
      setRefinementMessages([
        {
          id: `assistant-intro-${Date.now()}`,
          role: 'assistant',
          content:
            'Vad tycker du om rekommendationen ovan? Beskriv gärna vad du vill ändra eller fördjupa så hjälper jag dig vidare.'
        }
      ]);
      setHasInitializedRefinement(true);
    }
  }, [isComplete, advisorResponse, hasInitializedRefinement, portfolioResult?.aiResponse]);

  useEffect(() => {
    refinementEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [refinementMessages]);

  const addBotMessage = (content: string, hasOptions: boolean = false, options?: Array<{ value: string; label: string }>, hasHoldingsInput: boolean = false) => {
    console.log('addBotMessage called with content:', content.substring(0, 50) + '...');
    
    const message: Message = {
      id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      type: 'bot',
      content,
      timestamp: new Date(),
      hasOptions,
      options,
      hasHoldingsInput
    };
    setMessages(prev => {
      console.log('Adding bot message, current messages length:', prev.length);
      return [...prev, message];
    });
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

  const addHolding = () => {
    const newHolding: Holding = {
      id: Date.now().toString(),
      name: '',
      symbol: '',
      quantity: 0,
      purchasePrice: 0,
      nameManuallyEdited: false,
      priceManuallyEdited: false
    };
    setHoldings(prev => [...prev, newHolding]);
  };

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

        let updatedHolding: Holding = {
          ...holding,
          symbol: normalizedSymbol
        };

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

        return updatedHolding;
      })
    );
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

  useEffect(() => {
    if (tickers.length === 0) {
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

        if (!holding.nameManuallyEdited) {
          const resolvedName = ticker.name?.trim() || symbol;
          if (holding.name !== resolvedName) {
            nextHolding = { ...nextHolding, name: resolvedName };
            modified = true;
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
  }, [tickerLookup, tickers.length]);

  const removeHolding = (id: string) => {
    setHoldings(prev => prev.filter(holding => holding.id !== id));
  };

  const submitHoldings = () => {
    // More flexible validation - symbol is optional but encouraged
    const validHoldings = holdings.filter(h => 
      h.name && h.name.trim() !== '' && 
      h.quantity > 0 && 
      h.purchasePrice > 0
    );
    
    console.log('Holdings before validation:', holdings);
    console.log('Valid holdings after filtering:', validHoldings);
    
    if (validHoldings.length === 0) {
      toast({
        title: "Inga innehav angivna",
        description: "Du måste ange minst ett innehav med namn, antal och köppris för att fortsätta.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation of what was added
    const holdingsText = validHoldings.map(h => 
      `${h.name}${h.symbol && h.symbol.trim() ? ` (${h.symbol})` : ''}: ${h.quantity} st à ${h.purchasePrice} SEK`
    ).join(', ');

    addUserMessage(`Mina nuvarande innehav: ${holdingsText}`);
    
    // Update conversation data
    const updatedData = {
      ...conversationData,
      currentHoldings: validHoldings
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
    let questionIndex = currentStep;
    while (questionIndex < questions.length) {
      const question = questions[questionIndex];
      if (!question.showIf || question.showIf()) {
        return question;
      }
      questionIndex++;
    }
    return null;
  };

  const handleAnswer = (answer: string) => {
    if (!waitingForAnswer || isComplete) return;

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Special handling for portfolio holdings
    if (currentQuestion.id === 'hasPortfolio' && answer === 'yes') {
      // Find the label for the answer
      const option = currentQuestion.options?.find(opt => opt.value === answer);
      const displayAnswer = option ? option.label : answer;
      
      addUserMessage(displayAnswer);
      setWaitingForAnswer(false);
      
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
        setHoldings([
          {
            id: '1',
            name: '',
            symbol: '',
            quantity: 0,
            purchasePrice: 0,
            nameManuallyEdited: false,
            priceManuallyEdited: false
          }
        ]);
      }, 1000);
      
      return;
    }

    // Normal question handling
    // Find the label for the answer if it has options
    let displayAnswer = answer;
    if (currentQuestion.hasOptions && currentQuestion.options) {
      const option = currentQuestion.options.find(opt => opt.value === answer);
      if (option) {
        displayAnswer = option.label;
      }
    }

    addUserMessage(displayAnswer);
    setWaitingForAnswer(false);
    
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
      completeConversation();
    } else {
      setCurrentStep(nextStep);
      const nextQuestion = questions[nextStep];
      
      setTimeout(() => {
        addBotMessage(nextQuestion.question, nextQuestion.hasOptions, nextQuestion.options);
        setWaitingForAnswer(true);
      }, 500);
    }
  };

  const saveUserHoldings = async (holdings: Holding[]) => {
    if (!user || holdings.length === 0) return;

    try {
      console.log('Saving user holdings to database:', holdings);

      const roundToTwo = (value: number) => Math.round(value * 100) / 100;

      // Transform holdings to match the user_holdings table structure
      const holdingsToInsert = holdings.map(holding => {
        const normalizedSymbol = holding.symbol?.trim().length
          ? holding.symbol.trim().toUpperCase()
          : null;
        const ticker = normalizedSymbol ? tickerLookup.get(normalizedSymbol) : undefined;

        const sheetPrice = ticker && typeof ticker.price === 'number' && Number.isFinite(ticker.price) && ticker.price > 0
          ? roundToTwo(ticker.price)
          : null;
        const manualPrice = holding.purchasePrice > 0 ? roundToTwo(holding.purchasePrice) : null;
        const resolvedPrice = sheetPrice ?? manualPrice;
        const priceCurrency = resolvedPrice !== null
          ? (ticker?.currency?.trim()?.toUpperCase() || 'SEK')
          : null;
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
          currency: 'SEK',
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

      console.log('Successfully saved user holdings');

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
      console.log('Saving AI-recommended stocks as holdings:', recommendedStocks);
      
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

      console.log('Successfully saved recommended stocks as holdings');
      
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
      console.log('Saving AI recommendations from response...');
      
      const recommendations = extractStockRecommendationsFromAI(aiResponse);
      
      if (recommendations.length === 0) {
        console.log('No recommendations found to save');
        return;
      }

      console.log('Found recommendations to save:', recommendations);

      // Transform recommendations to holdings format
      const holdingsToInsert = recommendations.map(rec => ({
        user_id: user.id,
        name: rec.name,
        symbol: rec.symbol || null,
        quantity: 0, // No quantity yet, these are recommendations
        purchase_price: 0,
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

      console.log('Successfully saved AI recommendations as holdings:', holdingsToInsert.length);
      
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
    console.log('Extracting stock recommendations from AI response:', aiResponse);

    try {
      const parsedAdvisor = parseAdvisorResponse(aiResponse);
      if (parsedAdvisor.recommendations && parsedAdvisor.recommendations.length > 0) {
        return parsedAdvisor.recommendations.map(rec => ({
          name: rec.name,
          symbol: rec.ticker,
          reason: rec.reason
        }));
      }
    } catch (error) {
      console.warn('Failed to parse advisor response in new format:', error);
    }

    try {
      const parsed = JSON.parse(aiResponse);
      const recs = Array.isArray(parsed) ? parsed : parsed.recommendations;
      if (Array.isArray(recs)) {
        return recs
          .map((rec: any) => ({
            name: rec.name,
            symbol: rec.symbol,
            sector: rec.sector,
            expected_price: rec.expected_price
          }))
          .slice(0, 8);
      }
    } catch (e) {
      console.warn('AI response not valid JSON, returning empty list');
    }

    return [];
  };

  const buildAdvisorSummaryPrompt = (data: ConversationData, existingAnalysis?: string) => {
    const conversationJson = JSON.stringify(data, null, 2);
    const previousAnalysis = existingAnalysis
      ? `Tidigare AI-analys att ta hänsyn till:\n${existingAnalysis}\n\n`
      : '';

    return `Du är en erfaren svensk investeringsrådgivare som analyserar en användares profil och ger personliga rekommendationer.\n\nAnalysera följande data:\n${conversationJson}\n\n${previousAnalysis}Skriv ett svar på svenska i två delar:\n\nEn sammanhängande rådgivartext (3–6 meningar) där du förklarar:\n\nanvändarens riskprofil och sparhorisont,\n\nhur användaren bör tänka och agera kring investeringar,\n\nvilka typer av tillgångar (aktier, fonder, räntor, indexfonder etc.) som passar,\n\noch avsluta med en trygg slutsats som passar användarens profil.\n\nEn JSON-lista med 5–8 rekommenderade investeringar:\n{\n"recommendations": [\n{ "name": "Bolag eller fondnamn", "ticker": "TICKER", "reason": "Kort motivering" }\n]\n}\n\nSeparera textdelen och JSON-delen med raden:\n---JSON---\n\nSkapa alltid unika, datadrivna rekommendationer baserat på användarens profil. Ingen hårdkodning.`;
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
      let aiResponseToUse = typeof result.aiResponse === 'string' ? result.aiResponse : '';

      if (user) {
        try {
          const summaryPrompt = buildAdvisorSummaryPrompt(conversationData, aiResponseToUse);
          const { data: summaryData, error: summaryError } = await supabase.functions.invoke<Record<string, unknown> | string>(
            'portfolio-ai-chat',
            {
              body: {
                message: summaryPrompt,
                userId: user.id,
                analysisType: 'portfolio_summary',
                conversationData,
                stream: false
              }
            }
          );

          if (summaryError) {
            throw new Error(summaryError.message || 'Kunde inte generera rådgivarens sammanfattning.');
          }

          let summaryContent = '';
          if (typeof summaryData === 'string') {
            summaryContent = summaryData;
          } else if (summaryData && typeof summaryData === 'object') {
            const payload = summaryData as Record<string, unknown>;
            summaryContent =
              (typeof payload['response'] === 'string' && (payload['response'] as string)) ||
              (typeof payload['message'] === 'string' && (payload['message'] as string)) ||
              (typeof payload['content'] === 'string' && (payload['content'] as string)) ||
              (typeof payload['aiResponse'] === 'string' && (payload['aiResponse'] as string)) ||
              '';
          }

          if (summaryContent) {
            aiResponseToUse = summaryContent;
          }
        } catch (error) {
          console.error('Failed to generate personalized summary:', error);
        }
      }

      const updatedResult = {
        ...result,
        aiResponse: aiResponseToUse
      };

      // Persist the personalised advisor output alongside the generated portfolio
      const parsedAdvisorOutput = parseAdvisorResponse(aiResponseToUse);
      if (result.portfolio?.id && (parsedAdvisorOutput.summary || parsedAdvisorOutput.recommendations.length > 0)) {
        try {
          await supabase
            .from('user_portfolios')
            .update({
              advisor_summary: parsedAdvisorOutput.summary,
              advisor_recommendations: parsedAdvisorOutput.recommendations
            })
            .eq('id', result.portfolio.id);
        } catch (updateError) {
          console.error('Failed to attach advisor output to portfolio:', updateError);
        }
      }

      setPortfolioResult(updatedResult);
      setIsComplete(true);

      if (aiResponseToUse) {
        await saveAIRecommendationsAsHoldings(aiResponseToUse);
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

  const handleRefinementSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedInput = refinementInput.trim();
    if (!trimmedInput) {
      return;
    }

    if (!user) {
      toast({
        title: 'Logga in krävs',
        description: 'Du behöver vara inloggad för att kunna fortsätta dialogen med rådgivaren.',
        variant: 'destructive'
      });
      return;
    }

    const chatHistoryForAPI = refinementMessages.map(message => ({
      role: message.role,
      content: message.content
    }));

    const userMessage: RefinementMessage = {
      id: `refinement-user-${Date.now()}`,
      role: 'user',
      content: trimmedInput
    };

    setRefinementMessages(prev => [...prev, userMessage]);
    setRefinementInput('');
    setIsRefinementLoading(true);

    try {
      const followUpInstruction = advisorResponse
        ? `Utgå från den rådgivning du precis gav. Sammanfattningen löd: "${advisorResponse.summary}". Dina rekommendationer var: ${advisorResponse.recommendations
            .map(rec => `${rec.name}${rec.ticker ? ` (${rec.ticker})` : ''}${rec.reason ? ` – ${rec.reason}` : ''}`)
            .join('; ')}. Anpassa råden utifrån följande feedback från klienten: "${trimmedInput}". Var tydlig med om något ska justeras, läggas till eller tas bort och motivera kort.`
        : trimmedInput;

      const { data, error } = await supabase.functions.invoke<Record<string, unknown> | string>('portfolio-ai-chat', {
        body: {
          message: followUpInstruction,
          userId: user.id,
          portfolioId: portfolioResult?.portfolio?.id,
          chatHistory: chatHistoryForAPI,
          analysisType: 'portfolio_followup',
          stream: false
        }
      });

      if (error) {
        throw new Error(error.message || 'Kunde inte få svar från rådgivaren.');
      }

      let aiMessageContent = '';
      if (typeof data === 'string') {
        aiMessageContent = data;
      } else if (data && typeof data === 'object') {
        const payload = data as Record<string, unknown>;
        aiMessageContent =
          (typeof payload['response'] === 'string' && (payload['response'] as string)) ||
          (typeof payload['message'] === 'string' && (payload['message'] as string)) ||
          (typeof payload['content'] === 'string' && (payload['content'] as string)) ||
          (typeof payload['aiResponse'] === 'string' && (payload['aiResponse'] as string)) ||
          '';
      }

      if (!aiMessageContent) {
        aiMessageContent =
          'Jag kunde inte generera ett uppdaterat svar just nu. Försök gärna igen eller formulera om din önskade ändring.';
      }

      setRefinementMessages(prev => [
        ...prev,
        {
          id: `refinement-assistant-${Date.now()}`,
          role: 'assistant',
          content: aiMessageContent
        }
      ]);
    } catch (error) {
      console.error('Error sending refinement message:', error);
      const description =
        error instanceof Error
          ? error.message
          : 'Ett oväntat fel uppstod. Försök igen lite senare.';
      toast({
        title: 'Meddelandet skickades inte',
        description,
        variant: 'destructive'
      });
      setRefinementMessages(prev => prev.filter(message => message.id !== userMessage.id));
      setRefinementInput(trimmedInput);
    } finally {
      setIsRefinementLoading(false);
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

    const renderRefinementChat = () => {
      if (refinementMessages.length === 0) {
        return null;
      }

      return (
        <Card className="border border-border/60 bg-background/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Finjustera rekommendationen
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Fortsätt dialogen om du vill göra ändringar eller ställa följdfrågor kring strategin.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {refinementMessages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-full rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm sm:max-w-md ${
                      message.role === 'assistant'
                        ? 'bg-muted/60 text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={refinementEndRef} />
            </div>
            <form
              onSubmit={handleRefinementSubmit}
              className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <Input
                  value={refinementInput}
                  onChange={(event) => setRefinementInput(event.target.value)}
                  placeholder="Berätta vad du vill justera eller fråga om portföljen..."
                  className="bg-background/80"
                  disabled={isRefinementLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={!refinementInput.trim() || isRefinementLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm sm:w-auto"
              >
                {isRefinementLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Skicka
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      );
    };

    const parsed = advisorResponse;

    if (!parsed) {
      return (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          {aiContent
            .split(/\n{2,}/)
            .map(paragraph => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`fallback-${index}`}>{paragraph}</p>
            ))}
          {renderRefinementChat()}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-primary/10 text-primary p-4 rounded-3xl shadow-sm mb-4">
          <p>{parsed.summary}</p>
        </div>

        {parsed.recommendations.length > 0 && (
          <div className="space-y-3">
            {parsed.recommendations.map((recommendation, index) => (
              <Card key={index} className="p-3 border-border/30">
                <p className="font-semibold">
                  {recommendation.name}
                  {recommendation.ticker ? ` (${recommendation.ticker})` : ''}
                </p>
                {recommendation.reason && (
                  <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                )}
              </Card>
            ))}
          </div>
        )}

        {renderRefinementChat()}
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
      <div className="flex-1 overflow-y-auto">
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
                      {message.hasOptions && message.options && waitingForAnswer && !showHoldingsInput && (
                        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                          {message.options.map((option) => (
                            <Button
                              key={option.value}
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 bg-background/80 hover:bg-background border-border/50 hover:border-border transition-all duration-200"
                              onClick={() => handleAnswer(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
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
                                className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 bg-background/50 rounded-lg border"
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
                                  placeholder="Köppris (SEK) *"
                                  value={holding.purchasePrice || ''}
                                  onChange={(e) => handleHoldingPurchasePriceChange(holding.id, e.target.value)}
                                  className="text-xs sm:text-sm"
                                  required
                                  min="0"
                                  step="0.01"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeHolding(holding.id)}
                                  className="h-8 sm:h-9 px-2 text-red-600 hover:text-red-700"
                                  disabled={holdings.length === 1}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <datalist id={tickerDatalistId}>{tickerOptions}</datalist>
                          
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
                                      {h.name}{h.symbol && h.symbol.trim() ? ` (${h.symbol})` : ''}: {h.quantity} st à {h.purchasePrice} SEK
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2 flex-wrap">
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

          <div ref={messagesEndRef} />
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
                placeholder="Skriv ditt svar här..."
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
