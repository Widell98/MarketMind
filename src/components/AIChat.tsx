
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import { LogIn, MessageSquare, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  initialStock?: string | null;
  initialMessage?: string | null;
}

const AIChat = ({ portfolioId, initialStock, initialMessage }: AIChatProps) => {
  const { user } = useAuth();
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Auto-scroll when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Handle initial stock and message from URL parameters
    if (initialStock && initialMessage && !hasInitialized) {
      console.log('Creating initial chat session for stock:', initialStock);
      createNewSession(initialStock, initialMessage);
      setHasInitialized(true);
    }
  }, [initialStock, initialMessage, hasInitialized, createNewSession]);

  useEffect(() => {
    // Load the most recent session on component mount
    if (portfolioId) {
      // loadSessions(); // Ensure sessions are loaded when component mounts
    }
  }, [portfolioId]);

  useEffect(() => {
    // Handle navigation state for creating new sessions
    if (location.state?.createNewSession) {
      const { sessionName, initialMessage } = location.state;
      createNewSession(sessionName, initialMessage);
      
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, createNewSession]);

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
    if (!input.trim() || isLoading || !user) return;

    const messageToSend = input.trim();
    setInput('');
    
    await sendMessage(messageToSend);
  };

  const handleNewSession = async () => {
    if (!user) return;
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

      {user ? (
        <>
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
        </>
      ) : (
        <>
          {/* Demo messages for unauthenticated users */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg">
                  <Brain className="w-10 h-10 text-primary-foreground" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground">AI Portfolio Assistent</h3>
                  <p className="text-muted-foreground">
                    Få personliga investeringsråd, portföljanalys och marknadsinsikter med hjälp av AI
                  </p>
                </div>

                <Card className="p-4 bg-muted/30 border-dashed">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium mb-1">Exempel på vad du kan fråga:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• "Analysera min portfölj och ge rekommendationer"</li>
                        <li>• "Vilka risker har mina nuvarande innehav?"</li>
                        <li>• "Föreslå bra aktier för min riskprofil"</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Login prompt instead of chat input */}
          <div className="border-t bg-background p-4">
            <div className="max-w-4xl mx-auto">
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                      <LogIn className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="font-semibold text-foreground">Logga in för att chatta</h4>
                      <p className="text-sm text-muted-foreground">Skapa ett konto för att få personliga AI-råd</p>
                    </div>
                  </div>
                  <Button onClick={() => window.location.href = '/auth'} className="flex-shrink-0">
                    <LogIn className="w-4 h-4 mr-2" />
                    Logga in / Skapa konto
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChat;
