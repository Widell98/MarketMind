import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import ProfileUpdateConfirmation from './ProfileUpdateConfirmation';
import ChatFolderSidebar from './chat/ChatFolderSidebar';
import ChatDocumentManager from './chat/ChatDocumentManager';
import { useChatDocuments } from '@/hooks/useChatDocuments';
import { useChatFolders } from '@/hooks/useChatFolders';
import { useToast } from '@/hooks/use-toast';

import { 
  LogIn, MessageSquare, Brain, Lock, Sparkles, 
  PanelLeftClose, PanelLeft, Crown, Infinity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

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
  conversationData?: any;
  createNewSession?: boolean;
  sessionName?: string;
}

const AIChat = ({
  portfolioId,
  initialStock,
  initialMessage,
  showExamplePrompts = true,
  conversationData,
  createNewSession: shouldCreateNewSession,
  sessionName
}: AIChatProps) => {
  const { user } = useAuth();
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
    hasReachedDocumentLimit,
  } = useChatDocuments();

  const { sessions } = useChatFolders(); 
   
  const [input, setInput] = useState('');
  const hasProcessedInitialMessageRef = useRef(false);
   
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [isGuideSession, setIsGuideSession] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
   
  const [conversationContext, setConversationContext] = useState<any>(null);

  const { t } = useLanguage();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isPremium = subscription?.subscribed;
   
  const contextData = location.state?.contextData;
   
  const draftStorageKey = useMemo(() => {
    const sessionKey = currentSessionId ?? 'new';
    const portfolioKey = portfolioId ?? 'default';
    return `ai-chat-draft:${portfolioKey}:${sessionKey}`;
  }, [currentSessionId, portfolioId]);

  const currentSessionName = useMemo(() => {
    if (isGuideSession) return "Guidad tur";
    if (!currentSessionId) return "Ny konversation";
    
    // Using any to bypass potential type mismatch with session_name/name
    const session = sessions?.find(s => s.id === currentSessionId) as any;
    
    return session?.session_name || session?.name || "Pågående konversation";
  }, [currentSessionId, sessions, isGuideSession]);

  useEffect(() => {
    if (conversationData) {
      setConversationContext(conversationData);
    }
  }, [conversationData]);

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

  const handleDocumentLimitClick = useCallback(() => {
    toast({
      title: 'Dokumentgräns nådd',
      description: 'Du kan ha max två uppladdade dokument. Ta bort ett innan du laddar upp ett nytt.',
      variant: 'destructive',
    });
  }, [toast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedDraft = sessionStorage.getItem(draftStorageKey);
    if (storedDraft && !hasProcessedInitialMessageRef.current) {
      setInput(storedDraft);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (input) {
      sessionStorage.setItem(draftStorageKey, input);
    } else {
      sessionStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, input]);

  useEffect(() => {
    const handleSessionInit = async () => {
      if (hasProcessedInitialMessageRef.current || !user) return;

      const state = location.state || {};
      const triggerNewSession = shouldCreateNewSession || state.createNewSession;
      const msg = initialMessage || state.initialMessage;
      const stock = initialStock || state.initialStock;

      if (triggerNewSession) {
        hasProcessedInitialMessageRef.current = true;

        await createNewSession(sessionName);
        
        if (msg) {
          setInput(msg);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
        
        if (conversationData) {
          setConversationContext(conversationData);
        }
        
        navigate(location.pathname, { 
          replace: true, 
          state: { 
            ...state,                 
            createNewSession: false,  
            initialMessage: undefined 
          } 
        });
        return;
      }

      if (stock && msg) {
        hasProcessedInitialMessageRef.current = true;
        await createNewSession(stock);
        const decodedMessage = decodeURIComponent(msg);
        setInput(decodedMessage);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        
        if (location.search) {
          const newUrl = `${location.pathname}${location.hash ?? ''}`;
          navigate(newUrl, { replace: true });
        }
      }
    };

    void handleSessionInit();
  }, [
    shouldCreateNewSession,
    sessionName,
    initialMessage,
    initialStock,
    conversationData,
    user,
    createNewSession,
    navigate,
    location.pathname,
    location.hash,
    location.search,
    location.state 
  ]);

  useEffect(() => {
    const handleCreateStockChat = (event: CustomEvent) => {
      const { sessionName, message } = event.detail;
      const startChat = async () => {
        await createNewSession(sessionName);
        setInput(message);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      };
      void startChat();
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
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || !user) return;
     
    const previousInput = input;
    setInput('');
     
    const wasSent = await sendMessage(trimmedInput, {
      documentIds: selectedDocumentIds,
      documents: attachedDocuments.map((doc) => ({ id: doc.id, name: doc.name })),
      conversationData: conversationContext
    });

    if (!wasSent) {
      setInput(previousInput);
    }
  };

  const handleNewSession = useCallback(async () => {
    if (!user) return;
    setIsGuideSession(false);
    setConversationContext(null);
    hasProcessedInitialMessageRef.current = false; 
    await createNewSession();
    setInput('');
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [user, createNewSession, isMobile]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    await loadSession(sessionId);
    setConversationContext(null);
    if (isMobile) {
      setSidebarOpen(false);
    } 
  }, [loadSession, isMobile]);

  const handleExamplePrompt = (prompt: string) => {
    if (isGuideSession) {
      setIsGuideSession(false);
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
    className: isMobile ? "w-full min-h-full" : "w-[280px] lg:w-[300px]",
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
          {/* Vänster Sidebar (Desktop) */}
          {!isMobile && !desktopSidebarCollapsed && (
            <ChatFolderSidebar {...sidebarProps} />
          )}

          {/* Main Chat Area */}
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-ai-surface">
            
            {/* --- OPTIMERAD TOOLBAR FÖR MOBIL --- */}
            <div className="border-b border-ai-border/40 bg-ai-surface/50 backdrop-blur-sm sticky top-0 z-10 w-full">
              <div className="mx-auto w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between min-h-[48px] sm:min-h-[50px]">
                
                {/* Vänster del: Historik-toggle och Titel */}
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden flex-1 min-w-0">
                  {isMobile ? (
                    /* Mobil: Sheet för historik */
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-8 sm:w-8 text-ai-text-muted hover:text-foreground flex-shrink-0 -ml-1"
                        >
                          <PanelLeft className="h-5 w-5" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-full max-w-xs p-0 sm:max-w-sm" hideCloseButton>
                          <div className="flex flex-col h-full">
                            <div className="px-4 py-3 border-b border-ai-border/60 bg-ai-surface-muted/40 flex items-center justify-between">
                              <span className="text-sm font-semibold text-foreground">Chat-sessioner</span>
                            </div>
                            <div className="flex-1 overflow-auto">
                              <ChatFolderSidebar {...sidebarProps} />
                            </div>
                          </div>
                      </SheetContent>
                    </Sheet>
                  ) : (
                    /* Desktop: Toggle knapp */
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-ai-text-muted hover:text-foreground flex-shrink-0 -ml-2"
                          >
                            {desktopSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {desktopSidebarCollapsed ? "Visa historik" : "Dölj historik"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Dynamisk Chatt-titel med ikon - kompaktare på mobil */}
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden flex-1 min-w-0">
                    <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                      <MessageSquare className="h-3 w-3" />
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {currentSessionName}
                    </span>
                  </div>
                </div>

                {/* Höger del: Premium/Credits - kompaktare på mobil */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                  {isPremium ? (
                    <TooltipProvider delayDuration={120}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="inline-flex h-6 sm:h-7 items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 sm:px-3 text-[10px] sm:text-[11px] font-semibold text-white shadow-sm cursor-default">
                            <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                            <span className="hidden xs:inline">Premium</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" className="text-xs font-medium">
                          Obegränsade meddelanden
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="rounded-full border border-ai-border/70 bg-ai-surface-muted/60 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-ai-text-muted inline-flex whitespace-nowrap">
                      {remainingCredits}/{totalCredits} <span className="hidden sm:inline ml-1">krediter</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Innehåll: Meddelanden och Input */}
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              {messages.length === 0 && contextData ? (
                <div className="flex flex-col items-center justify-center h-full p-8 space-y-8 animate-in fade-in zoom-in duration-300 overflow-y-auto">
                  <div className="text-center space-y-3 max-w-lg">
                    <div className="flex justify-center mb-4">
                       <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                         <Sparkles className="w-8 h-8 text-primary" />
                       </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                      {contextData.title}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {contextData.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl px-4">
                    {contextData.prompts.map((prompt: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleExamplePrompt(prompt)}
                        className="flex flex-col text-left p-5 rounded-xl border border-ai-border/60 bg-ai-surface hover:bg-ai-surface-muted hover:border-primary/30 transition-all duration-200 group shadow-sm hover:shadow-md"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                          {prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ChatMessages
                  messages={messages}
                  isLoading={isLoading}
                  isLoadingSession={isLoadingSession}
                  messagesEndRef={messagesEndRef}
                  onExamplePrompt={showExamplePrompts ? handleExamplePrompt : undefined}
                  showGuideBot={isGuideSession}
                />
              )}

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
                isDocumentLimitReached={hasReachedDocumentLimit}
                onDocumentLimitClick={handleDocumentLimitClick}
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
