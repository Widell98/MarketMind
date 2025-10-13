import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Activity, Zap, TrendingUp, Brain } from 'lucide-react';
import ChatMessage from './ChatMessage';
import GuideBot from './GuideBot';
import { useGuideSession } from '@/hooks/useGuideSession';

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

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingSession: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onExamplePrompt?: (prompt: string) => void;
  showGuideBot?: boolean;
}

const ChatMessages = ({
  messages,
  isLoading,
  isLoadingSession,
  messagesEndRef,
  onExamplePrompt,
  showGuideBot = false,
}: ChatMessagesProps) => {
  const {
    shouldShowGuide,
    handlePromptExample,
    handleNavigate,
    handleShowDemo,
    updateGuideSession,
  } = useGuideSession();

  const handleGuidePrompt = React.useCallback(
    (prompt: string) => {
      if (onExamplePrompt) {
        onExamplePrompt(prompt);
        updateGuideSession({ hasSeenWelcome: true });
        return;
      }

      handlePromptExample(prompt);
    },
    [onExamplePrompt, handlePromptExample, updateGuideSession]
  );

  const promptCollections = [
    {
      id: 'portfolio-deep-dive',
      eyebrow: 'Portföljstrategi',
      title: 'Finslipa portföljen',
      prompt: 'Ge mig en komplett analys av min portfölj med rekommendationer för optimering',
      icon: <PieChart className="h-4 w-4" />,
      description: 'Få en genomgång av din portföljs prestanda och struktur',
      highlights: ['Allokering', 'Avkastning', 'Balans'],
    },
    {
      id: 'risk-balance',
      eyebrow: 'Riskkontroll',
      title: 'Säkra balans i risken',
      prompt: 'Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering',
      icon: <Activity className="h-4 w-4" />,
      description: 'Identifiera och minimera risker för en mer balanserad portfölj',
      highlights: ['Stress-test', 'Diversifiering'],
    },
    {
      id: 'ideas',
      eyebrow: 'Investeringsidéer',
      title: 'Bygg nästa move',
      prompt: 'Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil?',
      icon: <Zap className="h-4 w-4" />,
      description: 'Få personliga rekommendationer baserade på din riskprofil',
      highlights: ['Rekommendationer', 'Matchning'],
    },
    {
      id: 'market-pulse',
      eyebrow: 'Marknadspuls',
      title: 'Håll koll på läget',
      prompt: 'Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Håll dig uppdaterad med aktuella marknadstrender',
      highlights: ['Makro', 'Signals'],
    },
  ];

  if (isLoadingSession) {
    return (
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-10 sm:px-6 lg:max-w-4xl lg:px-8 xl:max-w-5xl xl:px-10 2xl:max-w-6xl 2xl:px-12">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-3/4 rounded-ai-sm" />
                <Skeleton className="h-4 w-1/2 rounded-ai-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-9 sm:space-y-10 sm:px-6 lg:max-w-4xl lg:space-y-12 lg:px-8 lg:py-12 xl:max-w-5xl xl:px-10 xl:py-14 2xl:max-w-6xl 2xl:space-y-14 2xl:px-12">
        {showGuideBot && (
          <GuideBot
            onPromptExample={handleGuidePrompt}
            onNavigate={handleNavigate}
            onShowDemo={handleShowDemo}
          />
        )}

        {messages.length === 0 && !isLoading && onExamplePrompt && !showGuideBot && (
          <div className="space-y-7">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#144272]/18 to-[#205295]/28 text-primary shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-colors dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:shadow-none">
                <Brain className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground">Redo när du är</h2>
              <p className="mt-2 text-sm text-ai-text-muted">
                Plocka ett spår eller skriv din egen fråga för att starta konversationen.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              {promptCollections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => onExamplePrompt(collection.prompt)}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[26px] border border-ai-border/50 bg-white/80 p-4 text-left shadow-[0_16px_35px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white/90 hover:shadow-[0_22px_45px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-ai-border/60 dark:bg-ai-surface/90 dark:hover:bg-ai-surface"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ai-text-muted">
                    {collection.eyebrow}
                  </span>
                  <div className="mt-3 flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#144272]/10 text-primary shadow-sm transition-colors group-hover:bg-[#144272]/16 dark:bg-ai-surface-muted/70 dark:text-ai-text-muted">
                      {collection.icon}
                    </span>
                    <div className="flex-1 space-y-1">
                      <span className="block text-base font-semibold text-foreground">
                        {collection.title}
                      </span>
                      <p className="text-sm leading-5 text-ai-text-muted">
                        {collection.description}
                      </p>
                    </div>
                  </div>
                  {collection.highlights && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {collection.highlights.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-ai-border/50 bg-white/70 px-3 py-1 text-[11px] font-medium text-ai-text-muted transition group-hover:border-primary/30 group-hover:text-primary dark:bg-ai-surface"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                    Starta flöde
                    <span className="translate-x-0 transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !isLoading && !onExamplePrompt && !showGuideBot && (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#144272]/20 to-[#205295]/24 text-primary shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-colors dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:shadow-none">
              <Brain className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-lg font-semibold text-foreground">Välkommen till Market Mind</h2>
            <p className="mt-2 text-sm text-ai-text-muted">
              Ställ din första fråga för att börja utforska din portfölj med AI-assistenten.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-[0_10px_25px_rgba(15,23,42,0.08)] ring-1 ring-[#144272]/25 transition-colors dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:ring-transparent dark:shadow-none">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-transparent dark:border-ai-border/70" />
            </div>
            <div className="max-w-[70%] rounded-[18px] border border-[#205295]/22 bg-white/90 px-4 py-3 text-sm text-ai-text-muted shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble">
              Assistenten tänker...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
