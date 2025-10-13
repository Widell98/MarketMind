import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Compass,
  PieChart,
  MessageSquare,
  Search,
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface GuideMessage {
  id: string;
  type: 'welcome' | 'guide' | 'interactive';
  title: string;
  content: React.ReactNode;
  buttons?: GuideButton[];
  isBot: true;
}

interface GuideButton {
  text: string;
  action: 'prompt' | 'navigate' | 'demo';
  value: string;
  icon?: React.ReactNode;
  description?: string;
}

interface GuideBotProps {
  onPromptExample: (prompt: string) => void;
  onNavigate: (path: string) => void;
  onShowDemo: (demoType: string) => void;
}

const WELCOME_MESSAGE: GuideMessage = {
  id: 'guide-welcome',
  type: 'welcome',
  title: 'Market Mind Guide',
  content: (
    <div className="space-y-3">
      <p>Hej 👋 Jag är här för att visa dig hur Market Mind funkar!</p>
      <p>
        Vill du att vi ska testa hur du kan få AI att skapa en investeringsidé åt dig, och sedan lägga till den i din portfölj?
      </p>
    </div>
  ),
  buttons: [
    {
      text: 'Ja, visa mig!',
      action: 'prompt',
      value: 'Ge mig tre investeringscase inom hållbar energi och hjälp mig välja det bästa för min riskprofil',
      icon: <Sparkles className="w-4 h-4" />,
      description: 'Testa AI-chatten med ett exempelprompt'
    },
    {
      text: 'Hur funkar AI-chatten?',
      action: 'demo',
      value: 'ai-chat',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Lär dig grunderna för AI-assistenten'
    },
    {
      text: 'Hur lägger jag till i portföljen?',
      action: 'navigate',
      value: '/portfolio-implementation',
      icon: <PieChart className="w-4 h-4" />,
      description: 'Lär dig hantera din portfölj'
    },
    {
      text: 'Hur hittar jag andras case?',
      action: 'navigate', 
      value: '/stock-cases',
      icon: <Search className="w-4 h-4" />,
      description: 'Utforska community-innehåll'
    }
  ],
  isBot: true
};

const GUIDE_FLOWS: Record<string, GuideMessage> = {
  'ai-chat': {
    id: 'guide-ai-chat',
    type: 'guide',
    title: 'Så fungerar AI-chatten',
    content: (
      <div className="space-y-4">
        <div className="space-y-2">
          <p>
            🤖 <span className="font-semibold text-foreground">AI Portfolio Assistent</span> hjälper dig med:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="select-none">•</span>
              <span>
                <span className="font-semibold text-foreground">Personliga råd</span> baserat på din riskprofil
              </span>
            </li>
            <li className="flex gap-2">
              <span className="select-none">•</span>
              <span>
                <span className="font-semibold text-foreground">Portföljanalys</span> och optimeringsförslag
              </span>
            </li>
            <li className="flex gap-2">
              <span className="select-none">•</span>
              <span>
                <span className="font-semibold text-foreground">Marknadsinsikter</span> och trendanalys
              </span>
            </li>
            <li className="flex gap-2">
              <span className="select-none">•</span>
              <span>
                <span className="font-semibold text-foreground">Investeringsidéer</span> anpassade för dig
              </span>
            </li>
          </ul>
        </div>
        <p className="text-ai-text-muted">
          💡 <span className="font-semibold text-foreground">Tips:</span> Var specifik i dina frågor för bästa svar!
        </p>
      </div>
    ),
    buttons: [
      {
        text: 'Testa med exempelfråga',
        action: 'prompt',
        value: 'Analysera min portföljs risk och ge förslag på hur jag kan diversifiera bättre',
        icon: <MessageSquare className="w-4 h-4" />
      },
      {
        text: 'Visa fler funktioner',
        action: 'demo',
        value: 'more-features',
        icon: <ArrowRight className="w-4 h-4" />
      }
    ],
    isBot: true
  },
  'more-features': {
    id: 'guide-more-features',
    type: 'guide',
    title: 'Fler funktioner att utforska',
    content: (
      <div className="space-y-4">
        <p className="font-semibold text-foreground">🎯 Upptäck mer av Market Mind:</p>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-lg leading-6">📊</span>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Portföljöversikt</p>
              <p>Se hela din investeringsresa</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-lg leading-6">📈</span>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Aktiefall &amp; Analyser</p>
              <p>Community-driven investeringsidéer</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-lg leading-6">🔍</span>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Marknadsanalys</p>
              <p>Håll koll på trender</p>
            </div>
          </li>
        </ul>
      </div>
    ),
    buttons: [
      {
        text: 'Visa min portfölj',
        action: 'navigate',
        value: '/portfolio-implementation',
        icon: <PieChart className="w-4 h-4" />
      },
      {
        text: 'Utforska aktiefall',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        text: 'Tillbaka till start',
        action: 'demo',
        value: 'welcome',
        icon: <Compass className="w-4 h-4" />
      }
    ],
    isBot: true
  }
};

