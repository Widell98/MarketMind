
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import { LogIn, MessageSquare, Brain, ArrowLeft, Lock, Sparkles } from 'lucide-react';
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
  const { riskProfile } = useRiskProfile();
  const navigate = useNavigate();

  const { messages,
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

  const handleBackToPortfolio = () => {
    navigate('/portfolio-implementation');
  };

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

    const handlePrefillChatInput = (event: CustomEvent) => {
      const { message } = event.detail;
      setInput(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

    window.addEventListener('createStockChat', handleCreateStockChat as EventListener);
    window.addEventListener('sendExamplePrompt', handleExamplePrompt as EventListener);
    window.addEventListener('prefillChatInput', handlePrefillChatInput as EventListener);

    return () => {
      window.removeEventListener('createStockChat', handleCreateStockChat as EventListener);
      window.removeEventListener('sendExamplePrompt', handleExamplePrompt as EventListener);
      window.removeEventListener('prefillChatInput', handlePrefillChatInput as EventListener);
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
    <div className="flex flex-col h-[75vh] lg:h-[80vh] xl:h-[85vh] bg-transparent overflow-hidden relative">
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

      {user && riskProfile && (
        <div className="border-b bg-background p-2 sm:p-3">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={handleBackToPortfolio}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tillbaka till Min Portfölj</span>
              <span className="sm:hidden">Min Portfölj</span>
            </Button>
          </div>
        </div>
      )}

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
          {/* Show dimmed chat interface in background */}
          <div className="flex-1 overflow-hidden opacity-30 pointer-events-none">
            <div className="h-full flex flex-col">
              {/* Demo chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-muted rounded-2xl px-4 py-3">
                    <p className="text-sm">Hej! Jag är din AI Portfolio Assistent. Jag hjälper dig med investeringsråd, portföljanalys och marknadsinsikter.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl px-4 py-3">
                    <p className="text-sm">Kan du analysera min portfölj?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-muted rounded-2xl px-4 py-3">
                    <p className="text-sm">För att ge dig en personlig portföljanalys behöver du logga in så jag kan komma åt din investeringsprofil och aktuella innehav.</p>
                  </div>
                </div>
              </div>
              
              {/* Demo input area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input 
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" 
                    placeholder="Skriv ditt meddelande här..."
                    disabled
                  />
                  <Button disabled>Skicka</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Login overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="max-w-md mx-4 p-6 shadow-xl border-2 border-primary/20">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto shadow-lg">
                    <Lock className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Lås upp AI-assistenten</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Logga in för att få tillgång till personliga investeringsråd, portföljanalys och AI-drivna marknadsinsikter
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                    <Brain className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">Personlig AI-rådgivning baserat på din riskprofil</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Realtidsanalys av din portfölj</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Smarta investeringsrekommendationer</span>
                  </div>
                </div>

                <Button 
                  onClick={() => window.location.href = '/auth'} 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium"
                  size="lg"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Logga in för att fortsätta
                </Button>

                <p className="text-xs text-muted-foreground">
                  Gratis att komma igång • Inga dolda avgifter
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChat;
