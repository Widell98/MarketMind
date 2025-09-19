
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Activity, Zap, TrendingUp, Brain, Lightbulb } from 'lucide-react';
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

const ChatMessages = ({ messages, isLoading, isLoadingSession, messagesEndRef, onExamplePrompt, showGuideBot = false }: ChatMessagesProps) => {
  const { shouldShowGuide, handlePromptExample, handleNavigate, handleShowDemo } = useGuideSession();
  const examplePrompts = [
    {
      title: "Portföljanalys",
      prompt: "Ge mig en komplett analys av min portfölj med rekommendationer för optimering",
      icon: <PieChart className="w-4 h-4" />,
      description: "Få en genomgång av din portföljs prestanda och struktur"
    },
    {
      title: "Riskhantering", 
      prompt: "Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering",
      icon: <Activity className="w-4 h-4" />,
      description: "Identifiera och minimera risker för en mer balanserad portfölj"
    },
    {
      title: "Investeringsförslag",
      prompt: "Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil?",
      icon: <Zap className="w-4 h-4" />,
      description: "Få personliga rekommendationer baserade på din riskprofil"
    },
    {
      title: "Marknadsinsikter",
      prompt: "Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?",
      icon: <TrendingUp className="w-4 h-4" />,
      description: "Håll dig uppdaterad med aktuella marknadstrender"
    }
  ];

  if (isLoadingSession) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto scroll-mobile">
        <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 items-start max-w-full">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-3/4 max-w-md" />
                <Skeleton className="h-4 w-1/2 max-w-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-mobile">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-6xl mx-auto w-full">
        {/* Guide Bot - Only shown when explicitly in guide session */}
        {showGuideBot && (
          <GuideBot
            onPromptExample={onExamplePrompt || handlePromptExample}
            onNavigate={handleNavigate}
            onShowDemo={handleShowDemo}
          />
        )}
        
        {messages.length === 0 && !isLoading && onExamplePrompt && !showGuideBot && (
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Välkommen till AI Portfolio Assistent!</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                Jag hjälper dig med personliga investeringsråd och portföljanalys. Välj ett förslag nedan eller ställ din egen fråga.
              </p>
            </div>

            {/* Example Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start transition-all duration-200 group rounded-xl bg-background border shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
                  onClick={() => onExamplePrompt(example.prompt)}
                >
                  <div className="flex items-start gap-3 w-full min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-sm group-hover:shadow-md transition-all duration-200 text-primary-foreground">
                      {example.icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-semibold text-sm leading-tight">
                        {example.title}
                      </div>
                      <div className="text-xs leading-relaxed text-muted-foreground break-words">
                        {example.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {messages.length === 0 && !isLoading && !onExamplePrompt && !showGuideBot && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Välkommen till AI Portfolio Assistent!</h2>
            <p className="text-muted-foreground text-base">
              Ställ en fråga för att börja diskutera din portfölj med AI-assistenten
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 items-start max-w-full">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-4 border shadow-sm flex-1 min-w-0 max-w-[75%]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>AI-assistenten tänker...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
