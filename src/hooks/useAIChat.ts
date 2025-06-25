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
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

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
    console.log('sendMessage called with:', content);
    console.log('Current session ID:', currentSessionId);
    
    if (!user || !content.trim()) {
      console.log('Missing user or empty content');
      return;
    }

    // Check usage limit
    if (!checkUsageLimit('ai_message')) {
      toast({
        title: "Daglig gräns nådd",
        description: "Du har använt alla dina gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.",
        variant: "destructive",
      });
      return;
    }

    // If no session exists, create one and queue the message
    if (!currentSessionId) {
      console.log('No session exists, setting pending message and creating session');
      setPendingMessage(content);
      await createNewSession();
      return;
    }

    console.log('Sending message to existing session');
    await sendMessageToSession(content);
  }, [user, currentSessionId, checkUsageLimit, toast]);

  const sendMessageToSession = useCallback(async (content: string) => {
    if (!user || !currentSessionId) {
      console.log('Cannot send message: missing user or session');
      return;
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
    console.log('Added user message to UI');

    try {
      // Enhanced context for better AI responses
      const enhancedMessage = content.includes('tough') || content.includes('worried') || content.includes('scared') ? 
        `[EMOTIONAL_SUPPORT_NEEDED] ${content}` : content;

      console.log('Calling AI function with message:', enhancedMessage);

      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: enhancedMessage,
          userId: user.id,
          portfolioId,
          sessionId: currentSessionId,
          contextType: 'advisory',
        },
      });

      if (error) {
        console.error('AI function error:', error);
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

      console.log('AI response received:', data);

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
      console.log('Added assistant message to UI');
      await fetchUsage();
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
  }, [user, portfolioId, currentSessionId, fetchUsage, toast]);

  const analyzePortfolio = useCallback(async (analysisType: 'risk' | 'diversification' | 'performance' | 'optimization') => {
    if (!user || !portfolioId) return;

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

      await supabase.rpc('increment_ai_usage', {
        _user_id: user.id,
        _usage_type: 'analysis'
      });

      await fetchUsage();
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
    if (!user || !portfolioId) {
      console.log('Cannot create session: missing user or portfolio');
      return;
    }
    
    console.log('Creating new session...');
    setIsLoading(true);
    
    try {
      const now = new Date();
      const sessionName = `Rådgivning ${now.toLocaleDateString('sv-SE')} ${now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
      
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
        throw error;
      }

      console.log('New session created:', data);

      const newSession = {
        id: data.id,
        session_name: data.session_name || sessionName,
        created_at: data.created_at,
        is_active: data.is_active || false,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      
      console.log('Session state updated, checking for pending message...');
      
      // Send pending message if exists
      if (pendingMessage) {
        console.log('Found pending message, sending:', pendingMessage);
        const messageToSend = pendingMessage;
        setPendingMessage(null);
        // Small delay to ensure session is properly set
        setTimeout(async () => {
          await sendMessageToSession(messageToSend);
        }, 100);
      } else {
        console.log('No pending message, showing toast');
        toast({
          title: "Ny chat skapad",
          description: "Du kan nu börja chatta med din AI-rådgivare.",
        });
      }
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
  }, [user, portfolioId, pendingMessage, sendMessageToSession, toast]);

  const loadSession = useCallback(async (sessionId: string) => {
    console.log('Loading chat session:', sessionId);
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
    
    toast({
      title: "Chat laddad",
      description: "Din sparade chat har laddats.",
    });
  }, [loadMessages, toast]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) return;
    
    try {
      const { error: messagesError } = await supabase
        .from('portfolio_chat_history')
        .delete()
        .eq('chat_session_id', sessionId)
        .eq('user_id', user.id);

      if (messagesError) throw messagesError;

      const { error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (sessionError) throw sessionError;

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }

      toast({
        title: "Chat borttagen",
        description: "Chatten har tagits bort permanent.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort chatten. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, currentSessionId, toast]);

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
    deleteSession,
    clearMessages,
    getQuickAnalysis,
  };
};
