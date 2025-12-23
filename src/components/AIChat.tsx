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
  PanelLeftClose, PanelLeft, Crown, Infinity, Menu, LayoutGrid
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

  const MAX_FREE_QUESTIONS = 2; // Antal gratisfrågor
  const [guestCount, setGuestCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

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
  // På mobil: dölj sidebaren som standard så att chatten visas först
  // På desktop: visa sidebaren som standard
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(isMobile);
  const [showMainNavigation, setShowMainNavigation] = useState(false);

  // Uppdatera sidebar state när skärmstorlek ändras
  useEffect(() => {
    setDesktopSidebarCollapsed(isMobile);
  }, [isMobile]);
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

  // 1. Läs in antal använda frågor vid start (bara för gäster)
  useEffect(() => {
    if (!user) { // Use 'user' from useAuth
      const count = parseInt(localStorage.getItem('marketmind_guest_count') || '0');
      setGuestCount(count);
      if (count >= MAX_FREE_QUESTIONS) {
        setShowPaywall(true);
      }
    } else {
      // Clear guest count if user logs in
      localStorage.removeItem('marketmind_guest_count');
      setGuestCount(0);
      setShowPaywall(false);
    }
  }, [user]); // Depend on 'user'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return; // Removed !user

    // 2. SPÄRR: Om gäst och gränsen är nådd -> Avbryt och visa paywall
    if (!user && guestCount >= MAX_FREE_QUESTIONS) {
      setShowPaywall(true);
      return;
    }
     
    const previousInput = input;
    setInput('');
     
    const wasSent = await sendMessage(trimmedInput, {
      documentIds: selectedDocumentIds,
      documents: attachedDocuments.map((doc) => ({ id: doc.id, name: doc.name })),
      conversationData: conversationContext
    });

    if (!wasSent) {
      setInput(previousInput);
    } else {
      // 3. Om anropet lyckades (inuti din try/catch eller success-block):
      if (!user) { // Only for guests
        const newCount = guestCount + 1;
        setGuestCount(newCount);
        localStorage.setItem('marketmind_guest_count', newCount.toString());

        // Valfritt: Visa paywall direkt efter sista svaret laddat klart
        if (newCount >= MAX_FREE_QUESTIONS) {
          // Du kan sätta en timeout här för att visa rutan efter svaret kommit
          setTimeout(() => setShowPaywall(true), 500); // Added a small delay
        }
      }
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
    showMainNavigation: showMainNavigation,
    onToggleNavigation: () => setShowMainNavigation(!showMainNavigation),
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
    showMainNavigation,
  ]);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* Vänster Sidebar (Desktop & Mobil) - För inloggade användare */}
      {user && !desktopSidebarCollapsed && (
        <ChatFolderSidebar 
          {...sidebarProps} 
          showMainNavigation={showMainNavigation}
          onToggleNavigation={() => setShowMainNavigation(!showMainNavigation)}
          onCloseSidebar={() => setDesktopSidebarCollapsed(true)}
        />
      )}

      {/* Flytande knapp för att visa sidebar (bara när den är dold) - Endast för inloggade användare */}
      {user && desktopSidebarCollapsed && (
        <Button
          onClick={() => setDesktopSidebarCollapsed(false)}
          variant="default"
          size="icon"
          className={cn(
            "fixed top-4 left-4 z-50 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all",
            !isMobile && "h-9 w-9"
          )}
          aria-label="Visa sidebar"
        >
          {isMobile ? <Menu className="h-5 w-5" /> : <PanelLeft className="h-4 w-4" />}
        </Button>
      )}

      {/* Main Chat Area - Tillgänglig för alla (gäster och inloggade) */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-ai-surface">
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
              onToggleSidebar={user ? () => setDesktopSidebarCollapsed(!desktopSidebarCollapsed) : undefined}
              isSidebarCollapsed={user ? desktopSidebarCollapsed : false}
            />
          )}

          {/* Document Manager - Endast för inloggade användare */}
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

          {/* Profile Update Confirmations - Endast för inloggade användare */}
          {user && messages.map((message) => {
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

        {/* Input Area - Tillgänglig för alla (gäster och inloggade) */}
        {!isGuideSession && (
          showPaywall ? (
            // === THE HOOK / PAYWALL UI ===
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-bold text-white mb-2">Gillade du analysen? 🚀</h3>
              <p className="text-slate-300 mb-6 text-sm">
                Du har använt dina testfrågor. Skapa ett gratis konto för att fortsätta chatta obegränsat och låta AI:n analysera din riktiga portfölj.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.href = '/auth?mode=signup'} className="bg-primary text-white">
                  Skapa gratis konto
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/auth?mode=login'}>
                  Logga in
                </Button>
              </div>
            </div>
          ) : (
            // === VANLIG INPUT ===
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
              placeholder={!user ? `Gästläge (${MAX_FREE_QUESTIONS - guestCount} frågor kvar)...` : undefined}
            />
          )
        )}
      </div>
    </div>
  );
};

export default AIChat;
