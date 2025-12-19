import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
// Vi tar bort Layout importen för att köra "fullscreen" mode utan dubbla menyer
import AIChat from '@/components/AIChat';
import AIChatLayout from '@/components/AIChatLayout';
import ChatFolderSidebar from '@/components/chat/ChatFolderSidebar';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, ArrowLeft } from 'lucide-react';

const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const { activePortfolio } = usePortfolio();

  // State för den nya layouten och sessionshantering
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Hämta data från antingen URL eller Navigation State
  const stockName = searchParams.get('stock');
  const urlMessage = searchParams.get('message');
  
  // Extrahera state från PredictionMarketDetail navigeringen
  const state = location.state as { 
    initialMessage?: string;
    conversationData?: any;
    createNewSession?: boolean;
    sessionName?: string;
  } | null;

  const finalMessage = state?.initialMessage || urlMessage;
  const isPredictionChat = !!state?.conversationData?.predictionMarket;

  // Handlers för sidebaren
  const handleLoadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleCreateNewSession = () => {
    setCurrentSessionId(null);
    navigate('/ai-chatt');
  };

  const handleDeleteSession = async (sessionId: string) => {
    console.log("Delete session requested:", sessionId);
  };

  const handleEditSessionName = (sessionId: string, newName: string) => {
    console.log("Rename session requested:", sessionId, newName);
  };

  // Navigera tillbaka till huvudappen (om man vill lämna helskärmsläget)
  const handleBackToApp = () => {
    navigate('/');
  };

  useEffect(() => {
    if (user && !riskProfileLoading && !riskProfile && !isPredictionChat) {
      navigate('/portfolio-advisor');
    }
  }, [user, riskProfile, riskProfileLoading, navigate, isPredictionChat]);

  if (user && riskProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium">{t('aiChat.loading')}</p>
        </div>
      </div>
    );
  }

  if (user && !riskProfile && !isPredictionChat) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <AlertCircle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">{t('aiChat.riskProfileRequired')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t('aiChat.riskProfileDesc')}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => navigate('/portfolio-advisor')} className="w-full">
              <User className="mr-2 h-4 w-4" />
              {t('aiChat.createRiskProfile')}
            </Button>
            <Button variant="ghost" onClick={handleBackToApp} className="w-full">
              Tillbaka
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Vi använder en div med h-screen istället för <Layout> för att undvika dubbla navbars.
    // Detta ger en "app-liknande" känsla för chatten.
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      
      {/* Optional: En minimalistisk top-bar eller "tillbaka"-knapp om man vill kunna lämna chatten enkelt */}
      {/* <div className="flex items-center px-4 py-2 border-b border-border/40">
        <Button variant="ghost" size="sm" onClick={handleBackToApp} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Button>
      </div> 
      */}

      <div className="flex-1 min-h-0 relative">
        <AIChatLayout
          isSidebarOpen={isSidebarOpen}
          sidebar={
            <div className="flex h-full flex-col">
              {/* Vi kan lägga in en "Hem"-knapp högst upp i sidebaren för navigering */}
              <div className="px-3 pt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToApp} 
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-xs font-medium">Tillbaka till översikt</span>
                </Button>
              </div>
              
              <div className="flex-1 min-h-0">
                <ChatFolderSidebar
                  currentSessionId={currentSessionId}
                  onLoadSession={handleLoadSession}
                  onCreateNewSession={handleCreateNewSession}
                  onDeleteSession={handleDeleteSession}
                  onEditSessionName={handleEditSessionName}
                />
              </div>
            </div>
          }
        >
          <AIChat
            portfolioId={activePortfolio?.id}
            initialStock={stockName}
            initialMessage={finalMessage}
            conversationData={state?.conversationData} 
            createNewSession={state?.createNewSession}
            sessionName={state?.sessionName}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            sessionId={currentSessionId}
          />
        </AIChatLayout>
      </div>
    </div>
  );
};

export default AIChatPage;
