import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatSessions } from '@/contexts/ChatSessionsContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

const DAILY_MESSAGE_CREDITS = 5;

type ProfileUpdates = Record<string, unknown>;

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

  const loadMessages = useCallback(async (sessionId: string, skipClear = false) => {
    if (!user) return;

    console.log('=== LOADING MESSAGES ===');
    console.log('Session ID:', sessionId);
    console.log('User ID:', user.id);

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

      console.log('Raw messages from database:', data);

      const formattedMessages: Message[] = data.map(message => ({
        id: message.id,
        role: message.message_type === 'user' ? 'user' : 'assistant',
        content: message.message,
        timestamp: new Date(message.created_at),
        context: message.context_data
          ? (message.context_data as MessageContext)
          : undefined,
      }));

      console.log('Formatted messages:', formattedMessages);
      console.log('Setting messages to state...');

      if (skipClear) {
        setMessages(formattedMessages);
      } else {
        // Clear messages first, then set new ones
        setMessages([]);
        setTimeout(() => {
          setMessages(formattedMessages);
          console.log('Messages set to state:', formattedMessages.length);
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
  }, [user, toast]);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    console.log('=== LOADING SESSIONS ===');
    console.log('User ID:', user.id);

    try {
      const formattedSessions = await loadChatSessions();

      console.log('Formatted sessions:', formattedSessions);

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
    
    if (!user) {
      console.log('Cannot create session: missing user');
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
  }, [user, toast]);

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
    const dailyLimit = 10;

    if (!canSendMessage && !isPremium) {
      console.log('Usage limit reached:', { currentUsage, dailyLimit, isPremium });
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
    
    if (!user) {
      console.log('Cannot create session: missing user');
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
  }, [user, toast]);

  const sendMessageToSession = useCallback(async (content: string, sessionId?: string) => {
    console.log('=== SEND MESSAGE TO SESSION ===');
    console.log('Content:', content);
    console.log('Session ID to use:', sessionId || currentSessionId);
    console.log('Portfolio ID:', portfolioId);
    
    const targetSessionId = sessionId || currentSessionId;
    
    if (!user || !content.trim() || !targetSessionId) {
      console.log('Missing required data for sending message');
      return;
    }
    
    // Add user message to UI IMMEDIATELY for faster UX (before any async operations)
    const userMessage: Message = {
      id: Date.now().toString() + '_user_temp',
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      
      console.log('Calling Supabase function with chat history...');
      
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
          message: content.trim(),
          userId: user.id,
          portfolioId: portfolioId,
          sessionId: targetSessionId,
          chatHistory: chatHistoryForAPI,
          analysisType: 'general'
        })
      });

      if (streamResponse.status === 429) {
        setQuotaExceeded(true);
        toast({
          title: "Daglig gräns nådd",
          description: "Du har använt alla dina 5 gratis AI-meddelanden för idag. Uppgradera för obegränsad användning.",
          variant: "destructive",
        });
        setMessages(prev => prev.filter(msg => !msg.id.includes('_temp')));
        await fetchUsage();
        return;
      }

      if (!streamResponse.ok) {
        throw new Error(`HTTP error! status: ${streamResponse.status}`);
      }

      console.log('Starting streaming response...');
      
      // Create placeholder AI message for streaming
      const aiMessageId = Date.now().toString() + '_ai_temp';
      const aiMessage: Message = {
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
                    setMessages(prev => prev.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    ));
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
          }
          
        } finally {
          reader.releaseLock();
        }
      }
      
      // After streaming is complete, reload messages from database to get the complete conversation with correct IDs
      console.log('Streaming complete, reloading messages from database...');
      setTimeout(() => {
        loadMessages(targetSessionId, true);
      }, 1000);

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
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSessionId, portfolioId, messages, toast, fetchUsage, incrementUsage, loadMessages]);

  const dismissProfileUpdatePrompt = useCallback(async (messageId: string) => {
    const targetMessage = messages.find(msg => msg.id === messageId);

    if (!targetMessage || !targetMessage.context) {
      return;
    }

    const updatedContext = {
      ...targetMessage.context,
      requiresConfirmation: false,
    };

    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? {
            ...msg,
            context: updatedContext,
          }
        : msg
    ));

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
  }, [messages]);

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
      short: 'Kort (1-3 år)',
      medium: 'Medel (3-7 år)',
      long: 'Lång (7+ år)'
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

  useEffect(() => {
    if (!user || currentSessionId || sessions.length === 0) {
      return;
    }

    const mostRecentSession = sessions[0];
    console.log('Auto-loading most recent session from context:', mostRecentSession.id);
    setCurrentSessionId(mostRecentSession.id);
    loadMessages(mostRecentSession.id);
  }, [user, sessions, currentSessionId, loadMessages]);

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
