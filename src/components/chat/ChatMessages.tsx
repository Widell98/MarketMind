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
  const { shouldShowGuide, handlePromptExample, handleNavigate, handleShowDemo } = useGuideSession();

  const examplePrompts = [
    {
      title: 'Portföljanalys',
      prompt: 'Ge mig en komplett analys av min portfölj med rekommendationer för optimering',
      icon: <PieChart className="h-4 w-4" />,
      description: 'Få en genomgång av din portföljs prestanda och struktur',
    },
    {
      title: 'Riskhantering',
      prompt: 'Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering',
      icon: <Activity className="h-4 w-4" />,
      description: 'Identifiera och minimera risker för en mer balanserad portfölj',
    },
    {
      title: 'Investeringsförslag',
      prompt: 'Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil?',
      icon: <Zap className="h-4 w-4" />,
      description: 'Få personliga rekommendationer baserade på din riskprofil',
    },
    {
      title: 'Marknadsinsikter',
      prompt: 'Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Håll dig uppdaterad med aktuella marknadstrender',
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
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 lg:max-w-4xl lg:space-y-9 lg:px-8 lg:py-10 xl:max-w-5xl xl:px-10 xl:py-12 2xl:max-w-6xl 2xl:space-y-10 2xl:px-12">
        {showGuideBot && (
          <GuideBot
            onPromptExample={onExamplePrompt || handlePromptExample}
            onNavigate={handleNavigate}
            onShowDemo={handleShowDemo}
          />
        )}

        {messages.length === 0 && !isLoading && onExamplePrompt && !showGuideBot && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground">Redo när du är</h2>
              <p className="mt-2 text-sm text-ai-text-muted">
                Välj ett av förslagen eller ställ din egen fråga för att starta konversationen.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-auto justify-start rounded-ai-md border border-ai-border/40 bg-ai-surface/95 px-4 py-3 text-left transition hover:border-primary/30 hover:bg-primary/10"
                  onClick={() => onExamplePrompt(example.prompt)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {example.icon}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground">{example.title}</p>
                      <p className="text-xs text-ai-text-muted">{example.description}</p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !isLoading && !onExamplePrompt && !showGuideBot && (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
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
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ai-border/70 border-t-transparent" />
            </div>
            <div className="max-w-[70%] rounded-ai-md border border-ai-border/40 bg-ai-bubble px-4 py-3 text-sm text-ai-text-muted">
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