const GuideBot: React.FC<GuideBotProps> = ({ onPromptExample, onNavigate, onShowDemo }) => {
  const [currentMessage, setCurrentMessage] = React.useState<GuideMessage>(WELCOME_MESSAGE);

  const handleButtonClick = (button: GuideButton) => {
    switch (button.action) {
      case 'prompt':
        onPromptExample(button.value);
        break;
      case 'navigate':
        onNavigate(button.value);
        break;
      case 'demo':
        if (button.value === 'welcome') {
          setCurrentMessage(WELCOME_MESSAGE);
        } else {
          const flow = GUIDE_FLOWS[button.value as keyof typeof GUIDE_FLOWS];
          if (flow) {
            setCurrentMessage(flow);
          }
        }
        onShowDemo(button.value);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border border-ai-border/50 bg-ai-surface shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-ai-border/60">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(32,82,149,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(20,66,114,0.12),_transparent_55%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-ai-border/60 bg-white/80 text-primary shadow-[0_10px_25px_rgba(20,66,114,0.12)] backdrop-blur-sm dark:border-ai-border/60 dark:bg-ai-surface-muted/80 dark:text-ai-text-muted">
                <Compass className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ai-text-muted">
                  Market Mind
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-foreground">
                    {currentMessage.title}
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-ai-border/60 bg-ai-surface-muted/80 px-3 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ai-text-muted"
                  >
                    Hjälpläge
                  </Badge>
                </div>
                <p className="text-sm text-ai-text-muted">
                  Få guidning steg för steg eller hoppa direkt till en demo.
                </p>
              </div>
            </div>

            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Interaktiv
            </Badge>
          </div>

          <div className="text-sm leading-6 text-ai-text-muted">
            {typeof currentMessage.content === 'string' ? (
              <p className="whitespace-pre-line">{currentMessage.content}</p>
            ) : (
              currentMessage.content
            )}
          </div>

          {currentMessage.buttons && (
            <div className="grid gap-3 sm:grid-cols-2">
              {currentMessage.buttons.map((button, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleButtonClick(button)}
                  className="group relative flex h-full w-full items-start gap-3 overflow-hidden rounded-2xl border border-ai-border/60 bg-ai-surface-muted/80 px-4 py-4 text-left text-[14px] font-semibold text-foreground shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-ai-surface focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                >
                  <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(32,82,149,0.16),_transparent_55%)]" />
                  </div>
                  {button.icon && (
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-ai-border/50 bg-white/80 text-primary shadow-sm transition group-hover:border-primary/40 group-hover:text-primary dark:bg-ai-surface">
                      {React.isValidElement(button.icon)
                        ? React.cloneElement(button.icon, {
                            className: 'h-4 w-4',
                          })
                        : button.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-1 text-left break-words">
                    <span className="block text-sm font-semibold text-foreground">
                      {button.text}
                    </span>
                    {button.description && (
                      <span className="block text-xs leading-snug text-ai-text-muted">
                        {button.description}
                      </span>
                    )}
                  </div>
                  <span className="ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-transparent bg-white/80 text-[12px] text-primary transition group-hover:border-primary/40 group-hover:bg-white">
                    →
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GuideBot;