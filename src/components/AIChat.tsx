
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';

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

interface AIChatProps {
  portfolioId?: string;
}

const AIChat = ({ portfolioId }: AIChatProps) => {
  const {
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
    clearMessages,
    getQuickAnalysis,
  } = useAIChat(portfolioId);

  const [input, setInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load the most recent session on component mount
    if (portfolioId) {
      // loadSessions(); // Ensure sessions are loaded when component mounts
    }
  }, [portfolioId]);

  useEffect(() => {
    const handleCreateStockChat = (event: CustomEvent) => {
      const { sessionName, message } = event.detail;
      createNewSession(sessionName, message);
    };

    const handleExamplePrompt = (event: CustomEvent) => {
      const { message } = event.detail;
      setInput(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

    window.addEventListener('createStockChat', handleCreateStockChat as EventListener);
    window.addEventListener('sendExamplePrompt', handleExamplePrompt as EventListener);

    return () => {
      window.removeEventListener('createStockChat', handleCreateStockChat as EventListener);
      window.removeEventListener('sendExamplePrompt', handleExamplePrompt as EventListener);
    };
  }, [createNewSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();
    setInput('');
    
    await sendMessage(messageToSend);
  };

  const handleNewSession = async () => {
    await createNewSession();
    setInput('');
  };

  return (
    <div className="flex flex-col h-[75vh] lg:h-[80vh] xl:h-[85vh] bg-transparent overflow-hidden">
      <ChatHeader
        showSessions={showSessions}
        setShowSessions={setShowSessions}
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={isLoading}
        onNewSession={handleNewSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
      />

      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        isLoadingSession={isLoadingSession}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        quotaExceeded={quotaExceeded}
        inputRef={inputRef}
      />
    </div>
  );
};

export default AIChat;
