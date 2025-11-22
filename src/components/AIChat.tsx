import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import ProfileUpdateConfirmation from './ProfileUpdateConfirmation';
import ChatFolderSidebar from './chat/ChatFolderSidebar';
import ChatDocumentManager from './chat/ChatDocumentManager';
import { useChatDocuments } from '@/hooks/useChatDocuments';
import { useToast } from '@/hooks/use-toast';

import { LogIn, MessageSquare, Brain, Lock, Sparkles, Menu, PanelLeftClose, PanelLeft, Crown, Infinity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const { toast } = useToast();
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
  const {
    documents: uploadedDocuments,
    isLoading: isLoadingDocuments,
    isUploading: isUploadingDocument,
    uploadDocument,
    deleteDocument,
  } = useChatDocuments();
  const [input, setInput] = useState('');
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [isGuideSession, setIsGuideSession] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isPremium = subscription?.subscribed;
  const draftStorageKey = useMemo(() => {
    const sessionKey = currentSessionId ?? 'new';
    const portfolioKey = portfolioId ?? 'default';
    return `ai-chat-draft:${portfolioKey}:${sessionKey}`;
  }, [currentSessionId, portfolioId]);

  useEffect(() => {
    setSelectedDocumentIds((prev) =>
      prev.filter((id) => uploadedDocuments.some((doc) => doc.id === id && doc.status !== 'failed'))
    );
  }, [uploadedDocuments]);

  const attachedDocuments = useMemo(
    () => uploadedDocuments.filter((doc) => selectedDocumentIds.includes(doc.id)),
    [uploadedDocuments, selectedDocumentIds]
  );

  const handleToggleDocument = useCallback((documentId: string) => {
    const targetDocument = uploadedDocuments.find((doc) => doc.id === documentId);
    if (targetDocument && targetDocument.status !== 'processed') {
      toast({
        title: 'Bearbetning pågår',
        description: 'Vänta tills dokumentet är färdigbearbetat innan du använder det i chatten.',
      });
      return;
    }

    setSelectedDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  }, [uploadedDocuments, toast]);

  const handleRemoveDocument = useCallback((documentId: string) => {
    setSelectedDocumentIds((prev) => prev.filter((id) => id !== documentId));
  }, []);

  const handleUploadDocument = useCallback(async (file: File) => {
    const newDocumentId = await uploadDocument(file);

    if (newDocumentId) {
      setSelectedDocumentIds((prev) =>
        prev.includes(newDocumentId) ? prev : [...prev, newDocumentId]
      );
    }
  }, [setSelectedDocumentIds, uploadDocument]);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    await deleteDocument(documentId);
    setSelectedDocumentIds((prev) => prev.filter((id) => id !== documentId));
  }, [deleteDocument]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedDraft = sessionStorage.getItem(draftStorageKey);
    if (storedDraft && !hasProcessedInitialMessage) {
      setInput(storedDraft);
    }
  }, [draftStorageKey, hasProcessedInitialMessage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (input) {
      sessionStorage.setItem(draftStorageKey, input);
    } else {
      sessionStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, input]);
  useEffect(() => {
    // Handle initial stock and message from URL parameters - but only once
    if (initialStock && initialMessage && !hasProcessedInitialMessage) {
      const startPrefilledSession = async () => {
        await createNewSession(initialStock);

        // Pre-fill the input with the initial message instead of sending it
        const decodedMessage = decodeURIComponent(initialMessage);
        setInput(decodedMessage);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        setHasProcessedInitialMessage(true);

        if (location.search) {
          const newUrl = `${location.pathname}${location.hash ?? ''}`;
          navigate(newUrl, { replace: true, state: location.state });
        }
      };

      void startPrefilledSession();
    }
  }, [
    initialStock,
    initialMessage,
    hasProcessedInitialMessage,
    createNewSession,
    location.pathname,
    location.search,
    location.hash,
    location.state,
    navigate
  ]);
  const hasHandledNavigationSessionRef = useRef(false);

  useEffect(() => {
    const navigationState = location.state as {
      createNewSession?: boolean;
      sessionName?: string;
      initialMessage?: string;
    } | undefined;

    if (navigationState?.createNewSession) {
      if (hasHandledNavigationSessionRef.current) {
        return;
      }

      hasHandledNavigationSessionRef.current = true;

      const {
        sessionName,
        initialMessage
      } = navigationState;
      const startNewSession = async () => {
        await createNewSession(sessionName);

        if (initialMessage) {
          setInput(initialMessage);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }

        const currentUrl = `${location.pathname}${location.search}${location.hash ?? ''}`;
        navigate(currentUrl, { replace: true, state: {} });
      };

      void startNewSession();
    } else {
      hasHandledNavigationSessionRef.current = false;
    }
  }, [
    location.state,
    location.pathname,
    location.search,
    location.hash,
    createNewSession,
    navigate
  ]);
  useEffect(() => {
    const handleCreateStockChat = (event: CustomEvent) => {
      const {
        sessionName,
        message
      } = event.detail;
      const startChat = async () => {
        // Create new session and pre-fill input instead of auto-sending
        await createNewSession(sessionName);
        setInput(message);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      };

      void startChat();
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
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || !user) return;
    const previousInput = input;
    setInput('');
    const wasSent = await sendMessage(trimmedInput, {
      documentIds: selectedDocumentIds,
      documents: attachedDocuments.map((doc) => ({ id: doc.id, name: doc.name })),
    });

    if (!wasSent) {
      setInput(previousInput);
    }
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

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-ai-surface">
            <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-ai-border/60 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                {isMobile && (
                  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-ai-text-muted hover:bg-ai-surface-muted/70 hover:text-foreground"
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
                    className="h-9 w-9 rounded-full text-ai-text-muted hover:bg-ai-surface-muted/70 hover:text-foreground"
                  >
                    {desktopSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                  </Button>
                )}
              </div>

              {/* <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-medium text-foreground sm:text-base">AI-assistent</span>
                  <span className="hidden text-[12px] text-ai-text-muted sm:inline">Marknadsguiden i realtid</span>
                </div>
              </div> */}

              <div className="flex items-center justify-end gap-2">
                {isPremium ? (
                  <TooltipProvider delayDuration={120}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="inline-flex h-7 items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-[11px] font-semibold text-white shadow-sm">
                          <Crown className="h-3.5 w-3.5" aria-hidden />
                          Premium
                          <span className="sr-only"> – Obegränsade meddelanden</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium tracking-wide text-white/80">
                            <Infinity className="h-3 w-3" aria-hidden />
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end" className="text-xs font-medium">
                        Premium – Obegränsade meddelanden
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="hidden rounded-full border border-ai-border/70 bg-ai-surface-muted/60 px-3 py-1 text-xs font-medium text-ai-text-muted sm:inline-flex">
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

              {user && !isGuideSession && (
                <ChatDocumentManager
                  documents={uploadedDocuments}
                  selectedDocumentIds={selectedDocumentIds}
                  onToggleDocument={handleToggleDocument}
                  onUpload={handleUploadDocument}
                  onDelete={handleDeleteDocument}
                  isLoading={isLoadingDocuments}
                  isUploading={isUploadingDocument}
                />
              )}

              {messages.map((message) => {
                const profileUpdates = message.context?.profileUpdates;

                if (!message.context?.requiresConfirmation || !profileUpdates) {
                  return null;
                }

                return (
                  <ProfileUpdateConfirmation
                    key={`${message.id}_confirmation`}
                    profileUpdates={profileUpdates}
                    summary={typeof message.context?.detectedSummary === 'string' ? message.context?.detectedSummary : undefined}
                    onConfirm={() => updateUserProfile(profileUpdates, message.id)}
                    onReject={() => dismissProfileUpdatePrompt(message.id)}
                  />
                );
              })}
            </div>

            {user && !isGuideSession && (
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                quotaExceeded={quotaExceeded}
                inputRef={inputRef}
                attachedDocuments={attachedDocuments.map((doc) => ({
                  id: doc.id,
                  name: doc.name,
                  status: doc.status,
                }))}
                onRemoveDocument={handleRemoveDocument}
                isAttachDisabled={isUploadingDocument || quotaExceeded}
              />
            )}
          </div>
        </>
      ) : (
        <div className="flex w-full min-h-0 flex-col overflow-hidden bg-ai-surface">
          <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="absolute inset-0 flex">
              {!isMobile && (
                <div className="hidden w-[260px] flex-col border-r border-ai-border/60 bg-ai-surface-muted/60 px-4 py-6 md:flex">
                  <h3 className="text-sm font-semibold text-foreground">Senaste konversationer</h3>
                  <div className="mt-4 space-y-3 text-[15px] text-ai-text-muted">
                    <div className="rounded-ai-sm border border-ai-border/50 bg-ai-surface px-3 py-2">
                      <p className="font-medium text-foreground">Portföljanalys</p>
                      <p className="text-xs text-ai-text-muted">Idag</p>
                    </div>
                    <div className="rounded-ai-sm border border-ai-border/50 bg-ai-surface px-3 py-2">
                      <p className="font-medium text-foreground">Tesla uppföljning</p>
                      <p className="text-xs text-ai-text-muted">Igår</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-1 flex-col overflow-y-auto bg-ai-surface px-4 py-8 sm:px-10 lg:px-14">
                <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center space-y-6 py-6 sm:py-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ai-surface-muted/70 text-ai-text-muted">
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
                      <div className="max-w-[80%] rounded-ai-md border border-ai-border/50 bg-ai-bubble px-4 py-3 text-ai-text-muted">
                        Hej! Jag är din AI-assistent och kan analysera portföljer, marknadsläge och ge nästa steg.
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-ai-md border border-ai-border/60 bg-ai-bubble-user px-4 py-3 text-foreground">
                        Kan du sammanfatta min portfölj och vad jag borde fokusera på?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-ai-md border border-ai-border/50 bg-ai-bubble px-4 py-3 text-ai-text-muted">
                        Självklart. Logga in så kan jag använda din profil och ge rekommendationer som passar din risknivå.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-ai-surface/85 px-4 py-6 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-ai-md border border-ai-border/60 bg-ai-surface px-6 py-8 text-center shadow-xl">
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