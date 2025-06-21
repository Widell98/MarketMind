
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const useAIChat = (portfolioId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessage = useCallback(async (message: string) => {
    if (!user || !message.trim()) return;

    setIsLoading(true);
    
    // Add user message immediately to UI
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Sending message to AI chat function...');
      
      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message,
          userId: user.id,
          portfolioId,
          chatHistory: messages.slice(-5) // Send last 5 messages for context
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
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

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
  }, [user, portfolioId, messages, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
};
