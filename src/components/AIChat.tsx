import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useSubscription } from '@/hooks/useSubscription';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import { LogIn, MessageSquare, Brain, ArrowLeft, Lock, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const { usage, subscription } = useSubscription();
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
    editSessionName,
    clearMessages,
    getQuickAnalysis,
  } = useAIChat(portfolioId);

  const [input, setInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  const dailyLimit = 5;
  const currentUsage = usage?.ai_messages_count || 0;
  const isPremium = subscription?.subscribed;

  const handleBackToPortfolio = () => {
    navigate('/portfolio-implementation');
  };

  const handlePremiumClick = () => {
    navigate('/profile', { state: { activeTab: 'membership' } });
  };

  useEffect(() => {
    // Auto-scroll when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Handle initial stock and message from URL parameters - but only once
    if (initialStock && initialMessage && !hasProcessedInitialMessage) {
      console.log('Processing initial chat session for stock:', initialStock);
      createNewSession(initialStock, initialMessage);
      setHasProcessedInitialMessage(true);
    }
  }, [initialStock, initialMessage, hasProcessedInitialMessage, createNewSession]);

  useEffect(() => {
    // Handle navigation state for creating new sessions - always create new session when requested
    if (location.state?.createNewSession) {
      const { sessionName, initialMessage } = location.state;
      
      console.log('Navigation state detected - creating new session:', { sessionName, initialMessage });
      
      // Always create a new session when explicitly requested
      createNewSession(sessionName);
      
      // Pre-fill the input with the initial message instead of sending it
      if (initialMessage) {
        setInput(initialMessage);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
      
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, createNewSession]);

  useEffect(() => {
    const handleCreateStockChat = (event: CustomEvent) => {
      const { sessionName, message } = event.detail;
      
      // Create new session and pre-fill input instead of auto-sending
      createNewSession(sessionName);
      setInput(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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
    setHasProcessedInitialMessage(false); // Reset for new session
  };

  return (
    <div className="flex flex-col h-[90vh] lg:h-[92vh] xl:h-[95vh] bg-transparent overflow-hidden relative">
      <ChatHeader
        showSessions={showSessions}
        setShowSessions={setShowSessions}
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={isLoading}
        onNewSession={handleNewSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onEditSessionName={editSessionName}
      />

      {user && riskProfile && (
        <div className="border-b border-white/10 dark:border-gray-700/10 bg-gradient-to-r from-primary/5 to-blue-600/5 p-2 sm:p-3 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button
              onClick={handleBackToPortfolio}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tillbaka till Min Portfölj</span>
              <span className="sm:hidden">Min Portfölj</span>
            </Button>

            {/* Compact Usage Display for Free Users */}
            {!isPremium && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                <span>{currentUsage}/{dailyLimit} meddelanden</span>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={handlePremiumClick}
                  className="text-xs h-6 px-2 ml-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600 shadow-lg"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Button>
              </div>
            )}

            {/* Premium Badge */}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 shadow-lg">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
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
              <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-6xl mx-auto w-full bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-gray-900/30 dark:to-gray-800/30">
                <div className="flex justify-start">
                  <div className="max-w-[75%] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-sm leading-relaxed">Hej! Jag är din AI Portfolio Assistent. Jag hjälper dig med investeringsråd, portföljanalys och marknadsinsikter.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[75%] bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-sm leading-relaxed">Kan du analysera min portfölj?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[75%] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-sm leading-relaxed">För att ge dig en personlig portföljanalys behöver du logga in så jag kan komma åt din investeringsprofil och aktuella innehav.</p>
                  </div>
                </div>
              </div>
              
              {/* Demo input area */}
              <div className="border-t border-white/10 dark:border-gray-700/10 p-4 max-w-6xl mx-auto w-full">
                <div className="flex gap-2">
                  <input 
                    className="flex-1 rounded-2xl border border-white/20 dark:border-gray-700/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-3 text-sm shadow-lg" 
                    placeholder="Skriv ditt meddelande här..."
                    disabled
                  />
                  <Button disabled className="rounded-2xl bg-gradient-to-r from-primary to-blue-600 px-6 shadow-lg">
                    Skicka
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Login overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <Card className="max-w-md mx-4 p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto shadow-2xl">
                    <Lock className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
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
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/5 to-blue-600/5 rounded-2xl border border-primary/20">
                    <Brain className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">Personlig AI-rådgivning baserat på din riskprofil</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/5 to-emerald-600/5 rounded-2xl border border-green-500/20">
                    <MessageSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Realtidsanalys av din portfölj</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500/5 to-pink-600/5 rounded-2xl border border-purple-500/20">
                    <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-sm text-foreground">Smarta investeringsrekommendationer</span>
                  </div>
                </div>

                <Button 
                  onClick={() => window.location.href = '/auth'} 
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg"
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
