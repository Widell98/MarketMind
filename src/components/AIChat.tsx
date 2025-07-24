import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import ChatFolderSidebar from './chat/ChatFolderSidebar';
import { LogIn, MessageSquare, Brain, ArrowLeft, Lock, Sparkles, Crown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
  const isMobile = useIsMobile();

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
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    await loadSession(sessionId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const SidebarContent = () => (
    <ChatFolderSidebar
      currentSessionId={currentSessionId}
      onLoadSession={handleLoadSession}
      onDeleteSession={deleteSession}
      onEditSessionName={editSessionName}
      onNewSession={handleNewSession}
      isLoadingSession={isLoadingSession}
      className={isMobile ? "w-full" : ""}
    />
  );

  return (
    <div className="flex h-[90vh] lg:h-[92vh] xl:h-[95vh] bg-transparent overflow-hidden">
      {user ? (
        <>
          {/* Desktop Sidebar - Folders and Sessions */}
          {!isMobile && (
            <div className="w-80 border-r bg-background">
              <SidebarContent />
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            {user && riskProfile && (
              <div className="border-b bg-background p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Mobile Menu Button */}
                    {isMobile && (
                      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Menu className="w-4 h-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0">
                          <SidebarContent />
                        </SheetContent>
                      </Sheet>
                    )}
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

                  {/* Compact Usage Display for Free Users */}
                  {!isPremium && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      <span>{currentUsage}/{dailyLimit} meddelanden</span>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={handlePremiumClick}
                        className="text-xs h-6 px-2 ml-1"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Button>
                    </div>
                  )}

                  {/* Premium Badge */}
                  {isPremium && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-1">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              isLoadingSession={isLoadingSession}
              messagesEndRef={messagesEndRef}
            />

            {/* Chat Input */}
            <ChatInput
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              quotaExceeded={quotaExceeded}
              inputRef={inputRef}
            />
          </div>
        </>
      ) : (
        <>
          {/* Show dimmed chat interface in background */}
          <div className="flex-1 overflow-hidden opacity-30 pointer-events-none relative">
            <div className="flex h-full">
              {/* Demo Sidebar - Hidden on mobile */}
              {!isMobile && (
                <div className="w-80 border-r bg-background p-4">
                  <h3 className="font-semibold mb-4">AI Chattar</h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="text-sm font-medium">Portföljanalys</div>
                      <div className="text-xs text-muted-foreground">Idag</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="text-sm font-medium">Aktieråd Tesla</div>
                      <div className="text-xs text-muted-foreground">Igår</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Demo Chat */}
              <div className="flex-1 flex flex-col">
                {/* Demo chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 md:space-y-6">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] md:max-w-[75%] bg-muted rounded-2xl px-3 py-2 md:px-4 md:py-3">
                      <p className="text-sm leading-relaxed">Hej! Jag är din AI Portfolio Assistent. Jag hjälper dig med investeringsråd, portföljanalys och marknadsinsikter.</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] md:max-w-[75%] bg-primary text-primary-foreground rounded-2xl px-3 py-2 md:px-4 md:py-3">
                      <p className="text-sm leading-relaxed">Kan du analysera min portfölj?</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] md:max-w-[75%] bg-muted rounded-2xl px-3 py-2 md:px-4 md:py-3">
                      <p className="text-sm leading-relaxed">För att ge dig en personlig portföljanalys behöver du logga in så jag kan komma åt din investeringsprofil och aktuella innehav.</p>
                    </div>
                  </div>
                </div>
                
                {/* Demo input area */}
                <div className="border-t p-3 md:p-4">
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" 
                      placeholder="Skriv ditt meddelande här..."
                      disabled
                    />
                    <Button disabled size={isMobile ? "sm" : "default"}>Skicka</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="max-w-md w-full p-4 md:p-6 shadow-xl border-2 border-primary/20">
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
