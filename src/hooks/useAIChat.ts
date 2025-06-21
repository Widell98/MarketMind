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
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAPIError = (error: any, data: any) => {
    console.error('AI chat function error:', error, data);
    
    // Check for quota exceeded errors
    if (data?.error === 'quota_exceeded' || error.message?.includes('429')) {
      setQuotaExceeded(true);
      toast({
        title: "OpenAI Kvot Överskriden",
        description: "Du har nått din dagliga gräns för AI-användning. Kontrollera din OpenAI-fakturering eller försök igen senare.",
        variant: "destructive",
      });
      return;
    }
    
    if (data?.error === 'rate_limit_exceeded') {
      toast({
        title: "För Många Förfrågningar",
        description: "Vänligen vänta en stund innan du försöker igen.",
        variant: "destructive",
      });
      return;
    }
    
    // Generic error handling
    toast({
      title: "Fel",
      description: data?.message || "Kunde inte skicka meddelandet. Försök igen.",
      variant: "destructive",
    });
  };

  const sendMessage = useCallback(async (message: string, analysisType?: string) => {
    if (!user || !message.trim()) return;
    
    // Check if quota is exceeded
    if (quotaExceeded) {
      toast({
        title: "OpenAI Kvot Överskriden",
        description: "Du har nått din dagliga gräns för AI-användning. Kontrollera din OpenAI-fakturering.",
        variant: "destructive",
      });
      return;
    }

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
        handleAPIError(error, data);
        // Remove the user message if there was an error
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        return;
      }

      if (!data.success) {
        handleAPIError(new Error(data.error || 'Failed to get AI response'), data);
        // Remove the user message if there was an error
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        return;
      }

      // Reset quota exceeded flag on successful response
      setQuotaExceeded(false);

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
      handleAPIError(error, null);
      
      // Remove the user message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [user, portfolioId, messages, toast, currentSessionId, quotaExceeded]);

  const analyzePortfolio = useCallback(async (analysisType: 'risk' | 'diversification' | 'performance' | 'optimization') => {
    if (!user || quotaExceeded) return;

    setIsAnalyzing(true);
    
    const analysisPrompts = {
      risk: "Analysera riskerna i min portfölj detaljerat och ge specifika rekommendationer för riskhantering",
      diversification: "Utvärdera diversifieringen i min portfölj och föreslå förbättringar",
      performance: "Analysera prestandan för mina investeringar och jämför med marknaden",
      optimization: "Föreslå optimeringar för min portfölj baserat på mina mål och riskprofil"
    };

    await sendMessage(analysisPrompts[analysisType], analysisType);
    setIsAnalyzing(false);
  }, [sendMessage, user, quotaExceeded]);

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
    setQuotaExceeded(false); // Reset quota state when clearing
  }, []);

  const getQuickAnalysis = useCallback(async (question: string) => {
    await sendMessage(question, 'quick_analysis');
  }, [sendMessage]);

  const generateInsight = useCallback(async (insightType: string) => {
    if (!user || quotaExceeded) return;

    setIsAnalyzing(true);
    
    try {
      console.log('Generating AI insight:', insightType);
      
      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: `Generera en djupgående ${insightType} för min portfölj med fokus på aktuella marknadsförhållanden`,
          userId: user.id,
          portfolioId,
          analysisType: 'insight_generation',
          insightType
        }
      });

      if (error) {
        handleAPIError(error, data);
        return;
      }

      if (!data.success) {
        handleAPIError(new Error(data.error || 'Failed to generate insight'), data);
        return;
      }

      toast({
        title: "AI Insikt Genererad",
        description: "En ny AI-insikt har skapats baserat på din portfölj.",
      });

      return data;
    } catch (error) {
      console.error('Error generating insight:', error);
      handleAPIError(error, null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, portfolioId, toast, quotaExceeded]);

  const generateMarketAlert = useCallback(async () => {
    if (!user || quotaExceeded) return;

    try {
      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: 'Analysera aktuella marknadsförhållanden och skapa relevanta alerts för min portfölj',
          userId: user.id,
          portfolioId,
          analysisType: 'market_alert_generation'
        }
      });

      if (error || !data.success) {
        handleAPIError(error, data);
        return;
      }
      return data;
    } catch (error) {
      console.error('Error generating market alert:', error);
      handleAPIError(error, null);
    }
  }, [user, portfolioId, quotaExceeded]);

  const generatePredictiveAnalysis = useCallback(async (timeframe: '1month' | '6months' | '2years') => {
    if (!user || quotaExceeded) return;

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: `Skapa en prediktiv analys för min portfölj för ${timeframe} framåt`,
          userId: user.id,
          portfolioId,
          analysisType: 'predictive_analysis',
          timeframe
        }
      });

      if (error || !data.success) {
        handleAPIError(error, data);
        return;
      }
      return data;
    } catch (error) {
      console.error('Error generating predictive analysis:', error);
      handleAPIError(error, null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, portfolioId, quotaExceeded]);

  const generateRebalancingSuggestions = useCallback(async () => {
    if (!user || quotaExceeded) return;

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: 'Analysera min portfölj och föreslå optimala rebalanseringsåtgärder',
          userId: user.id,
          portfolioId,
          analysisType: 'rebalancing_optimization'
        }
      });

      if (error || !data.success) {
        handleAPIError(error, data);
        return;
      }
      return data;
    } catch (error) {
      console.error('Error generating rebalancing suggestions:', error);
      handleAPIError(error, null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, portfolioId, quotaExceeded]);

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
    generateInsight,
    generateMarketAlert,
    generatePredictiveAnalysis,
    generateRebalancingSuggestions
  };
};
