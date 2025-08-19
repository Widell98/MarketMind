import { useState, useCallback, useEffect, useMemo } from 'react';
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
    isExchangeRequest?: boolean;
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
  const { checkUsageLimit, subscription, usage, fetchUsage } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const loadMessages = useCallback(async (sessionId: string) => {
    if (!user || !portfolioId) return;
    
    console.log('=== LOADING MESSAGES ===');
    console.log('Session ID:', sessionId);
    console.log('User ID:', user.id);
    
    setIsLoadingSession(true);
    
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

      console.log('Raw messages from database:', data);

      const formattedMessages: Message[] = data.map(message => ({
        id: message.id,
        role: message.message_type === 'user' ? 'user' : 'assistant',
        content: message.message,
        timestamp: new Date(message.created_at),
        context: message.context_data as any,
      }));

      console.log('Formatted messages:', formattedMessages);
      console.log('Setting messages to state...');
      
      // Clear messages first, then set new ones
      setMessages([]);
      setTimeout(() => {
        setMessages(formattedMessages);
        console.log('Messages set to state:', formattedMessages.length);
      }, 50);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda meddelanden. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSession(false);
    }
  }, [user, portfolioId, toast]);

  const loadSessions = useCallback(async () => {
    if (!user || !portfolioId) return;
    
    console.log('=== LOADING SESSIONS ===');
    console.log('User ID:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        throw error;
      }

      console.log('Raw sessions from database:', data);

      const formattedSessions = data.map(session => ({
        id: session.id,
        session_name: session.session_name || 'Ny Session',
        created_at: session.created_at,
        is_active: session.is_active || false,
      }));

      console.log('Formatted sessions:', formattedSessions);
      setSessions(formattedSessions);

      // Only auto-load if no session is currently selected
      if (!currentSessionId && formattedSessions.length > 0) {
        const mostRecentSession = formattedSessions[0];
        console.log('Auto-loading most recent session:', mostRecentSession.id);
        setCurrentSessionId(mostRecentSession.id);
        await loadMessages(mostRecentSession.id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda sessioner. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, portfolioId, toast, loadMessages]);

  const loadSession = useCallback(async (sessionId: string) => {
    console.log('=== MANUALLY LOADING SESSION ===');
    console.log('Loading chat session:', sessionId);
    console.log('Current session before change:', currentSessionId);
    
    // Immediately clear messages and set new session
    setMessages([]);
    setCurrentSessionId(sessionId);
    
    // Load messages for the selected session
    await loadMessages(sessionId);
    
    console.log('Session loaded successfully');
    toast({
      title: "Chat laddad",
      description: "Din sparade chat har laddats.",
    });
  }, [currentSessionId, loadMessages, toast]);

  const createNewSession = useCallback(async (customName?: string, shouldSendInitialMessage?: string) => {
    console.log('=== CREATE NEW SESSION ===');
    console.log('User:', user?.id);
    console.log('Portfolio ID:', portfolioId);
    console.log('Custom name:', customName);
    console.log('Should send initial message:', shouldSendInitialMessage);
    
    if (!user || !portfolioId) {
      console.log('Cannot create session: missing user or portfolio');
      return;
    }
    
    setIsLoading(true);
    
    // Clear messages immediately for new session
    console.log('Clearing messages for new session');
    setMessages([]);
    
    try {
      const now = new Date();
      const sessionName = customName || `Chat ${now.toLocaleDateString('sv-SE')} ${now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
      
      console.log('Session name:', sessionName);
      
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

      console.log('New session created:', data);

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
        console.log('Sending initial message:', shouldSendInitialMessage);
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
  }, [user, portfolioId, toast]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) {
      console.error('Cannot delete session: no authenticated user');
      return;
    }
    
    console.log('=== DELETING SESSION ===');
    console.log('Session to delete:', sessionId);
    console.log('Current user ID:', user.id);
    console.log('Current session ID:', currentSessionId);
    
    try {
      // First, let's check if the session exists and belongs to the user
      console.log('Checking if session exists and belongs to user...');
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

      console.log('Session found and belongs to user:', sessionCheck);

      // Delete all messages in the session first
      console.log('Deleting messages...');
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
      console.log('Deleting session...');
      const { error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (sessionError) {
        console.error('Error deleting session:', sessionError);
        throw new Error(`Kunde inte radera session: ${sessionError.message}`);
      }

      console.log('Session deletion completed successfully');

      // Update local state immediately
      setSessions(prev => {
        const updated = prev.filter(session => session.id !== sessionId);
        console.log('Updated sessions after deletion:', updated.map(s => ({ id: s.id, name: s.session_name })));
        return updated;
      });
      
      // If we deleted the current session, clear it and load the most recent one
      if (currentSessionId === sessionId) {
        console.log('Deleted session was the current session, clearing and loading next...');
        setCurrentSessionId(null);
        setMessages([]);
        
        // Load the most recent remaining session if any
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          const mostRecent = remainingSessions[0];
          console.log('Loading most recent remaining session:', mostRecent.id);
          await loadSession(mostRecent.id);
        } else {
          console.log('No remaining sessions to load');
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

  const editSessionName = useCallback(async (sessionId: string, newName: string) => {
    if (!user) {
      console.error('Cannot edit session name: no authenticated user');
      return;
    }
    
    console.log('=== EDITING SESSION NAME ===');
    console.log('Session ID:', sessionId);
    console.log('New name:', newName);
    console.log('User ID:', user.id);
    
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

      console.log('Session name updated successfully');

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
    console.log('=== SENDING MESSAGE DEBUG ===');
    console.log('Content:', content);
    console.log('User:', user?.id);
    console.log('Current session ID:', currentSessionId);
    console.log('Portfolio ID:', portfolioId);
    
    if (!user || !content.trim()) {
      console.log('Missing user or empty content');
      return;
    }

    // Check usage limit with better error handling
    const canSendMessage = checkUsageLimit('ai_message');
    const isPremium = subscription?.subscribed;
    const currentUsage = usage?.ai_messages_count || 0;
    const dailyLimit = 5;

    if (!canSendMessage && !isPremium) {
      console.log('Usage limit reached:', { currentUsage, dailyLimit, isPremium });
      toast({
        title: "Daglig gräns nådd",
        description: `Du har använt alla dina ${dailyLimit} gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.`,
        variant: "destructive",
      });
      return;
    }

    // If no session exists, create one and send message
    if (!currentSessionId) {
      console.log('No session exists, creating session and sending message...');
      await createNewSessionAndSendMessage(content);
      return;
    }

    console.log('Sending message to existing session');
    await sendMessageToSession(content);
  }, [user, currentSessionId, checkUsageLimit, subscription, usage, toast, portfolioId]);

  const createNewSessionAndSendMessage = useCallback(async (messageContent: string) => {
    console.log('=== CREATE SESSION AND SEND MESSAGE ===');
    console.log('User:', user?.id);
    console.log('Portfolio ID:', portfolioId);
    console.log('Message to send:', messageContent);
    
    if (!user || !portfolioId) {
      console.log('Cannot create session: missing user or portfolio');
      return;
    }
    
    setIsLoading(true);
    
    // Clear messages immediately when creating new session
    console.log('Clearing messages for new session');
    setMessages([]);
    
    try {
      const now = new Date();
      const sessionName = `Chat ${now.toLocaleDateString('sv-SE')} ${now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
      
      console.log('Creating session with name:', sessionName);
      
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

      console.log('New session created:', data);

      const newSession = {
        id: data.id,
        session_name: data.session_name || sessionName,
        created_at: data.created_at,
        is_active: data.is_active || false,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      
      console.log('Session state updated, now sending message...');
      
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
  }, [user, portfolioId, toast]);

  const sendMessageToSession = useCallback(async (content: string, sessionId?: string) => {
    console.log('=== SEND MESSAGE TO SESSION DEBUG ===');
    console.log('Content:', content);
    console.log('User ID:', user?.id);
    console.log('Portfolio ID:', portfolioId);
    console.log('Session ID (param):', sessionId);
    console.log('Current Session ID:', currentSessionId);
    
    const targetSessionId = sessionId || currentSessionId;
    
    if (!user || !targetSessionId) {
      console.log('Cannot send message: missing user or session ID');
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
      console.log('=== CALLING EDGE FUNCTION ===');
      console.log('Function name: portfolio-ai-chat');
      
      // Detect if this is an exchange request
      const isExchangeRequest = /(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av|amerikanska|svenska|europeiska|asiatiska|aktier|innehav)/i.test(content);
      
      console.log('Request payload:', {
        message: content,
        userId: user.id,
        portfolioId,
        sessionId: targetSessionId,
        contextType: 'advisory',
        isExchangeRequest: isExchangeRequest,
      });

      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: content,
          userId: user.id,
          portfolioId,
          sessionId: targetSessionId,
          contextType: 'advisory',
        },
      });

      console.log('=== EDGE FUNCTION RESPONSE ===');
      console.log('Error:', error);
      console.log('Data:', data);

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
      console.log('Incrementing AI usage...');
      const { error: usageError } = await supabase.rpc('increment_ai_usage', {
        _user_id: user.id,
        _usage_type: 'ai_message'
      });

      if (usageError) {
        console.error('Error incrementing usage:', usageError);
      } else {
        console.log('Usage incremented successfully');
        // Fetch updated usage from subscription hook
        if (typeof fetchUsage === 'function') {
          await fetchUsage();
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: {
          analysisType: data.analysisType,
          confidence: data.confidence,
          isExchangeRequest: data.isExchangeRequest || isExchangeRequest,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('Added assistant message to UI');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fel",
        description: `Kunde inte skicka meddelandet: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, portfolioId, currentSessionId, toast]);

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

      console.log('Incrementing analysis usage...');
      const { error: usageError } = await supabase.rpc('increment_ai_usage', {
        _user_id: user.id,
        _usage_type: 'analysis'
      });

      if (usageError) {
        console.error('Error incrementing analysis usage:', usageError);
      } else {
        console.log('Analysis usage incremented successfully');
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
        description: "Du har använt alla dina 5 gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.",
        variant: "destructive",
      });
      return;
    }
    
    await sendMessage(prompt);
  }, [sendMessage, checkUsageLimit, subscription, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Stabilize the loadSessions reference to prevent infinite loops - but only call once
  const hasInitialized = useMemo(() => sessions.length > 0, [sessions.length]);

  // Load sessions when component mounts - but only once!
  useEffect(() => {
    if (user && portfolioId && !hasInitialized) {
      console.log('Component mounted, loading sessions...');
      loadSessions();
    }
  }, [user, portfolioId, hasInitialized, loadSessions]);

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
    editSessionName,
    clearMessages,
    getQuickAnalysis,
  };
};
