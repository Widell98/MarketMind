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
  ArrowLeft,
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
  topic?: 'stocks' | 'portfolio' | 'education' | 'ai';
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
      value: '/discover',
      icon: <Search className="w-4 h-4" />,
      description: 'Utforska community-innehåll',
      topic: 'stocks'
    },
    {
      text: 'Jag är ny på investeringar',
      action: 'demo',
      value: 'education-center',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Få en snabb introduktion'
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
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
      },
      {
        text: 'Tillbaka till start',
        action: 'demo',
        value: 'welcome',
        icon: <Compass className="w-4 h-4" />
      }
    ],
    isBot: true
  },
  'portfolio-basics': {
    id: 'guide-portfolio-basics',
    type: 'guide',
    title: 'Kom igång med portföljen',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-ai-text-muted">
          📦 Så bygger du en stabil portfölj i Market Mind:
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ai-text-muted">
          <li>Definiera din riskprofil och sparhorisont.</li>
          <li>Använd AI-chatten för att skapa en diversifierad allokering.</li>
          <li>Simulera utfallet innan du lägger till innehav i portföljen.</li>
        </ol>
        <p className="rounded-lg border border-ai-border/60 bg-ai-surface-muted/70 p-3 text-sm text-foreground">
          💡 Tips: Uppdatera din strategi när marknaden förändras och spara dina favoritcase.
        </p>
      </div>
    ),
    buttons: [
      {
        text: 'Visa portföljvyn',
        action: 'navigate',
        value: '/portfolio-implementation',
        icon: <PieChart className="w-4 h-4" />,
        topic: 'portfolio'
      },
      {
        text: 'Be AI ta fram en plan',
        action: 'prompt',
        value: 'Skapa en balanserad portföljstrategi för en medellång sparhorisont',
        icon: <Sparkles className="w-4 h-4" />,
        description: 'Perfekt om du är osäker på var du börjar'
      },
      {
        text: 'Utforska aktier att lägga till',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
      }
    ],
    isBot: true
  },
  'education-center': {
    id: 'guide-education-center',
    type: 'guide',
    title: 'Snabbkurs i investeringar',
    content: (
      <div className="space-y-4 text-sm text-ai-text-muted">
        <p>
          📘 Market Mind Academy hjälper dig förstå begrepp som volatilitet, riskjusterad avkastning och hur du utvärderar ett aktiecase.
        </p>
        <div className="space-y-2">
          <p className="font-semibold text-foreground">Vad vill du lära dig?</p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="select-none">•</span>
              <span>Hur du läser ett aktiediagram</span>
            </li>
            <li className="flex gap-2">
              <span className="select-none">•</span>
              <span>Skillnaden mellan fundamentala och tekniska analyser</span>
            </li>
            <li className="flex gap-2">
              <span className="select-none">•</span>
              <span>Hur du bygger en investeringsstrategi baserat på mål</span>
            </li>
          </ul>
        </div>
      </div>
    ),
    buttons: [
      {
        text: 'Visa utbildningscenter',
        action: 'navigate',
        value: '/learn',
        icon: <BookOpen className="w-4 h-4" />,
        topic: 'education'
      },
      {
        text: 'Lär mig analysera aktier',
        action: 'demo',
        value: 'discover-stocks',
        icon: <TrendingUp className="w-4 h-4" />,
        description: 'Guidade steg för aktieanalys'
      },
      {
        text: 'Tillbaka till start',
        action: 'demo',
        value: 'welcome',
        icon: <Compass className="w-4 h-4" />
      }
    ],
    isBot: true
  },
  'discover-stocks': {
    id: 'guide-discover-stocks',
    type: 'interactive',
    title: 'Utforska aktier & teman',
    content: (
      <div className="space-y-4 text-sm text-ai-text-muted">
        <p>
          🔍 Kombinera AI-chatten med Discover-flödet för att hitta och följa marknadsteman.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ai-border/50 bg-ai-surface-muted/70 p-3">
            <p className="font-semibold text-foreground">1. Hitta case</p>
            <p>Använd Discover för att se vad communityn tittar på just nu.</p>
          </div>
          <div className="rounded-lg border border-ai-border/50 bg-ai-surface-muted/70 p-3">
            <p className="font-semibold text-foreground">2. Fördjupa analysen</p>
            <p>Fråga AI:n om fundamental data, risker och möjligheter.</p>
          </div>
          <div className="rounded-lg border border-ai-border/50 bg-ai-surface-muted/70 p-3">
            <p className="font-semibold text-foreground">3. Lägg till i portföljen</p>
            <p>Skapa en watchlist eller lägg till caset direkt i portföljen.</p>
          </div>
          <div className="rounded-lg border border-ai-border/50 bg-ai-surface-muted/70 p-3">
            <p className="font-semibold text-foreground">4. Följ upp</p>
            <p>Sätt på bevakningar och få notifieringar vid viktiga händelser.</p>
          </div>
        </div>
      </div>
    ),
    buttons: [
      {
        text: 'Gå till Discover',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
      },
      {
        text: 'Be AI analysera ett bolag',
        action: 'prompt',
        value: 'Gör en fundamental och teknisk analys av Investor AB och lista viktiga nyckeltal',
        icon: <Search className="w-4 h-4" />,
        description: 'Perfekt när du hittat något intressant'
      },
      {
        text: 'Tillbaka',
        action: 'demo',
        value: 'education-center',
        icon: <ArrowLeft className="w-4 h-4" />
      }
    ],
    isBot: true
  }
};

