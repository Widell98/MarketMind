
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    analysisType?: string;
    confidence?: number;
  };
}

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
}

export const useAIChat = (portfolioId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkUsageLimit, fetchUsage } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const loadMessages = useCallback(async (sessionId: string) => {
    if (!user || !portfolioId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const formattedMessages: Message[] = data.map(message => ({
        id: message.id,
        role: message.message_type === 'user' ? 'user' : 'assistant',
        content: message.message,
        timestamp: new Date(message.created_at),
        context: message.context_data as any,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda meddelanden. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, portfolioId, toast]);

  const loadSessions = useCallback(async () => {
    if (!user || !portfolioId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSessions(data.map(session => ({
        id: session.id,
        session_name: session.session_name || 'Ny Session',
        created_at: session.created_at,
        is_active: session.is_active || false,
      })));
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda sessioner. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, portfolioId, toast]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;

    // Check usage limit
    if (!checkUsageLimit('ai_message')) {
      toast({
        title: "Daglig gräns nådd",
        description: "Du har använt alla dina gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.",
        variant: "destructive",
      });
      return;
    }

    // Create new session if none exists
    if (!currentSessionId) {
      await createNewSession();
      return; // Wait for session creation, then retry
    }

    setIsLoading(true);
    setQuotaExceeded(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Enhanced context for better AI responses
      const enhancedMessage = content.includes('tough') || content.includes('worried') || content.includes('scared') ? 
        `[EMOTIONAL_SUPPORT_NEEDED] ${content}` : content;

      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: enhancedMessage,
          userId: user.id,
          portfolioId,
          sessionId: currentSessionId,
          contextType: 'advisory', // Indicate this is advisory context
        },
      });

      if (error) {
        if (error.message?.includes('quota') || error.message?.includes('429')) {
          setQuotaExceeded(true);
          toast({
            title: "API-kvot överskriden",
            description: "Du har nått din dagliga gräns för AI-användning. Försök igen senare.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Increment usage after successful API call
      await supabase.rpc('increment_ai_usage', {
        _user_id: user.id,
        _usage_type: 'ai_message'
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: data.context,
      };

      setMessages(prev => [...prev, assistantMessage]);
      await fetchUsage(); // Refresh usage data
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, portfolioId, currentSessionId, checkUsageLimit, fetchUsage, toast]);

  const analyzePortfolio = useCallback(async (analysisType: 'risk' | 'diversification' | 'performance' | 'optimization') => {
    if (!user || !portfolioId) return;

    // Check usage limit
    if (!checkUsageLimit('analysis')) {
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

      // Increment analysis usage
      await supabase.rpc('increment_ai_usage', {
        _user_id: user.id,
        _usage_type: 'analysis'
      });

      await fetchUsage(); // Refresh usage data
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, portfolioId, sendMessage, checkUsageLimit, fetchUsage]);

  const getQuickAnalysis = useCallback(async (prompt: string) => {
    if (!checkUsageLimit('ai_message')) {
      toast({
        title: "Daglig gräns nådd",
        description: "Du har använt alla dina gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.",
        variant: "destructive",
      });
      return;
    }
    
    await sendMessage(prompt);
  }, [sendMessage, checkUsageLimit, toast]);

  const createNewSession = useCallback(async () => {
    if (!user || !portfolioId) return;
    setIsLoading(true);
    try {
      // Generate contextual session name based on current market/time
      const now = new Date();
      const sessionName = `Rådgivning ${now.toLocaleDateString('sv-SE')} ${now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
      
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert([{ 
          user_id: user.id, 
          session_name: sessionName,
          context_data: {
            created_for: 'advisory',
            market_context: 'normal', // Could be enhanced with real market data
            portfolio_id: portfolioId
          }
        }])
        .select()
        .single();

      if (error) {
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
      setMessages([]);
      
      toast({
        title: "Ny chat skapad",
        description: "Du kan nu börja chatta med din AI-rådgivare.",
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
  }, [user, portfolioId, toast]);

  const loadSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
  }, [loadMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (user && portfolioId) {
      loadSessions();
    }
  }, [user, portfolioId, loadSessions]);

  return {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    isAnalyzing,
    quotaExceeded,
    sendMessage,
    analyzePortfolio,
    createNewSession,
    loadSession,
    clearMessages,
    getQuickAnalysis,
  };
};
