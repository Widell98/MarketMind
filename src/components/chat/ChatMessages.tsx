import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  const [isUserNearBottom, setIsUserNearBottom] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  const handleScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isNearBottom = distanceFromBottom < 160;
    setIsUserNearBottom(isNearBottom);
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight <= clientHeight;
    setIsUserNearBottom(isAtBottom);
  }, []);

  React.useEffect(() => {
    if (!isUserNearBottom) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, isUserNearBottom, messagesEndRef]);

  const examplePrompts = [
    {
      title: 'Portföljanalys',
      prompt: 'Ge mig en komplett analys av min portfölj med rekommendationer för optimering',
      icon: <PieChart className="h-4 w-4" />,
      description: 'Översikt av portföljens prestanda',
    },
    {
      title: 'Riskhantering',
      prompt: 'Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering',
      icon: <Activity className="h-4 w-4" />,
      description: 'Identifiera och minska risker',
    },
    {
      title: 'Investeringsförslag',
      prompt: 'Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil?',
      icon: <Zap className="h-4 w-4" />,
      description: 'förslag efter din riskprofil',
    },
    {
      title: 'Marknadsinsikter',
      prompt: 'Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Uppdateras om marknadstrender',
    },
  ];

  if (isLoadingSession) {
    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        {/* ÄNDRING: Bredare på lg och xl skärmar */}
        <div className="mx-auto w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl space-y-5 px-4 py-8 sm:px-5 sm:py-9">
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
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto w-full"
      style={{ scrollbarGutter: 'stable' }}
    >
      {/* OPTIMERAD: Edge-to-edge på mobil, max-width på större skärmar */}
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {showGuideBot && (
          <GuideBot
            onPromptExample={handleGuidePrompt}
            onNavigate={handleNavigate}
            onShowDemo={handleShowDemo}
          />
        )}

        {messages.length === 0 && !isLoading && onExamplePrompt && !showGuideBot && (
          <div className="flex flex-col items-center justify-center py-4 sm:py-6 md:py-10">
            {/* Hero Section - kompaktare på mobil */}
            <div className="text-center mb-6 sm:mb-8 md:mb-10 max-w-xl w-full px-3 sm:px-4">
              <div className="mx-auto mb-4 sm:mb-5 md:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-[0_20px_50px_rgba(20,82,149,0.3)] transition-all duration-300 hover:scale-105 dark:shadow-[0_20px_50px_rgba(20,82,149,0.2)]">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Redo när du är
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-ai-text-muted leading-relaxed">
                Välj ett av förslagen nedan eller ställ din egen fråga för att starta konversationen med AI-assistenten.
              </p>
            </div>

            {/* Example Prompts Grid - bättre spacing på mobil */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => onExamplePrompt(example.prompt)}
                  className="group relative overflow-hidden rounded-xl border border-[#144272]/20 bg-gradient-to-br from-white to-white/95 p-3.5 sm:p-4 md:p-5 text-left shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(20,82,149,0.15)] dark:from-ai-surface dark:to-ai-surface/95 dark:border-ai-border/60 dark:shadow-none dark:hover:border-primary/40 h-full flex flex-col"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  <div className="relative flex flex-col gap-2 sm:gap-3 items-center flex-1 text-center">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md dark:from-primary/20 dark:to-primary/10">
                      {example.icon}
                    </div>
                    <div className="space-y-1 w-full">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground transition-colors group-hover:text-primary text-center">
                        {example.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-ai-text-muted leading-relaxed text-center">
                        {example.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !isLoading && !onExamplePrompt && !showGuideBot && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 md:py-16">
            <div className="text-center max-w-md w-full px-3 sm:px-4">
              <div className="mx-auto mb-4 sm:mb-5 md:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-[0_20px_50px_rgba(20,82,149,0.3)] transition-all duration-300 hover:scale-105 dark:shadow-[0_20px_50px_rgba(20,82,149,0.2)]">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Välkommen till Market Mind
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-ai-text-muted leading-relaxed">
                Ställ din första fråga för att börja utforska din portfölj med AI-assistenten.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5 sm:gap-3" role="status" aria-live="polite">
            <div className="mt-1 flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm ring-1 ring-[#144272]/25 dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:ring-transparent">
              <span className="relative flex h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 items-center justify-center">
                <span className="absolute h-full w-full rounded-full border border-primary/30 opacity-70 [animation:ping_1.6s_ease-out_infinite]" />
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 animate-spin rounded-full border-2 border-primary/50 border-t-transparent" />
              </span>
            </div>
            <div className="max-w-[85%] sm:max-w-[80%] rounded-[16px] sm:rounded-[18px] bg-white/95 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-ai-text-muted shadow-sm backdrop-blur-sm border border-[#205295]/10 dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble">
              <span className="inline-flex items-center gap-1.5 sm:gap-2">
                <span>Assistenten tänker</span>
                <span className="flex items-center gap-1" aria-hidden>
                  <span className="h-1 w-1 rounded-full bg-primary/70 [animation:pulse_1.4s_ease-in-out_infinite]" />
                  <span className="h-1 w-1 rounded-full bg-primary/70 [animation:pulse_1.4s_ease-in-out_infinite] [animation-delay:140ms]" />
                  <span className="h-1 w-1 rounded-full bg-primary/70 [animation:pulse_1.4s_ease-in-out_infinite] [animation-delay:280ms]" />
                </span>
              </span>
              <span className="sr-only">Assistenten tänker...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