const QUICK_ACTIONS: GuideButton[] = [
  {
    text: 'Hitta trendiga aktier',
    action: 'navigate',
    value: '/discover',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Utforska populära teman i Discover',
    topic: 'stocks'
  },
  {
    text: 'Be AI analysera min portfölj',
    action: 'prompt',
    value: 'Analysera min nuvarande portfölj och ge förslag på hur jag kan minska risken men behålla avkastning',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Få skräddarsydd feedback från AI'
  },
  {
    text: 'Skapa en portföljplan',
    action: 'demo',
    value: 'portfolio-basics',
    icon: <PieChart className="w-4 h-4" />,
    description: 'Steg-för-steg guide för att komma igång',
    topic: 'portfolio'
  },
  {
    text: 'Lär mig mer om investering',
    action: 'demo',
    value: 'education-center',
    icon: <BookOpen className="w-4 h-4" />,
    description: 'Snabbkurs och resurser för nybörjare',
    topic: 'education'
  }
];

const resolveNavigationPath = (button: GuideButton) => {
  if (button.topic === 'stocks') {
    return '/discover';
  }

  return button.value;
};

const GuideBot: React.FC<GuideBotProps> = ({ onPromptExample, onNavigate, onShowDemo }) => {
  const [currentMessage, setCurrentMessage] = React.useState<GuideMessage>(WELCOME_MESSAGE);
  const [history, setHistory] = React.useState<GuideMessage[]>([]);

  const handleBack = () => {
    setHistory((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const nextHistory = [...prev];
      const previousMessage = nextHistory.pop();

      if (previousMessage) {
        setCurrentMessage(previousMessage);
      } else {
        setCurrentMessage(WELCOME_MESSAGE);
      }

      return nextHistory;
    });
  };

  const handleButtonClick = (button: GuideButton) => {
    switch (button.action) {
      case 'prompt':
        onPromptExample(button.value);
        break;
      case 'navigate':
        onNavigate(resolveNavigationPath(button));
        break;
      case 'demo':
        if (button.value === 'welcome') {
          setHistory([]);
          setCurrentMessage(WELCOME_MESSAGE);
        } else {
          const flow = GUIDE_FLOWS[button.value as keyof typeof GUIDE_FLOWS];
          if (flow) {
            setHistory((prev) => [...prev, currentMessage]);
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
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-7 w-7 border border-ai-border/50 bg-ai-surface-muted/70 text-ai-text-muted hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Badge
                variant="secondary"
                className="rounded-full border border-ai-border/60 bg-ai-surface-muted/70 px-2.5 py-0 text-[11px] font-medium uppercase tracking-[0.12em] text-ai-text-muted"
              >
                Guide
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
                    className="group flex h-auto w-full items-start justify-start gap-3 whitespace-normal rounded-ai-md border border-ai-border/60 bg-ai-surface-muted/70 px-4 py-3 text-left text-[14px] font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-ai-border hover:bg-ai-surface focus-visible:ring-1 focus-visible:ring-ai-border/60 focus-visible:ring-offset-0"
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
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {QUICK_ACTIONS.length > 0 && (
        <Card className="border border-ai-border/50 bg-ai-surface-muted/50">
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ai-text-muted" />
              <p className="text-sm font-semibold text-foreground">Snabbkommandon</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action, index) => (
                <Button
                  key={`${action.value}-${index}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleButtonClick(action)}
                  className="group flex h-auto w-full items-start justify-start gap-3 whitespace-normal rounded-ai-md border border-ai-border/40 bg-ai-surface px-4 py-3 text-left text-[14px] font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-ai-border hover:bg-ai-surface focus-visible:ring-1 focus-visible:ring-ai-border/60 focus-visible:ring-offset-0"
                >
                  {action.icon && (
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-ai-border/60 bg-ai-surface-muted/70 text-foreground transition group-hover:border-ai-border group-hover:bg-ai-surface">
                      {React.isValidElement(action.icon)
                        ? React.cloneElement(action.icon, {
                            className: 'h-4 w-4 text-foreground'
                          })
                        : action.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-1 text-left break-words">
                    <span className="block text-sm font-semibold text-foreground">
                      {action.text}
                    </span>
                    {action.description && (
                      <span className="block text-xs leading-snug text-ai-text-muted">
                        {action.description}
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GuideBot;