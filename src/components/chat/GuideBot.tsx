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
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface GuideMessage {
  id: string;
  type: 'welcome' | 'guide' | 'interactive';
  title: string;
  content: string;
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
  content: 'Hej 👋 Jag är här för att visa dig hur Market Mind funkar!\n\nVill du att vi ska testa hur du kan få AI att skapa en investeringsidé åt dig, och sedan lägga till den i din portfölj?',
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
    content: '🤖 **AI Portfolio Assistent** hjälper dig med:\n\n• **Personliga råd** baserat på din riskprofil\n• **Portföljanalys** och optimeringsförslag\n• **Marknadsinsikter** och trendanalys\n• **Investeringsidéer** anpassade för dig\n\n💡 **Tips:** Var specifik i dina frågor för bästa svar!',
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
    content: '🎯 **Upptäck mer av Market Mind:**\n\n📊 **Portföljöversikt** - Se hela din investeringsresa\n📈 **Aktiefall & Analyser** - Community-driven investeringsidéer\n🔍 **Marknadsanalys** - Håll koll på trender\n📚 **Lärande** - Förbättra dina investeringskunskaper',
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
        value: '/stock-cases',
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
      <Card className="border border-ai-border/60 bg-ai-surface shadow-sm">
        <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-ai-border/70 bg-ai-surface-muted/70 text-foreground">
            <Compass className="h-5 w-5" />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-ai-text-muted" />
                <span className="text-sm font-semibold text-foreground">
                  {currentMessage.title}
                </span>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full border border-ai-border/60 bg-ai-surface-muted/70 px-2.5 py-0 text-[11px] font-medium uppercase tracking-[0.12em] text-ai-text-muted"
              >
                Guide
              </Badge>
            </div>

            <p className="whitespace-pre-line text-sm leading-6 text-ai-text-muted">
              {currentMessage.content}
            </p>

            {currentMessage.buttons && (
              <div className="grid gap-3 sm:grid-cols-2">
                {currentMessage.buttons.map((button, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleButtonClick(button)}
                    className="group flex w-full items-start gap-3 rounded-ai-md border border-ai-border/60 bg-ai-surface-muted/70 px-4 py-3 text-left text-[14px] font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-ai-border hover:bg-ai-surface focus-visible:ring-1 focus-visible:ring-ai-border/60 focus-visible:ring-offset-0"
                  >
                    {button.icon && (
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-ai-border/60 bg-ai-surface text-foreground transition group-hover:border-ai-border group-hover:bg-ai-surface group-hover:text-foreground">
                        {React.isValidElement(button.icon)
                          ? React.cloneElement(button.icon, {
                              className: 'h-4 w-4 text-foreground',
                            })
                          : button.icon}
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-1 text-left">
                      <span className="block text-sm font-semibold text-foreground">
                        {button.text}
                      </span>
                      {button.description && (
                        <span className="block text-xs leading-snug text-ai-text-muted">
                          {button.description}
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GuideBot;