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
        {/* ÄNDRING: max-w-3xl och mx-auto för centrering */}
        <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 sm:px-5 sm:py-9">
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
      {/* ÄNDRING: Begränsad maxbredd (max-w-3xl) och centrerad (mx-auto) */}
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        {showGuideBot && (
          <GuideBot
            onPromptExample={handleGuidePrompt}
            onNavigate={handleNavigate}
            onShowDemo={handleShowDemo}
          />
        )}

        {messages.length === 0 && !isLoading && onExamplePrompt && !showGuideBot && (
          <div className="flex flex-col items-center justify-center py-6 sm:py-10">
            {/* Hero Section */}
            <div className="text-center mb-8 sm:mb-10 max-w-xl w-full px-4">
              <div className="mx-auto mb-5 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-[0_20px_50px_rgba(20,82,149,0.3)] transition-all duration-300 hover:scale-105 dark:shadow-[0_20px_50px_rgba(20,82,149,0.2)]">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Redo när du är
              </h1>
              <p className="text-sm sm:text-base text-ai-text-muted leading-relaxed">
                Välj ett av förslagen nedan eller ställ din egen fråga för att starta konversationen med AI-assistenten.
              </p>
            </div>

            {/* Example Prompts Grid - Nu centrerad och max-bredd */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => onExamplePrompt(example.prompt)}
                  className="group relative overflow-hidden rounded-xl border border-[#144272]/20 bg-gradient-to-br from-white to-white/95 p-4 sm:p-5 text-left shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(20,82,149,0.15)] dark:from-ai-surface dark:to-ai-surface/95 dark:border-ai-border/60 dark:shadow-none dark:hover:border-primary/40 h-full flex flex-col"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  <div className="relative flex flex-col gap-3 items-start flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md dark:from-primary/20 dark:to-primary/10">
                      {example.icon}
                    </div>
                    <div className="space-y-1 w-full">
                      <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                        {example.title}
                      </h3>
                      <p className="text-xs text-ai-text-muted leading-relaxed">
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
          <div className="flex flex-col items-center justify-center py-10 sm:py-16">
            <div className="text-center max-w-md w-full px-4">
              <div className="mx-auto mb-5 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-[0_20px_50px_rgba(20,82,149,0.3)] transition-all duration-300 hover:scale-105 dark:shadow-[0_20px_50px_rgba(20,82,149,0.2)]">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Välkommen till Market Mind
              </h1>
              <p className="text-sm sm:text-base text-ai-text-muted leading-relaxed">
                Ställ din första fråga för att börja utforska din portfölj med AI-assistenten.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3" role="status" aria-live="polite">
            <div className="mt-1 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm ring-1 ring-[#144272]/25 dark:bg-ai-surface-muted/70 dark:text-ai-text-muted dark:ring-transparent">
              <span className="relative flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center">
                <span className="absolute h-full w-full rounded-full border border-primary/30 opacity-70 [animation:ping_1.6s_ease-out_infinite]" />
                <span className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-primary/50 border-t-transparent" />
              </span>
            </div>
            <div className="max-w-[85%] rounded-[18px] bg-white/95 px-4 py-3 text-sm text-ai-text-muted shadow-sm backdrop-blur-sm border border-[#205295]/10 dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-bubble">
              <span className="inline-flex items-center gap-2">
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
