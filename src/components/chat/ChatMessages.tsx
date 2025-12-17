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
        <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-5 sm:py-9 lg:max-w-6xl lg:px-6 lg:py-10 xl:max-w-[85rem] xl:px-10 xl:py-11 2xl:max-w-[95rem] 2xl:px-12 2xl:py-12">
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
      className="flex-1 min-h-0 overflow-y-auto"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className="mx-auto w-full max-w-5xl space-y-3 px-4 py-2 sm:space-y-5 sm:px-5 sm:py-4 lg:max-w-6xl lg:space-y-6 lg:px-6 lg:py-5 xl:max-w-[85rem] xl:space-y-7 xl:px-10 xl:py-6 2xl:max-w-[95rem] 2xl:space-y-8 2xl:px-12 2xl:py-7">
        {showGuideBot && (
          <GuideBot
            onPromptExample={handleGuidePrompt}
            onNavigate={handleNavigate}
            onShowDemo={handleShowDemo}
          />
        )}

        {messages.length === 0 && !isLoading && onExamplePrompt && !showGuideBot && (
          <div className="flex flex-col items-center justify-center py-3 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-4">
            {/* Hero Section - Responsive */}
            <div className="text-center mb-4 sm:mb-5 lg:mb-6 max-w-2xl w-full px-2">
              <div className="mx-auto mb-3 sm:mb-4 lg:mb-5 flex h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-[0_20px_50px_rgba(20,82,149,0.3)] transition-all duration-300 hover:scale-105 dark:shadow-[0_20px_50px_rgba(20,82,149,0.2)]">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Redo när du är
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-ai-text-muted leading-relaxed px-2">
                Välj ett av förslagen nedan eller ställ din egen fråga för att starta konversationen med AI-assistenten.
              </p>
            </div>

            {/* Example Prompts Grid - Responsive */}
            <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-2 lg:gap-3 xl:grid-cols-4 xl:gap-3">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => onExamplePrompt(example.prompt)}
                    className="group relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl border border-[#144272]/20 bg-gradient-to-br from-white to-white/95 p-3 sm:p-4 lg:p-5 text-left shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(20,82,149,0.15)] dark:from-ai-surface dark:to-ai-surface/95 dark:border-ai-border/60 dark:shadow-none dark:hover:border-primary/40 h-full flex flex-col"
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="relative flex flex-col gap-1.5 sm:gap-2 lg:gap-3 items-center text-center flex-1 justify-center">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md dark:from-primary/20 dark:to-primary/10">
                        <div className="scale-100 sm:scale-100">
                          {example.icon}
                        </div>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1 w-full">
                        <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                          {example.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs lg:text-sm text-ai-text-muted leading-relaxed px-0.5 sm:px-1">
                          {example.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && !isLoading && !onExamplePrompt && !showGuideBot && (
          <div className="flex flex-col items-center justify-center py-3 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-4">
            <div className="text-center max-w-2xl w-full px-2">
              <div className="mx-auto mb-3 sm:mb-4 lg:mb-5 flex h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-[0_20px_50px_rgba(20,82,149,0.3)] transition-all duration-300 hover:scale-105 dark:shadow-[0_20px_50px_rgba(20,82,149,0.2)]">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Välkommen till Market Mind
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-ai-text-muted leading-relaxed px-2">
                Ställ din första fråga för att börja utforska din portfölj med AI-assistenten.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div
            className="flex items-start gap-3"
            role="status"
            aria-live="polite"
          >
            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-[0_10px_28px_rgba(15,23,42,0.1)] ring-1 ring-[#144272]/25 transition-colors dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:ring-transparent dark:shadow-none">
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="absolute h-full w-full rounded-full border border-primary/30 opacity-70 [animation:ping_1.6s_ease-out_infinite] dark:border-ai-border/70" />
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/50 border-t-transparent dark:border-ai-border/80" />
              </span>
            </div>
            <div className="max-w-[70%] rounded-[18px] border border-[#205295]/22 bg-white/95 px-4 py-3 text-sm text-ai-text-muted shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-colors dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble">
              <span className="inline-flex items-center gap-2">
                <span>Assistenten tänker</span>
                <span className="flex items-center gap-1" aria-hidden>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70 [animation:pulse_1.4s_ease-in-out_infinite]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70 [animation:pulse_1.4s_ease-in-out_infinite] [animation-delay:140ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70 [animation:pulse_1.4s_ease-in-out_infinite] [animation-delay:280ms]" />
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
