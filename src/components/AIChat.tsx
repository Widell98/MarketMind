import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import ProfileUpdateConfirmation from './ProfileUpdateConfirmation';
import ChatFolderSidebar from './chat/ChatFolderSidebar';

import { LogIn, MessageSquare, Brain, Lock, Sparkles, Menu, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    profileUpdates?: Record<string, unknown>;
    requiresConfirmation?: boolean;
  };
}
interface AIChatProps {
  portfolioId?: string;
  initialStock?: string | null;
  initialMessage?: string | null;
  showExamplePrompts?: boolean;
}
const AIChat = ({
  portfolioId,
  initialStock,
  initialMessage,
  showExamplePrompts = true
}: AIChatProps) => {
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const {
    messages,
    currentSessionId,
    isLoading,
    quotaExceeded,
    isLoadingSession,
    sendMessage,
    createNewSession,
    loadSession,
    deleteSession,
    deleteSessionsBulk,
    editSessionName,
    clearMessages,
    dismissProfileUpdatePrompt,
    updateUserProfile,
    usage,
    subscription,
    remainingCredits,
    totalCredits
  } = useAIChat(portfolioId);
  const [input, setInput] = useState('');
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [isGuideSession, setIsGuideSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const isPremium = subscription?.subscribed;
  useEffect(() => {
    // Auto-scroll when messages change
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  useEffect(() => {
    // Handle initial stock and message from URL parameters - but only once
    if (initialStock && initialMessage && !hasProcessedInitialMessage) {
      createNewSession(initialStock);

      // Pre-fill the input with the initial message instead of sending it
      const decodedMessage = decodeURIComponent(initialMessage);
      setInput(decodedMessage);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setHasProcessedInitialMessage(true);
    }
  }, [initialStock, initialMessage, hasProcessedInitialMessage, createNewSession]);
  useEffect(() => {
    // Handle navigation state for creating new sessions - always create new session when requested
    if (location.state?.createNewSession) {
      const {
        sessionName,
        initialMessage
      } = location.state;
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
      const {
        sessionName,
        message
      } = event.detail;

      // Create new session and pre-fill input instead of auto-sending
      createNewSession(sessionName);
      setInput(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };
    const handleExamplePrompt = (event: CustomEvent) => {
      const {
        message
      } = event.detail;
      setInput(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };
    const handlePrefillChatInput = (event: CustomEvent) => {
      const {
        message
      } = event.detail;
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
  const handleNewSession = useCallback(async () => {
    if (!user) return;
    setIsGuideSession(false);
    await createNewSession();
    setInput('');
    setHasProcessedInitialMessage(false); // Reset for new session
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [user, createNewSession, isMobile]);
  const handleLoadSession = useCallback(async (sessionId: string) => {
    await loadSession(sessionId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [loadSession, isMobile]);
  const handleExamplePrompt = (prompt: string) => {
    // Exit guide session when user starts using AI chat
    if (isGuideSession) {
      setIsGuideSession(false);
      // Create a new regular session when user starts chatting
      handleNewSession();
      setTimeout(() => {
        setInput(prompt);
        inputRef.current?.focus();
      }, 200);
    } else {
      setInput(prompt);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };
  const handleLoadGuideSession = useCallback(() => {
    // Clear regular chat and show guide
    setIsGuideSession(true);
    clearMessages();
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [clearMessages, isMobile]);
  const sidebarProps = useMemo(() => ({
    currentSessionId: isGuideSession ? 'guide-session' : currentSessionId,
    onLoadSession: (sessionId: string) => {
      setIsGuideSession(false);
      handleLoadSession(sessionId);
    },
    onDeleteSession: deleteSession,
    onBulkDeleteSessions: deleteSessionsBulk,
    onEditSessionName: editSessionName,
    onLoadGuideSession: handleLoadGuideSession,
    onCreateNewSession: handleNewSession,
    className: isMobile ? "w-full min-h-full" : "w-[300px] xl:w-[320px]",
  }), [
    isGuideSession,
    currentSessionId,
    handleLoadSession,
    deleteSession,
    deleteSessionsBulk,
    editSessionName,
    handleLoadGuideSession,
    handleNewSession,
    isMobile,
  ]);
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {user ? (
        <>
          {!isMobile && !desktopSidebarCollapsed && (
            <ChatFolderSidebar {...sidebarProps} />
          )}

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-transparent">
            <header className="relative z-10 grid grid-cols-1 gap-3 border-b border-white/60 bg-white/80 px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:px-6 dark:border-ai-border/60 dark:bg-ai-surface/85 dark:shadow-none">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <div className="flex items-center gap-2">
                  {isMobile && (
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full border border-white/60 bg-white/70 text-ai-text-muted shadow-sm transition-all hover:border-transparent hover:bg-white hover:text-foreground dark:border-ai-border/60 dark:bg-ai-surface-muted/70"
                        >
                          <Menu className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-full max-w-xs p-0 sm:max-w-sm">
                        <ChatFolderSidebar {...sidebarProps} />
                      </SheetContent>
                    </Sheet>
                  )}

                  {!isMobile && (
                    <Button
                      onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full border border-white/60 bg-white/70 text-ai-text-muted shadow-sm transition-all hover:border-transparent hover:bg-white hover:text-foreground dark:border-ai-border/60 dark:bg-ai-surface-muted/70"
                    >
                      {desktopSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                  )}

                  <span className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 shadow-sm dark:border-ai-border/60 dark:bg-ai-surface-muted/70 dark:text-ai-text-muted sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]" />
                    Aktiv
                  </span>
                </div>

                {!isPremium && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition-colors dark:border-ai-border/60 dark:bg-ai-surface-muted/70 dark:text-ai-text-muted sm:hidden">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-primary shadow-[0_0_10px_rgba(59,130,246,0.45)]" />
                    {remainingCredits}/{totalCredits} krediter
                  </span>
                )}
              </div>

              <div className="flex flex-col items-start gap-1 text-left sm:items-center sm:text-center">
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Market Mind</span>
                <span className="text-base font-semibold text-foreground sm:text-lg">AI-portföljcoach</span>
                <span className="text-xs text-slate-500 sm:text-sm dark:text-ai-text-muted">Personliga insikter med en Apple-inspirerad känsla</span>
              </div>

              <div className="hidden items-center justify-end gap-2 sm:flex">
                {!isPremium && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-ai-border/60 dark:bg-ai-surface-muted/70 dark:text-ai-text-muted">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-primary shadow-[0_0_10px_rgba(59,130,246,0.45)]" />
                    {remainingCredits}/{totalCredits} krediter kvar
                  </span>
                )}
              </div>
            </header>

            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                isLoadingSession={isLoadingSession}
                messagesEndRef={messagesEndRef}
                onExamplePrompt={showExamplePrompts ? handleExamplePrompt : undefined}
                showGuideBot={isGuideSession}
              />

              {messages.map((message) => {
                const profileUpdates = message.context?.profileUpdates;

                if (!message.context?.requiresConfirmation || !profileUpdates) {
                  return null;
                }

                return (
                  <ProfileUpdateConfirmation
                    key={`${message.id}_confirmation`}
                    profileUpdates={profileUpdates}
                    onConfirm={() => updateUserProfile(profileUpdates, message.id)}
                    onReject={() => dismissProfileUpdatePrompt(message.id)}
                  />
                );
              })}
            </div>

            {!isGuideSession && (
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                quotaExceeded={quotaExceeded}
                inputRef={inputRef}
              />
            )}
          </div>
        </>
      ) : (
        <div className="flex w-full min-h-0 flex-col overflow-hidden bg-transparent">
          <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="absolute inset-0 flex">
              {!isMobile && (
                <div className="hidden w-[260px] flex-col border-r border-white/70 bg-white/70 px-4 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors md:flex dark:border-ai-border/60 dark:bg-ai-surface-muted/60 dark:shadow-none">
                  <h3 className="text-sm font-semibold text-foreground">Senaste konversationer</h3>
                  <div className="mt-4 space-y-3 text-[15px] text-ai-text-muted">
                    <div className="rounded-[18px] border border-white/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm transition-colors dark:rounded-ai-sm dark:border-ai-border/50 dark:bg-ai-surface">
                      <p className="font-medium text-foreground">Portföljanalys</p>
                      <p className="text-xs text-ai-text-muted">Idag</p>
                    </div>
                    <div className="rounded-[18px] border border-white/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm transition-colors dark:rounded-ai-sm dark:border-ai-border/50 dark:bg-ai-surface">
                      <p className="font-medium text-foreground">Tesla uppföljning</p>
                      <p className="text-xs text-ai-text-muted">Igår</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-1 flex-col overflow-y-auto bg-transparent px-4 py-8 sm:px-10 lg:px-14">
                <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center space-y-6 py-6 sm:py-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/80 text-ai-text-muted shadow-sm backdrop-blur-sm dark:border-ai-border/60 dark:bg-ai-surface-muted/70 dark:shadow-none">
                        <Sparkles className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="space-y-2 text-center">
                      <h2 className="text-xl font-semibold text-foreground">Utforska Market Minds AI-assistent</h2>
                      <p className="text-sm text-ai-text-muted">
                        Se hur dialogen fungerar innan du loggar in. Dina riktiga portföljinsikter låses upp när du autentiserar dig.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 text-[15px]">
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-[20px] border border-white/60 bg-white/85 px-4 py-3 text-ai-text-muted shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:rounded-ai-md dark:border-ai-border/50 dark:bg-ai-bubble">
                        Hej! Jag är din AI-assistent och kan analysera portföljer, marknadsläge och ge nästa steg.
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-[20px] border border-white/60 bg-gradient-to-br from-white to-[#f6f9ff] px-4 py-3 text-foreground shadow-[0_20px_55px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble-user">
                        Kan du sammanfatta min portfölj och vad jag borde fokusera på?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-[20px] border border-white/60 bg-white/85 px-4 py-3 text-ai-text-muted shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:rounded-ai-md dark:border-ai-border/50 dark:bg-ai-bubble">
                        Självklart. Logga in så kan jag använda din profil och ge rekommendationer som passar din risknivå.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 px-4 py-6 backdrop-blur-xl transition-colors dark:bg-ai-surface/85">
              <div className="w-full max-w-md rounded-[26px] border border-white/70 bg-white/85 px-6 py-8 text-center shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-surface dark:shadow-xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ai-surface-muted/70 text-ai-text-muted">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Logga in för att fortsätta</h3>
                <p className="mt-2 text-sm text-ai-text-muted">
                  Skapa en gratis profil för att låsa upp personliga analyser, riskinsikter och nästa steg för din portfölj.
                </p>
                <div className="mt-6 space-y-3 text-left text-[14px] text-ai-text-muted">
                  <div className="flex items-center gap-3">
                    <Brain className="h-4 w-4 text-foreground" />
                    <span>Rådgivning baserat på din riskprofil</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-foreground" />
                    <span>Sparade konversationer och rekommendationer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-foreground" />
                    <span>Dagliga insikter om marknadsläget</span>
                  </div>
                </div>
                <Button
                  onClick={() => (window.location.href = '/auth')}
                  className="mt-8 w-full rounded-ai-sm bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Logga in
                </Button>
                <p className="mt-3 text-xs text-ai-text-muted">Det är kostnadsfritt att komma igång</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AIChat;