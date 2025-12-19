import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import AIChatLayout from '@/components/AIChatLayout';
import ChatFolderSidebar from '@/components/chat/ChatFolderSidebar'; // NYTT: Importera sidebaren
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Button } from '@/components/ui/button';
import { AlertCircle, User } from 'lucide-react';

const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const { activePortfolio } = usePortfolio();

  // NYTT: State för den nya layouten och sessionshantering
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

  // NYTT: Handlers för sidebaren
  const handleLoadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Valfritt: Uppdatera URL eller rensa sökparametrar om man byter till en sparad session
    // navigate(`/ai-chatt?session=${sessionId}`, { replace: true });
  };

  const handleCreateNewSession = () => {
    setCurrentSessionId(null);
    navigate('/ai-chatt'); // Återställ URL till ren "ny chat"
  };

  // Placeholder-handlers (Dessa bör kopplas till din useAIChat/useChatSessions logik)
  const handleDeleteSession = async (sessionId: string) => {
    console.log("Delete session requested:", sessionId);
    // TODO: Implementera radering här eller hämta funktionen från en hook
  };

  const handleEditSessionName = (sessionId: string, newName: string) => {
    console.log("Rename session requested:", sessionId, newName);
    // TODO: Implementera namnbyte här eller hämta funktionen från en hook
  };

  useEffect(() => {
    // Om det är en vanlig chat och riskprofil saknas -> redirect.
    // MEN om det är en prediction chat -> stanna kvar (behöver ingen profil).
    if (user && !riskProfileLoading && !riskProfile && !isPredictionChat) {
      navigate('/portfolio-advisor');
    }
  }, [user, riskProfile, riskProfileLoading, navigate, isPredictionChat]);

  if (user && riskProfileLoading) {
    return (
      <Layout>
        {/* NYTT: Skickar med en tom sidebar eller isSidebarOpen={false} för att hålla layouten snygg vid laddning */}
        <AIChatLayout isSidebarOpen={false}>
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <div className="flex flex-col items-center gap-4 text-ai-text-muted">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ai-border border-t-transparent" />
              <p className="text-sm font-medium">{t('aiChat.loading')}</p>
            </div>
          </div>
        </AIChatLayout>
      </Layout>
    );
  }

  // Visa varning om riskprofil saknas ENDAST om det inte är en prediction chat
  if (user && !riskProfile && !isPredictionChat) {
    return (
      <Layout>
        <AIChatLayout isSidebarOpen={false}>
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <div className="max-w-md rounded-ai-md border border-ai-border/70 bg-ai-surface-muted/40 p-6 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ai-surface">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{t('aiChat.riskProfileRequired')}</h3>
              <p className="mt-2 text-sm text-ai-text-muted">{t('aiChat.riskProfileDesc')}</p>
              <Button onClick={() => navigate('/portfolio-advisor')} className="mt-6">
                <User className="mr-2 h-4 w-4" />
                {t('aiChat.createRiskProfile')}
              </Button>
            </div>
          </div>
        </AIChatLayout>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* NYTT: Integrera layouten med sidebar */}
      <AIChatLayout
        isSidebarOpen={isSidebarOpen}
        sidebar={
          <ChatFolderSidebar
            currentSessionId={currentSessionId}
            onLoadSession={handleLoadSession}
            onCreateNewSession={handleCreateNewSession}
            onDeleteSession={handleDeleteSession}
            onEditSessionName={handleEditSessionName}
            // onLoadGuideSession={...} // Om du vill ha guiden
          />
        }
      >
        <AIChat
          portfolioId={activePortfolio?.id}
          initialStock={stockName}
          initialMessage={finalMessage}
          conversationData={state?.conversationData} 
          createNewSession={state?.createNewSession}
          sessionName={state?.sessionName}
          
          // NYTT: Props för att styra layouten inifrån AIChat (ChatHeader)
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          
          // NYTT: Skicka valt session ID till chatten
          sessionId={currentSessionId}
        />
      </AIChatLayout>
    </Layout>
  );
};

export default AIChatPage;
