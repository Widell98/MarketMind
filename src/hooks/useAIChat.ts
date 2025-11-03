import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatSessions } from '@/contexts/ChatSessionsContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

const DAILY_MESSAGE_CREDITS = 10;

type ProfileUpdates = Record<string, unknown>;

type DetectedProfileIntent = {
  updates: ProfileUpdates;
  summary: string;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getTextVariants = (value: string): string[] => {
  const normalized = normalizeText(value);
  const withDiacritics = value
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return [];
  }

  if (!withDiacritics || normalized === withDiacritics) {
    return [normalized];
  }

  return [normalized, withDiacritics];
};

const formatListWithAnd = (items: string[]) => {
  if (items.length <= 1) {
    return items[0] ?? '';
  }

  const lastItem = items[items.length - 1];
  return `${items.slice(0, -1).join(', ')} och ${lastItem}`;
};

const toNumberFromCurrency = (value: string) => {
  const cleaned = value.replace(/[^0-9,\.]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '');
  const normalized = cleaned.replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const detectProfileUpdateIntent = (rawMessage: string): DetectedProfileIntent | null => {
  const textVariants = getTextVariants(rawMessage);

  if (textVariants.length === 0) {
    return null;
  }

  const normalized = textVariants[0];
  const matchesPattern = (pattern: RegExp) => textVariants.some(text => pattern.test(text));
  const matchesAny = (patterns: RegExp[]) => patterns.some(matchesPattern);

  const updates: ProfileUpdates = {};
  const summaryParts: string[] = [];

  const changeSignalPatterns: RegExp[] = [
    /(ändra|andra|ändring|andring|justera|justering|uppdatera|uppdatering|byt|byta|byte|förändra|forandra|förändring|forandring|skifta|ställa om|stalla om|ställ om|stall om|ställ in|stall in|sätt|satt|sätta|satta|gör om|gor om|justera min risk|set.*risk)/,
    /(vill|skulle vilja|önskar|onskar|behöver|behover|kan du|kan vi|hjälp mig|hjalp mig).*(ändra|andra|justera|höj|hoj|höja|hoja|sänk|sank|sänka|sanka|minska|minskar|öka|oka|förändra|forandra|byta).*(riskprofil|risktolerans|risknivå|riskniva|risken)/,
    /(riskprofil|risktolerans|risknivå|riskniva).*(till|vara|bli)/,
    /(ta.*mer risk|mer risktagande|ta.*mindre risk|mindre risktagande)/,
    /((bli|vara).*(mer|mindre).*(aggressiv|konservativ|balanserad|försiktig|forsiktig|trygg))/,
    /(gör|gor).*(riskprofil|risktolerans|risknivå|riskniva).*(mer|mindre|aggressiv|konservativ|balanserad|försiktig|forsiktig|trygg|högrisk|hogrisk|lågrisk|lagrisk)/,
    /(höj|hoj|höja|hoja|höjer|hojer|höjas|hojas|höjs|hojs|ökad?|okad?|ökade|okade|öka|oka|ökar|okar|ökas|okas).*(risken|risknivå|riskniva|riskprofilen)/,
    /(sänk|sank|sänka|sanka|sänker|sanker|sänks|sanks|sänkas|sankas|sänkta|sankta|minska|minskar|minskad|minskat|minskas|minskning|minskningar|dra ner|dra ned|gå ner|ga ner|gå ned|ga ned).*(risken|risknivå|riskniva|riskprofilen)/
  ];

  let hasChangeSignal = matchesAny(changeSignalPatterns);

  const riskKeywordPatterns: RegExp[] = [
    /(risktolerans|risktoleranser|risktålighet|risktalighet|riskaptit|riskvilja)/,
    /(riskprofil(?:en)?)/,
    /(risknivå|riskniva|risknivån|risknivan|risknivans)/,
    /(risktagande|risk appetite|risk preference|risk level)/
  ];

  const hasRiskKeyword = matchesAny(riskKeywordPatterns);
  const riskWordPresent = matchesPattern(/risk/);

  let hasRiskContext = hasRiskKeyword || (riskWordPresent && hasChangeSignal);

  if (!hasRiskContext) {
    const qualitativeRiskWords: RegExp[] = [
      /(aggressiv|aggressiva|aggressivare|högrisk|hogrisk|hög risk|hog risk|offensiv)/,
      /(konservativ|konservativa|försiktig|forsiktig|trygg|lågrisk|lagrisk|låg risk|lag risk|säker|saker)/,
      /(balanserad|balanserade|balanserat|måttlig|mattlig|lagom risk|medelrisk|mellanrisk|moderate|medium risk)/
    ];

    const investmentContextPatterns: RegExp[] = [
      /(portfölj|portfolj)/,
      /(investering|investera|investeringar)/,
      /(strategi|strategier)/,
      /(sparande|spara|sparar)/
    ];

    if (matchesAny(qualitativeRiskWords) && matchesAny(investmentContextPatterns)) {
      hasRiskContext = true;
    }
  }

  const riskToleranceLabels: Record<string, string> = {
    conservative: 'ändra din risktolerans till Konservativ',
    moderate: 'ändra din risktolerans till Måttlig',
    aggressive: 'ändra din risktolerans till Aggressiv',
  };

  type RiskLevel = keyof typeof riskToleranceLabels;
  type RiskLevelConfig = {
    level: RiskLevel;
    direct: RegExp[];
    standalone: RegExp[];
  };

  const riskLevelConfigs: RiskLevelConfig[] = [
    {
      level: 'conservative',
      direct: [
        /(ändra|andra|justera|uppdatera|byt|byta|sätt|satt|ställa|stalla|ställ|stall).*(riskprofil|risktolerans|risknivå|riskniva).*(konservativ|försiktig|forsiktig|trygg)/,
        /(konservativ|försiktig|forsiktig|trygg).*(riskprofil|risktolerans|risknivå|riskniva).*(till|vara|bli)/
      ],
      standalone: [
        /\bkonservativ(a|t)?\b/,
        /(försiktig|forsiktig)/,
        /(trygg|tryggare|tryggt)/,
        /(låg risk|lag risk|lågrisk|lagrisk)/,
        /(defensiv|defensivt)/,
        /(säker|saker|tryggare)/
      ]
    },
    {
      level: 'moderate',
      direct: [
        /(ändra|andra|justera|uppdatera|byt|byta|sätt|satt|ställa|stalla|ställ|stall).*(riskprofil|risktolerans|risknivå|riskniva).*(balanserad|måttlig|mattlig|medel|lagom)/,
        /(balanserad|måttlig|mattlig|lagom).*(riskprofil|risktolerans|risknivå|riskniva).*(till|vara|bli)/
      ],
      standalone: [
        /(balanserad|balanserat|balanserade)/,
        /(måttlig|mattlig)/,
        /(lagom risk|medelrisk|mellanrisk|medium risk|moderate)/
      ]
    },
    {
      level: 'aggressive',
      direct: [
        /(ändra|andra|justera|uppdatera|byt|byta|sätt|satt|ställa|stalla|ställ|stall).*(riskprofil|risktolerans|risknivå|riskniva).*(aggressiv|mer risk|högrisk|hogrisk|offensiv)/,
        /(aggressiv|aggressiva|aggressivare|högrisk|hogrisk|offensiv).*(riskprofil|risktolerans|risknivå|riskniva).*(till|vara|bli)/
      ],
      standalone: [
        /(aggressiv|aggressiva|aggressivare)/,
        /(hög risk|hog risk|högrisk|hogrisk)/,
        /(mer risk|större risk|stor risk|höj risken|hoj risken)/,
        /(offensiv|offensivt)/
      ]
    }
  ];

  if (hasRiskContext) {
    for (const config of riskLevelConfigs) {
      if (matchesAny(config.direct)) {
        hasChangeSignal = true;
        updates.risk_tolerance = config.level;
        summaryParts.push(riskToleranceLabels[config.level]);
        break;
      }

      if (hasChangeSignal && matchesAny(config.standalone)) {
        updates.risk_tolerance = config.level;
        summaryParts.push(riskToleranceLabels[config.level]);
        break;
      }
    }

    if (!updates.risk_tolerance) {
      const increasePatterns: RegExp[] = [
        /(höj|hoj|höja|hoja|höjer|hojer|höjas|hojas|höjs|hojs|öka|oka|ökad|okad|ökade|okade|ökar|okar|ökas|okas).*(risken|risknivå|riskniva|riskprofilen)/,
        /(vill|önskar|onskar|skulle vilja|kan du).*(ta|ha).*(mer risk)/,
        /(gå upp i risk|ga upp i risk|höj nivån|hoj nivan|höj risknivån|hoj risknivan|höj riskprofilen|hoj riskprofilen)/,
        /(bli mer aggressiv|mer aggressiv|aggressivare|mer offensiv)/,
        /(higher risk|increase risk|take more risk)/
      ];

      const decreasePatterns: RegExp[] = [
        /(sänk|sank|sänka|sanka|sänker|sanker|sänks|sanks|sänkas|sankas|sänkta|sankta|minska|minskar|minskad|minskat|minskas|minskning|minskningar|dra ner|dra ned).*(risken|risknivå|riskniva|riskprofilen)/,
        /(vill|önskar|onskar|skulle vilja|kan du).*(ta|ha).*(mindre risk)/,
        /(gå ner i risk|ga ner i risk|sänk nivån|sank nivan|sänk risknivån|sank risknivan|sänk riskprofilen|sank riskprofilen)/,
        /(bli mer konservativ|mer konservativ|tryggare|defensivare)/,
        /(lower risk|reduce risk|need less risk)/
      ];

      if (matchesAny(increasePatterns)) {
        hasChangeSignal = true;
        updates.risk_tolerance = 'aggressive';
        summaryParts.push(riskToleranceLabels.aggressive);
      } else if (matchesAny(decreasePatterns)) {
        hasChangeSignal = true;
        updates.risk_tolerance = 'conservative';
        summaryParts.push(riskToleranceLabels.conservative);
      }
    }
  }

  const horizonPatterns: Record<'short' | 'medium' | 'long', RegExp[]> = {
    short: [
      /kort sikt/,
      /0[-–]2 ar/,
      /inom (ett|1|tva|2) ar/,
      /snart behov/,
      /short term/,
    ],
    medium: [
      /medel sikt/,
      /medellang/,
      /3[-–]5 ar/,
      /5 ar/,
      /inom nagra ar/,
      /medium term/,
    ],
    long: [
      /lang sikt/,
      /langtid/,
      /5\+ ar/,
      /6 ar/,
      /7 ar/,
      /10 ar/,
      /for (lang|langa) tiden/,
      /long term/,
    ],
  };

  for (const [horizon, patterns] of Object.entries(horizonPatterns) as [keyof typeof horizonPatterns, RegExp[]][]) {
    if (patterns.some(pattern => pattern.test(normalized))) {
      updates.investment_horizon = horizon;
      const horizonLabels: Record<string, string> = {
        short: 'justera din tidshorisont till Kort (0–2 år)',
        medium: 'justera din tidshorisont till Medel (3–5 år)',
        long: 'justera din tidshorisont till Lång (5+ år)',
      };
      summaryParts.push(horizonLabels[horizon]);
      break;
    }
  }

  const monthlyIndicatorPatterns: RegExp[] = [
    /per manad/,
    /per månad/,
    /varje manad/,
    /varje månad/,
    /manadsspar/,
    /månadsspar/,
    /manadssparande/,
    /månadssparande/,
    /manadsvis/,
    /månadsvis/,
    /monthly/,
    /per month/,
    /each month/
  ];

  if (matchesAny(monthlyIndicatorPatterns)) {
    const amountMatch = normalized.match(/(\d{1,3}(?:[ \u00A0\.]\d{3})*|\d+)(?:[\.,]\d+)?\s*(kr|sek|kronor)?/);

    if (amountMatch) {
      const numericValue = toNumberFromCurrency(amountMatch[0]);

      if (numericValue !== null && Number.isFinite(numericValue)) {
        const roundedValue = Math.round(numericValue);
        updates.monthly_investment_amount = roundedValue;
        summaryParts.push(`uppdatera ditt månadssparande till ${roundedValue.toLocaleString('sv-SE')} kr`);
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return null;
  }

  const formattedSummary = formatListWithAnd(summaryParts);
  const summary = `Jag tolkar att du vill ${formattedSummary}. Vill du uppdatera din profil?`;

  return {
    updates,
    summary,
  };
};

type MessageContext = {
  analysisType?: string;
  confidence?: number;
  isExchangeRequest?: boolean;
  profileUpdates?: ProfileUpdates;
  requiresConfirmation?: boolean;
  [key: string]: unknown;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: MessageContext;
}

interface PendingSessionState {
  requestId: string;
  userMessage: Message;
  detectionMessage?: Message;
  aiMessage?: Message;
}

const pendingSessionStates = new Map<string, PendingSessionState>();

const setPendingState = (sessionId: string, state: PendingSessionState) => {
  pendingSessionStates.set(sessionId, state);
};

const updatePendingState = (sessionId: string, requestId: string, updates: Partial<PendingSessionState>) => {
  const existing = pendingSessionStates.get(sessionId);
  if (!existing || existing.requestId !== requestId) {
    return;
  }

  pendingSessionStates.set(sessionId, {
    ...existing,
    ...updates,
  });
};

const clearPendingState = (sessionId: string, requestId: string) => {
  const existing = pendingSessionStates.get(sessionId);
  if (existing && existing.requestId === requestId) {
    pendingSessionStates.delete(sessionId);
  }
};

const getPendingState = (sessionId: string) => pendingSessionStates.get(sessionId);

export const useAIChat = (portfolioId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkUsageLimit, subscription, usage, fetchUsage, incrementUsage } = useSubscription();
  const {
    sessions,
    setSessions,
    loadSessions: loadChatSessions,
  } = useChatSessions();
  const totalCredits = DAILY_MESSAGE_CREDITS;
  const remainingCredits = useMemo(() => {
    const usedCredits = usage?.ai_messages_count ?? 0;
    return Math.max(0, totalCredits - usedCredits);
  }, [usage?.ai_messages_count]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const ephemeralMessagesRef = useRef<Message[]>([]);

  const addOrReplaceEphemeralMessage = useCallback((message: Message) => {
    ephemeralMessagesRef.current = [
      ...ephemeralMessagesRef.current.filter(existing => existing.id !== message.id),
      message,
    ];
  }, []);

  const removeEphemeralMessage = useCallback((messageId: string) => {
    ephemeralMessagesRef.current = ephemeralMessagesRef.current.filter(message => message.id !== messageId);
  }, []);

  const clearEphemeralMessages = useCallback(() => {
    ephemeralMessagesRef.current = [];
  }, []);

  const getActiveEphemeralMessages = useCallback(
    () => ephemeralMessagesRef.current.filter(message => message.context?.requiresConfirmation !== false),
    []
  );

  const loadMessages = useCallback(async (sessionId: string, skipClear = false) => {
    if (!user) return;


    if (!skipClear) {
      setIsLoadingSession(true);
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }


      const formattedMessages: Message[] = data.map(message => ({
        id: message.id,
        role: message.message_type === 'user' ? 'user' : 'assistant',
        content: message.message,
        timestamp: new Date(message.created_at),
        context: message.context_data
          ? (message.context_data as MessageContext)
          : undefined,
      }));


      const activeEphemeralMessages = getActiveEphemeralMessages();
      const hasPersistedConfirmation = formattedMessages.some(message => message.context?.requiresConfirmation);
      let mergedMessages = formattedMessages;

      if (hasPersistedConfirmation) {
        clearEphemeralMessages();
      } else if (activeEphemeralMessages.length > 0) {
        const persistedIds = new Set(formattedMessages.map(message => message.id));
        const pendingEphemeralMessages = activeEphemeralMessages.filter(message => !persistedIds.has(message.id));

        if (pendingEphemeralMessages.length > 0) {
          mergedMessages = [...formattedMessages, ...pendingEphemeralMessages];
        }

        ephemeralMessagesRef.current = pendingEphemeralMessages;
      } else {
        clearEphemeralMessages();
      }

      const pendingState = getPendingState(sessionId);
      if (pendingState) {
        const { userMessage, detectionMessage, aiMessage } = pendingState;
        const existingIds = new Set(mergedMessages.map(message => message.id));
        const pendingMessages: Message[] = [];

        if (!existingIds.has(userMessage.id)) {
          pendingMessages.push(userMessage);
        }

        if (detectionMessage && !existingIds.has(detectionMessage.id)) {
          pendingMessages.push(detectionMessage);
        }

        if (aiMessage && !existingIds.has(aiMessage.id)) {
          pendingMessages.push(aiMessage);
        }

        if (pendingMessages.length > 0) {
          mergedMessages = [...mergedMessages, ...pendingMessages];
        }

        setIsLoading(true);
      }

      if (skipClear) {
        setMessages(mergedMessages);
      } else {
        // Clear messages first, then set new ones
        setMessages([]);
        setTimeout(() => {
          setMessages(mergedMessages);
        }, 50);
      }

    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda meddelanden. Försök igen.",
        variant: "destructive",
      });
    } finally {
      if (!skipClear) {
        setIsLoadingSession(false);
      }
    }
  }, [user, toast, clearEphemeralMessages, getActiveEphemeralMessages]);

  const loadSessions = useCallback(async () => {
    if (!user) return;


    try {
      const formattedSessions = await loadChatSessions();


      if (!formattedSessions || formattedSessions.length === 0) {
        return;
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda sessioner. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, toast, loadChatSessions]);

  const loadSession = useCallback(async (sessionId: string) => {

    // Immediately clear messages and set new session
    setMessages([]);
    clearEphemeralMessages();
    setCurrentSessionId(sessionId);

    // Load messages for the selected session
    await loadMessages(sessionId);
    
    toast({
      title: "Chat laddad",
      description: "Din sparade chat har laddats.",
    });
  }, [currentSessionId, loadMessages, toast, clearEphemeralMessages]);

  const createNewSession = useCallback(async (customName?: string, shouldSendInitialMessage?: string) => {
    
    if (!user) {
      return;
    }
    
    setIsLoading(true);

    // Clear messages immediately for new session
    setMessages([]);
    clearEphemeralMessages();
    if (currentSessionId) {
      pendingSessionStates.delete(currentSessionId);
    }
    
    try {
      const now = new Date();
      const sessionName = customName || `Chat ${now.toLocaleDateString('sv-SE')} ${now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
      
      
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert([{ 
          user_id: user.id, 
          session_name: sessionName,
          context_data: {
            created_for: 'advisory',
            market_context: 'normal',
            portfolio_id: portfolioId
          }
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }


      const newSession = {
        id: data.id,
        session_name: data.session_name || sessionName,
        created_at: data.created_at,
        is_active: data.is_active || false,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      
      // Only send initial message if explicitly requested and provided
      if (shouldSendInitialMessage) {
        // Small delay to ensure session is properly set
        setTimeout(() => {
          sendMessageToSession(shouldSendInitialMessage, newSession.id);
        }, 100);
      }
      
      toast({
        title: customName ? `Chat "${customName}" skapad` : "Ny chat skapad",
        description: shouldSendInitialMessage ? "Skickar din fråga..." : "Du kan nu börja chatta med din AI-assistent.",
      });
      
    } catch (error) {
      console.error('Error creating new session:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa ny session. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, clearEphemeralMessages, currentSessionId, portfolioId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) {
      console.error('Cannot delete session: no authenticated user');
      return;
    }
    
    
    try {
      // First, let's check if the session exists and belongs to the user
      const { data: sessionCheck, error: sessionCheckError } = await supabase
        .from('ai_chat_sessions')
        .select('id, user_id, session_name')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (sessionCheckError) {
        console.error('Error checking session ownership:', sessionCheckError);
        throw new Error(`Kunde inte kontrollera session: ${sessionCheckError.message}`);
      }

      if (!sessionCheck) {
        console.error('Session not found or does not belong to user');
        toast({
          title: "Fel",
          description: "Sessionen hittades inte eller tillhör inte dig.",
          variant: "destructive",
        });
        return;
      }


      // Delete all messages in the session first
      const { error: messagesError } = await supabase
        .from('portfolio_chat_history')
        .delete()
        .eq('chat_session_id', sessionId)
        .eq('user_id', user.id);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw new Error(`Kunde inte radera meddelanden: ${messagesError.message}`);
      }

      // Now delete the session itself
      const { error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (sessionError) {
        console.error('Error deleting session:', sessionError);
        throw new Error(`Kunde inte radera session: ${sessionError.message}`);
      }


      // Update local state immediately
      setSessions(prev => {
        const updated = prev.filter(session => session.id !== sessionId);
        return updated;
      });
      
      // If we deleted the current session, clear it and load the most recent one
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
        pendingSessionStates.delete(sessionId);

        // Load the most recent remaining session if any
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          const mostRecent = remainingSessions[0];
          await loadSession(mostRecent.id);
        } else {
        }
      }

      toast({
        title: "Chat borttagen",
        description: `Chatten "${sessionCheck.session_name}" har tagits bort permanent.`,
      });

    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte ta bort chatten. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, currentSessionId, sessions, loadSession, toast]);

  const deleteSessionsBulk = useCallback(async (sessionIds: string[]) => {
    if (!user || sessionIds.length === 0) {
      return;
    }

    const uniqueIds = Array.from(new Set(sessionIds));

    try {
      const { error: messagesError } = await supabase
        .from('portfolio_chat_history')
        .delete()
        .eq('user_id', user.id)
        .in('chat_session_id', uniqueIds);

      if (messagesError) {
        throw new Error(`Kunde inte radera meddelanden: ${messagesError.message}`);
      }

      const { error: sessionsError } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('user_id', user.id)
        .in('id', uniqueIds);

      if (sessionsError) {
        throw new Error(`Kunde inte radera sessioner: ${sessionsError.message}`);
      }

      uniqueIds.forEach(id => pendingSessionStates.delete(id));

      const remainingSessions = sessions.filter(
        (session) => !uniqueIds.includes(session.id),
      );

      setSessions(remainingSessions);

      if (currentSessionId && uniqueIds.includes(currentSessionId)) {
        setCurrentSessionId(null);
        setMessages([]);

        if (remainingSessions.length > 0) {
          await loadSession(remainingSessions[0].id);
        }
      }

      toast({
        title: "Chattar rensade",
        description: "Dina osorterade chattar har tagits bort.",
      });
    } catch (error) {
      console.error('Error clearing sessions:', error);
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte rensa chattar. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, sessions, currentSessionId, loadSession, toast]);

  const editSessionName = useCallback(async (sessionId: string, newName: string) => {
    if (!user) {
      console.error('Cannot edit session name: no authenticated user');
      return;
    }
    
    
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({ session_name: newName })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating session name:', error);
        throw error;
      }


      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, session_name: newName }
          : session
      ));

      toast({
        title: "Chattnamn uppdaterat",
        description: `Chatten har bytt namn till "${newName}".`,
      });

    } catch (error) {
      console.error('Error editing session name:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ändra chattnamnet. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const sendMessage = useCallback(async (content: string) => {
    
    if (!user || !content.trim()) {
      return;
    }

    // Check usage limit with better error handling
    const canSendMessage = checkUsageLimit('ai_message');
    const isPremium = subscription?.subscribed;
    const currentUsage = usage?.ai_messages_count || 0;
    const dailyLimit = DAILY_MESSAGE_CREDITS;

    if (!canSendMessage && !isPremium) {
      toast({
        title: "Daglig gräns nådd",
        description: `Du har använt alla dina ${dailyLimit} gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.`,
        variant: "destructive",
      });
      setQuotaExceeded(true);
      return;
    }

    // If no session exists, create one and send message
    if (!currentSessionId) {
      await createNewSessionAndSendMessage(content);
      return;
    }

    await sendMessageToSession(content);
  }, [user, currentSessionId, checkUsageLimit, subscription, usage, toast, portfolioId]);

  const createNewSessionAndSendMessage = useCallback(async (messageContent: string) => {
    
    if (!user) {
      return;
    }
    
    setIsLoading(true);

    // Clear messages immediately when creating new session
    setMessages([]);
    clearEphemeralMessages();
    if (currentSessionId) {
      pendingSessionStates.delete(currentSessionId);
    }
    
    try {
      const now = new Date();
      const sessionName = `Chat ${now.toLocaleDateString('sv-SE')} ${now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
      
      
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert([{ 
          user_id: user.id, 
          session_name: sessionName,
          context_data: {
            created_for: 'advisory',
            market_context: 'normal',
            portfolio_id: portfolioId
          }
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }


      const newSession = {
        id: data.id,
        session_name: data.session_name || sessionName,
        created_at: data.created_at,
        is_active: data.is_active || false,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      
      
      // Now send the message to the newly created session
      await sendMessageToSession(messageContent, newSession.id);
      
    } catch (error) {
      console.error('Error creating new session:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa ny session. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, clearEphemeralMessages, currentSessionId, portfolioId]);

  const sendMessageToSession = useCallback(async (content: string, sessionId?: string) => {
    
    const targetSessionId = sessionId || currentSessionId;
    
    if (!user || !content.trim() || !targetSessionId) {
      return;
    }
    
    const trimmedContent = content.trim();
    const userMessageId = Date.now().toString() + '_user_temp';
    const requestId = userMessageId;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: trimmedContent,
      timestamp: new Date()
    };

    const hasPendingConfirmation = messages.some(msg => msg.context?.requiresConfirmation);
    const detectedIntent = hasPendingConfirmation ? null : detectProfileUpdateIntent(trimmedContent);
    const detectionTimestamp = Date.now();
    const detectionMessage: Message | null = detectedIntent
      ? {
          id: `${detectionTimestamp}_profile_detected`,
          role: 'assistant',
          content: detectedIntent.summary,
          timestamp: new Date(detectionTimestamp),
          context: {
            analysisType: 'profile_update_detection',
            profileUpdates: detectedIntent.updates,
            requiresConfirmation: true,
            detectedSummary: detectedIntent.summary,
            detectedBy: 'client'
          }
        }
      : null;

    if (detectionMessage) {
      addOrReplaceEphemeralMessage(detectionMessage);
    }

    setPendingState(targetSessionId, {
      requestId,
      userMessage,
      detectionMessage: detectionMessage ?? undefined,
    });

    setMessages(prev => detectionMessage ? [...prev, userMessage, detectionMessage] : [...prev, userMessage]);
    setIsLoading(true);

    try {

      
      // Send chat history for context (last 10 messages excluding the temp message we just added)
      const chatHistoryForAPI = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Handle streaming response using direct fetch for better streaming support
      const supabaseUrl = 'https://qifolopsdeeyrevbuxfl.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZm9sb3BzZGVleXJldmJ1eGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzY3MjMsImV4cCI6MjA2MzUxMjcyM30.x89y179_8EDl1NwTryhXfUDMzdxrnfomZfRmhmySMhM';
      
      const streamResponse = await fetch(`${supabaseUrl}/functions/v1/portfolio-ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          message: trimmedContent,
          userId: user.id,
          portfolioId: portfolioId,
          sessionId: targetSessionId,
          chatHistory: chatHistoryForAPI,
          analysisType: 'general',
          detectedProfileUpdates: detectedIntent?.updates ?? undefined,
          detectedProfileSummary: detectedIntent?.summary ?? undefined
        })
      });

      if (streamResponse.status === 429) {
        setQuotaExceeded(true);
        toast({
          title: "Daglig gräns nådd",
          description: `Du har använt alla dina ${DAILY_MESSAGE_CREDITS} gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.`,
          variant: "destructive",
        });
        setMessages(prev => prev.filter(msg => !msg.id.includes('_temp')));
        clearPendingState(targetSessionId, requestId);
        setIsLoading(false);
        await fetchUsage();
        return;
      }

      if (!streamResponse.ok) {
        throw new Error(`HTTP error! status: ${streamResponse.status}`);
      }

      
      // Create placeholder AI message for streaming
      const aiMessageId = Date.now().toString() + '_ai_temp';
      let aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        context: {
          analysisType: 'general',
          confidence: 0.8
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      updatePendingState(targetSessionId, requestId, { aiMessage });
      
      // Process streaming response
      const reader = streamResponse.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let profileUpdates = null;
      let requiresConfirmation = false;
      
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  break;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    accumulatedContent += parsed.content;
                    
                    // Update message with new content
                    const updatedMessage: Message = { ...aiMessage, content: accumulatedContent };
                    aiMessage = updatedMessage;

                    setMessages(prev => prev.map(msg =>
                      msg.id === aiMessageId
                        ? updatedMessage
                        : msg
                    ));
                    updatePendingState(targetSessionId, requestId, { aiMessage: updatedMessage });
                  }

                  // Check for profile updates
                  if (parsed.profileUpdates) {
                    profileUpdates = parsed.profileUpdates;
                    requiresConfirmation = parsed.requiresConfirmation;
                  }
                } catch (e) {
                  // Ignore JSON parse errors
                }
              }
            }
          }
          
          // Update final message with profile update context if needed
          if (requiresConfirmation && profileUpdates) {
            setMessages(prev => prev.map(msg =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    context: {
                      ...msg.context,
                      profileUpdates,
                      requiresConfirmation: true
                    }
                  }
                : msg
            ));

            const updatedMessage: Message = {
              ...aiMessage,
              context: {
                ...aiMessage.context,
                profileUpdates,
                requiresConfirmation: true,
              },
            };

            aiMessage = updatedMessage;
            updatePendingState(targetSessionId, requestId, { aiMessage: updatedMessage });
          }

        } finally {
          reader.releaseLock();
        }
      }
      
      // After streaming is complete, reload messages from database to get the complete conversation with correct IDs
      setTimeout(() => {
        loadMessages(targetSessionId, true);
      }, 1000);

      clearPendingState(targetSessionId, requestId);

      // Track usage
      const { error: usageError } = await supabase.rpc('increment_ai_usage', {
        _user_id: user.id,
        _usage_type: 'ai_message'
      });
      if (usageError) {
        console.error('Usage tracking failed:', usageError);
      } else {
        incrementUsage('ai_message');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet. Försök igen.",
        variant: "destructive",
      });

      // Remove the temporary user message on error
      setMessages(prev => prev.filter(msg => !msg.id.includes('_temp')));
      clearPendingState(targetSessionId, requestId);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSessionId, portfolioId, messages, toast, fetchUsage, incrementUsage, loadMessages, addOrReplaceEphemeralMessage]);

  const dismissProfileUpdatePrompt = useCallback(async (messageId: string) => {
    const targetMessage = messages.find(msg => msg.id === messageId);

    if (!targetMessage || !targetMessage.context) {
      return;
    }

    const updatedContext = {
      ...targetMessage.context,
      requiresConfirmation: false,
    };

    let updatedMessage: Message | undefined;

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const nextMessage = {
          ...msg,
          context: updatedContext,
        };
        updatedMessage = nextMessage;
        return nextMessage;
      }

      return msg;
    }));

    if (updatedMessage?.context?.requiresConfirmation !== false) {
      addOrReplaceEphemeralMessage(updatedMessage);
    } else {
      removeEphemeralMessage(messageId);
    }

    try {
      const { error } = await supabase
        .from('portfolio_chat_history')
        .update({ context_data: updatedContext })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating message context:', error);
      }
    } catch (error) {
      console.error('Error dismissing profile update prompt:', error);
    }
  }, [messages, addOrReplaceEphemeralMessage, removeEphemeralMessage]);

  // Function to update user profile based on AI-detected changes
  const updateUserProfile = useCallback(async (profileUpdates: ProfileUpdates, sourceMessageId?: string) => {
    if (!user) return;

    const keyLabels: Record<string, string> = {
      monthly_investment_amount: 'Månadssparande',
      risk_tolerance: 'Risktolerans',
      investment_horizon: 'Tidshorisont',
      liquid_capital: 'Likvidt kapital',
      emergency_buffer_months: 'Buffert (månader)',
      preferred_stock_count: 'Önskat antal aktier',
      housing_situation: 'Bostadssituation',
      has_loans: 'Har lån'
    };

    const housingSituationLabels: Record<string, string> = {
      owns_no_loan: 'Äger bostad utan lån',
      owns_with_loan: 'Äger bostad med lån',
      rents: 'Hyr bostad',
      lives_with_parents: 'Bor hos föräldrar'
    };

    const riskToleranceLabels: Record<string, string> = {
      conservative: 'Konservativ',
      moderate: 'Måttlig',
      aggressive: 'Aggressiv'
    };

    const investmentHorizonLabels: Record<string, string> = {
      short: 'Kort (0–2 år)',
      medium: 'Medel (3–5 år)',
      long: 'Lång (5+ år)'
    };

    const formatValue = (key: string, value: unknown) => {
      if (key === 'housing_situation') {
        return housingSituationLabels[String(value)] ?? String(value);
      }

      if (key === 'risk_tolerance') {
        return riskToleranceLabels[String(value)] ?? String(value);
      }

      if (key === 'investment_horizon') {
        return investmentHorizonLabels[String(value)] ?? String(value);
      }

      if (typeof value === 'boolean') {
        return value ? 'Ja' : 'Nej';
      }

      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value.toLocaleString('sv-SE');
      }

      return String(value);
    };

    try {
      const { error } = await supabase
        .from('user_risk_profiles')
        .update(profileUpdates)
        .eq('user_id', user.id);

      if (error) throw error;

      if (sourceMessageId) {
        await dismissProfileUpdatePrompt(sourceMessageId);
      }

      toast({
        title: "Profil uppdaterad",
        description: "Din investeringsprofil har uppdaterats baserat på din konversation.",
      });

      const summary = Object.entries(profileUpdates)
        .map(([key, value]) => `${keyLabels[key] ?? key}: ${formatValue(key, value)}`)
        .join(', ');

      const confirmationMessage = summary
        ? `Jag har uppdaterat din profil med följande ändringar: ${summary}.`
        : 'Jag har uppdaterat din profil.';

      if (currentSessionId) {
        const { data: insertedMessage, error: insertError } = await supabase
          .from('portfolio_chat_history')
          .insert({
            user_id: user.id,
            chat_session_id: currentSessionId,
            message: confirmationMessage,
            message_type: 'assistant',
            context_data: {
              analysisType: 'profile_update_confirmation',
              requiresConfirmation: false
            }
          })
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('Error saving confirmation message:', insertError);
        }

        if (insertedMessage) {
          setMessages(prev => [
            ...prev,
            {
              id: insertedMessage.id,
              role: 'assistant',
              content: insertedMessage.message,
              timestamp: new Date(insertedMessage.created_at),
              context: insertedMessage.context_data as MessageContext
            }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}_profile_update_confirmation`,
              role: 'assistant',
              content: confirmationMessage,
              timestamp: new Date(),
              context: {
                analysisType: 'profile_update_confirmation',
                requiresConfirmation: false
              }
            }
          ]);
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}_profile_update_confirmation`,
            role: 'assistant',
            content: confirmationMessage,
            timestamp: new Date(),
            context: {
              analysisType: 'profile_update_confirmation',
              requiresConfirmation: false
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera profilen. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, currentSessionId, dismissProfileUpdatePrompt, toast]);

  const analyzePortfolio = useCallback(async (analysisType: 'risk' | 'diversification' | 'performance' | 'optimization') => {
    if (!user || !portfolioId) return;

    const canAnalyze = checkUsageLimit('analysis');
    const isPremium = subscription?.subscribed;

    if (!canAnalyze && !isPremium) {
      toast({
        title: "Daglig gräns nådd",
        description: "Du har använt alla dina gratis analyser för idag. Uppgradera för obegränsad användning.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setQuotaExceeded(false);

    try {
      const analysisPrompts = {
        risk: 'Ge mig en djupgående riskanalys av min portfölj',
        diversification: 'Analysera diversifieringen i min portfölj',
        performance: 'Analysera prestandan i min portfölj',
        optimization: 'Ge mig optimeringsförslag för min portfölj'
      };

      await sendMessage(analysisPrompts[analysisType]);

      const { error: usageError } = await supabase.rpc('increment_ai_usage', {
        _user_id: user.id,
        _usage_type: 'analysis'
      });

      if (usageError) {
        console.error('Error incrementing analysis usage:', usageError);
      } else {
      }

    } catch (error) {
      console.error('Error analyzing portfolio:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, portfolioId, sendMessage, checkUsageLimit, subscription, toast]);

  const getQuickAnalysis = useCallback(async (prompt: string) => {
    const canSendMessage = checkUsageLimit('ai_message');
    const isPremium = subscription?.subscribed;

    if (!canSendMessage && !isPremium) {
      toast({
        title: "Daglig gräns nådd",
        description: `Du har använt alla dina ${DAILY_MESSAGE_CREDITS} gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.`,
        variant: "destructive",
      });
      return;
    }
    
    await sendMessage(prompt);
  }, [sendMessage, checkUsageLimit, subscription, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    clearEphemeralMessages();
    if (currentSessionId) {
      pendingSessionStates.delete(currentSessionId);
    }
    setIsLoading(false);
  }, [clearEphemeralMessages, currentSessionId]);

  useEffect(() => {
    if (!user || currentSessionId || sessions.length === 0) {
      return;
    }

    const mostRecentSession = sessions[0];
    setCurrentSessionId(mostRecentSession.id);
    loadMessages(mostRecentSession.id);
  }, [user, sessions, currentSessionId, loadMessages]);

  useEffect(() => {
    if (!currentSessionId) {
      return;
    }

    const pendingState = getPendingState(currentSessionId);
    if (!pendingState) {
      return;
    }

    setIsLoading(true);
    setMessages(prev => {
      const existingIds = new Set(prev.map(message => message.id));
      const nextMessages = [...prev];

      if (!existingIds.has(pendingState.userMessage.id)) {
        nextMessages.push(pendingState.userMessage);
      }

      if (pendingState.detectionMessage && !existingIds.has(pendingState.detectionMessage.id)) {
        nextMessages.push(pendingState.detectionMessage);
      }

      if (pendingState.aiMessage && !existingIds.has(pendingState.aiMessage.id)) {
        nextMessages.push(pendingState.aiMessage);
      }

      return nextMessages;
    });
  }, [currentSessionId]);

  return {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    isAnalyzing,
    quotaExceeded,
    isLoadingSession,
    sendMessage,
    analyzePortfolio,
    createNewSession,
    loadSession,
    deleteSession,
    deleteSessionsBulk,
    editSessionName,
    clearMessages,
    getQuickAnalysis,
    dismissProfileUpdatePrompt,
    updateUserProfile,
    usage,
    subscription,
    remainingCredits,
    totalCredits,
  };
};
