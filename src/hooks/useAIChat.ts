
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: {
    analysisType?: string;
    relatedData?: any;
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export const useAIChat = (portfolioId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessage = useCallback(async (message: string, analysisType?: string) => {
    if (!user || !message.trim()) return;

    setIsLoading(true);
    
    // Add user message immediately to UI
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      context: analysisType ? { analysisType } : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Sending enhanced message to AI chat function...');
      
      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message,
          userId: user.id,
          portfolioId,
          chatHistory: messages.slice(-8), // Increased context
          analysisType,
          sessionId: currentSessionId
        }
      });

      if (error) {
        console.error('AI chat function error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        context: {
          analysisType: data.analysisType,
          confidence: data.confidence,
          relatedData: data.relatedData
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update session if exists
      if (currentSessionId) {
        setSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: [...session.messages, userMessage, aiMessage], lastUpdated: new Date().toISOString() }
            : session
        ));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the user message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelandet. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, portfolioId, messages, toast, currentSessionId]);

  const analyzePortfolio = useCallback(async (analysisType: 'risk' | 'diversification' | 'performance' | 'optimization') => {
    if (!user) return;

    setIsAnalyzing(true);
    
    const analysisPrompts = {
      risk: "Analysera riskerna i min portfölj detaljerat och ge specifika rekommendationer för riskhantering",
      diversification: "Utvärdera diversifieringen i min portfölj och föreslå förbättringar",
      performance: "Analysera prestandan för mina investeringar och jämför med marknaden",
      optimization: "Föreslå optimeringar för min portfölj baserat på mina mål och riskprofil"
    };

    await sendMessage(analysisPrompts[analysisType], analysisType);
    setIsAnalyzing(false);
  }, [sendMessage, user]);

  const createNewSession = useCallback(async (name: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: user.id,
          session_name: name,
          context_data: { portfolioId }
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        id: data.id,
        name: data.session_name,
        messages: [],
        lastUpdated: data.created_at
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(data.id);
      setMessages([]);

      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa ny session.",
        variant: "destructive",
      });
    }
  }, [user, portfolioId, toast]);

  const loadSession = useCallback(async (sessionId: string) => {
    if (!user) return;

    try {
      const { data: chatHistory, error } = await supabase
        .from('portfolio_chat_history')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const sessionMessages: ChatMessage[] = chatHistory.map(msg => ({
        id: msg.id,
        role: msg.message_type as 'user' | 'assistant',
        content: msg.message,
        timestamp: msg.created_at,
        context: msg.context_data as any
      }));

      setMessages(sessionMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda session.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
  }, []);

  const getQuickAnalysis = useCallback(async (question: string) => {
    await sendMessage(question, 'quick_analysis');
  }, [sendMessage]);

  return {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    isAnalyzing,
    sendMessage,
    analyzePortfolio,
    createNewSession,
    loadSession,
    clearMessages,
    getQuickAnalysis
  };
};
