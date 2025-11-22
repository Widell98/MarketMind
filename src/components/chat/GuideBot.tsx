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
  Sparkles,
  LineChart,
  Layers,
  GraduationCap,
  Lightbulb,
  ShieldCheck,
  Target,
  Globe2
} from 'lucide-react';

interface GuideMessage {
  id: string;
  type: 'welcome' | 'guide' | 'interactive';
  title: string;
  content: React.ReactNode;
  buttons?: GuideButton[];
  quickPrompts?: QuickPrompt[];
  isBot: true;
}

interface GuideButton {
  text: string;
  action: 'prompt' | 'navigate' | 'demo';
  value: string;
  icon?: React.ReactNode;
  description?: string;
  topic?: 'stocks' | 'portfolio' | 'education';
}

export interface QuickPrompt {
  label: string;
  prompt: string;
  description?: string;
  icon?: React.ReactNode;
}

interface GuideBotProps {
  onPromptExample: (prompt: string) => void;
  onNavigate: (path: string) => void;
  onShowDemo: (demoType: string) => void;
  initialFlowId?: keyof typeof GUIDE_FLOWS | 'welcome';
}

const WELCOME_MESSAGE: GuideMessage = {
  id: 'guide-welcome',
  type: 'welcome',
  title: 'Market Mind Guide',
  content: (
    <div className="space-y-4">
      <p>Hej 👋 Jag är här för att guida dig genom allt Market Mind kan hjälpa dig med.</p>
      <div className="space-y-2 text-sm text-ai-text-muted">
        <p>Här är tre snabba sätt att komma igång:</p>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="select-none">•</span>
            <span>Ställ en AI-fråga och låt assistenten bygga ett investeringscase åt dig</span>
          </li>
          <li className="flex gap-2">
            <span className="select-none">•</span>
            <span>Utforska communityns aktieidéer och se vad som trendar just nu</span>
          </li>
          <li className="flex gap-2">
            <span className="select-none">•</span>
            <span>Bygg en portföljplan som passar din riskprofil</span>
          </li>
        </ul>
      </div>
    </div>
  ),
  buttons: [
    {
      text: 'Skapa en strategi med AI',
      action: 'prompt',
      value: 'Skapa en hållbar investeringsstrategi för en balanserad portfölj med fokus på nordiska bolag',
      icon: <Sparkles className="w-4 h-4" />,
      description: 'Testa AI-assistenten med ett färdigt prompt'
    },
    {
      text: 'Utforska aktieidéer',
      action: 'navigate',
      value: '/discover',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Hitta community-case och marknadssignaler',
      topic: 'stocks'
    },
    {
      text: 'Kom igång med portföljen',
      action: 'demo',
      value: 'portfolio-basics',
      icon: <PieChart className="w-4 h-4" />,
      description: 'Få en plan för att bygga din portfölj'
    },
    {
      text: 'Lär dig AI-chatten',
      action: 'demo',
      value: 'ai-chat',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Se hur AI-assistenten funkar'
    },
    {
      text: 'Visa snabba prompts',
      action: 'demo',
      value: 'prompt-playground',
      icon: <Search className="w-4 h-4" />,
      description: 'Välj bland färdiga frågor att testa'
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
      },
      {
        text: 'Utforska aktieguiden',
        action: 'demo',
        value: 'stocks-discovery',
        icon: <TrendingUp className="w-4 h-4" />
      }
    ],
    quickPrompts: [
      {
        label: 'Gör en portföljgenomgång',
        prompt: 'Gör en hälsokontroll av min portfölj och föreslå ombalanseringar baserat på min medelhöga riskprofil.',
        description: 'Få en snabb analys och rekommendationer',
        icon: <PieChart className="w-4 h-4" />
      },
      {
        label: 'Identifiera marknadstrender',
        prompt: 'Vilka marknadstrender bör jag hålla koll på kommande kvartal inom teknik och grön energi?',
        description: 'Se vad som påverkar marknaden just nu',
        icon: <LineChart className="w-4 h-4" />
      },
      {
        label: 'Bygg ett investeringscase',
        prompt: 'Skapa ett investeringscase för ett nordiskt tillväxtbolag inklusive risker, möjligheter och nyckeltal.',
        description: 'Låt AI ta fram ett strukturerat case',
        icon: <Target className="w-4 h-4" />
      }
    ],
    isBot: true
  },
  'portfolio-basics': {
    id: 'guide-portfolio-basics',
    type: 'guide',
    title: 'Bygg din portföljplan',
    content: (
      <div className="space-y-4">
        <p className="font-semibold text-foreground">Så tar du kontroll över din portfölj:</p>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <Target className="h-5 w-5 text-foreground" />
            <div className="space-y-1 text-sm text-ai-text-muted">
              <p className="font-semibold text-foreground">Sätt tydliga mål</p>
              <p>Definiera tidshorisont, risknivå och kassaflödesbehov.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <Layers className="h-5 w-5 text-foreground" />
            <div className="space-y-1 text-sm text-ai-text-muted">
              <p className="font-semibold text-foreground">Skapa struktur</p>
              <p>Bygg lager av kärninnehav, satelliter och taktiska bets.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-foreground" />
            <div className="space-y-1 text-sm text-ai-text-muted">
              <p className="font-semibold text-foreground">Skydda nedsidan</p>
              <p>Låt AI simulera scenarion och föreslå riskhantering.</p>
            </div>
          </li>
        </ul>
      </div>
    ),
    buttons: [
      {
        text: 'Öppna portföljguiden',
        action: 'navigate',
        value: '/portfolio-implementation',
        icon: <PieChart className="w-4 h-4" />,
        topic: 'portfolio'
      },
      {
        text: 'Visa riskverktyg',
        action: 'demo',
        value: 'risk-tools',
        icon: <ShieldCheck className="w-4 h-4" />
      },
      {
        text: 'Utforska aktieidéer',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
      }
    ],
    quickPrompts: [
      {
        label: 'Föreslå en allokering',
        prompt: 'Föreslå en portföljallokering för 5-7 års sparande med fokus på stabil utdelning.',
        icon: <PieChart className="w-4 h-4" />
      },
      {
        label: 'Analys av nuvarande innehav',
        prompt: 'Analysera min nuvarande portfölj (lista mina innehav) och ge förslag på förbättringar.',
        icon: <MessageSquare className="w-4 h-4" />
      }
    ],
    isBot: true
  },
  'stocks-discovery': {
    id: 'guide-stocks-discovery',
    type: 'guide',
    title: 'Utforska aktier och case',
    content: (
      <div className="space-y-4">
        <p className="font-semibold text-foreground">Hitta nästa möjlighet i Discover:</p>
        <ul className="space-y-3 text-sm text-ai-text-muted">
          <li className="flex gap-3">
            <TrendingUp className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Se vad som trendar</p>
              <p>Fånga upp aktier som diskuteras mest just nu.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <Search className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Filtrera på teman</p>
              <p>Sök efter hållbarhet, AI, energi eller andra strategier.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <Globe2 className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Följ globala signaler</p>
              <p>Jämför case från olika marknader och skapa egna listor.</p>
            </div>
          </li>
        </ul>
      </div>
    ),
    buttons: [
      {
        text: 'Öppna Discover',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
      },
      {
        text: 'Hitta AI-aktieprompts',
        action: 'demo',
        value: 'prompt-playground',
        icon: <Sparkles className="w-4 h-4" />
      },
      {
        text: 'Tillbaka till start',
        action: 'demo',
        value: 'welcome',
        icon: <Compass className="w-4 h-4" />
      }
    ],
    quickPrompts: [
      {
        label: 'Analys av trendande aktie',
        prompt: 'Gör en snabb analys av den mest omnämnda aktien i Discover och lista möjligheter och risker.',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        label: 'Jämför två case',
        prompt: 'Jämför två populära aktiecase inom förnybar energi från Discover och rekommendera det starkaste.',
        icon: <LineChart className="w-4 h-4" />
      }
    ],
    isBot: true
  },
  'risk-tools': {
    id: 'guide-risk-tools',
    type: 'guide',
    title: 'Hantera risk och scenarion',
    content: (
      <div className="space-y-4 text-sm text-ai-text-muted">
        <p className="font-semibold text-foreground">AI kan hjälpa dig att ligga steget före:</p>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Stressa portföljen</p>
              <p>Simulera marknadsfall och se vilka innehav som är mest utsatta.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <LineChart className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Spåra volatilitet</p>
              <p>Låt AI identifiera varningssignaler baserat på volatilitet och korrelation.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <Layers className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Skapa skydd</p>
              <p>Få förslag på hedgar och diversifieringslager.</p>
            </div>
          </li>
        </ul>
      </div>
    ),
    buttons: [
      {
        text: 'Testa riskprompt',
        action: 'prompt',
        value: 'Gör en stresstestanalys av min portfölj och föreslå hur jag kan minska nedsidan.',
        icon: <ShieldCheck className="w-4 h-4" />
      },
      {
        text: 'Bygg diversifierad plan',
        action: 'demo',
        value: 'portfolio-basics',
        icon: <Layers className="w-4 h-4" />
      },
      {
        text: 'Utforska aktieidéer',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
      }
    ],
    isBot: true
  },
  'learning-center': {
    id: 'guide-learning-center',
    type: 'guide',
    title: 'Lär dig mer om Market Mind',
    content: (
      <div className="space-y-4">
        <p className="font-semibold text-foreground">Lås upp hela potentialen:</p>
        <ul className="space-y-3 text-sm text-ai-text-muted">
          <li className="flex gap-3">
            <GraduationCap className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Guidade lektioner</p>
              <p>Steg-för-steg genomgångar av AI-chatten och portföljverktygen.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <BookOpen className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Kunskapsbank</p>
              <p>Spara dina bästa prompts och bygg ett eget bibliotek.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <Lightbulb className="h-5 w-5 text-foreground" />
            <div>
              <p className="font-semibold text-foreground">Tips &amp; tricks</p>
              <p>Lär dig hur du använder AI som coach i din investeringsprocess.</p>
            </div>
          </li>
        </ul>
      </div>
    ),
    buttons: [
      {
        text: 'Visa AI-chat guiden',
        action: 'demo',
        value: 'ai-chat',
        icon: <MessageSquare className="w-4 h-4" />
      },
      {
        text: 'Gå till portföljplanering',
        action: 'demo',
        value: 'portfolio-basics',
        icon: <PieChart className="w-4 h-4" />
      },
      {
        text: 'Utforska Discover',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
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
        text: 'Visa portföljöversikt',
        action: 'navigate',
        value: '/portfolio-implementation',
        icon: <PieChart className="w-4 h-4" />
      },
      {
        text: 'Utforska Discover',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
      },
      {
        text: 'Lär dig mer',
        action: 'demo',
        value: 'learning-center',
        icon: <BookOpen className="w-4 h-4" />
      }
    ],
    isBot: true
  },
  'prompt-playground': {
    id: 'guide-prompt-playground',
    type: 'interactive',
    title: 'Snabba prompts för AI-chatten',
    content: (
      <div className="space-y-3 text-sm text-ai-text-muted">
        <p>Välj ett prompt nedan för att direkt ställa en fråga till AI-assistenten.</p>
        <p>Justera med egna detaljer när du har fått ett första svar.</p>
      </div>
    ),
    buttons: [
      {
        text: 'Mer om AI-chatten',
        action: 'demo',
        value: 'ai-chat',
        icon: <MessageSquare className="w-4 h-4" />
      },
      {
        text: 'Utforska aktier',
        action: 'navigate',
        value: '/discover',
        icon: <TrendingUp className="w-4 h-4" />,
        topic: 'stocks'
      }
    ],
    quickPrompts: [
      {
        label: 'Portföljstrategi',
        prompt: 'Skapa en portföljstrategi med 3 nivåer av risk och föreslå passande tillgångar för varje nivå.',
        description: 'Perfekt om du vill strukturera ditt sparande',
        icon: <PieChart className="w-4 h-4" />
      },
      {
        label: 'Aktieidéer',
        prompt: 'Ge mig tre aktieidéer baserade på kommande makroekonomiska katalysatorer och motivera kort.',
        description: 'Få färska case på sekunder',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        label: 'Marknadsspaning',
        prompt: 'Sammanfatta de viktigaste marknadshändelserna denna vecka och hur de kan påverka min portfölj.',
        description: 'Håll koll på helhetsbilden',
        icon: <Globe2 className="w-4 h-4" />
      },
      {
        label: 'Riskanalys',
        prompt: 'Identifiera de största riskerna i en portfölj med tech- och energibolag och föreslå hedgar.',
        description: 'Minska nedsidan med konkreta åtgärder',
        icon: <ShieldCheck className="w-4 h-4" />
      },
      {
        label: 'Jämför två bolag',
        prompt: 'Jämför Volvo och Scania på värdering, marginaler och kassaflöde. Lista styrkor, svagheter och en tydlig rekommendation.',
        description: 'Snabb bolagsjämförelse med slutsats',
        icon: <LineChart className="w-4 h-4" />
      },
      {
        label: 'Sektorjämförelse',
        prompt: 'Sammanfatta styrkor och svagheter för tre ledande bolag inom grön energi (t.ex. Ørsted, Vestas, Siemens Energy) och jämför deras värderingar.',
        description: 'Se vilka aktörer som står starkast',
        icon: <Layers className="w-4 h-4" />
      },
      {
        label: 'Värderingskoll',
        prompt: 'Gör en snabb multiples-jämförelse av två svenska industribolag (P/E, EV/EBITDA, kassaflöde) och bedöm vilket som ser mest attraktivt ut.',
        description: 'Korta insikter om relativ värdering',
        icon: <Target className="w-4 h-4" />
      }
    ],
    isBot: true
  }
};

const getGuideMessage = (flowId?: keyof typeof GUIDE_FLOWS | 'welcome') => {
  if (flowId && flowId !== 'welcome') {
    return GUIDE_FLOWS[flowId] ?? WELCOME_MESSAGE;
  }

  return WELCOME_MESSAGE;
};

export const AI_CHAT_EXAMPLE_PROMPT = GUIDE_FLOWS['ai-chat'].buttons?.[0]?.value;
export const PROMPT_PLAYGROUND_PROMPTS = GUIDE_FLOWS['prompt-playground'].quickPrompts ?? [];

const GuideBot: React.FC<GuideBotProps> = ({ onPromptExample, onNavigate, onShowDemo, initialFlowId = 'welcome' }) => {
  const [currentMessage, setCurrentMessage] = React.useState<GuideMessage>(() => getGuideMessage(initialFlowId));

  React.useEffect(() => {
    setCurrentMessage(getGuideMessage(initialFlowId));
  }, [initialFlowId]);

  const messageTypeLabel =
    currentMessage.type === 'interactive'
      ? 'Interaktiv'
      : currentMessage.type === 'welcome'
        ? 'Intro'
        : 'Guide';

  const renderIcon = (icon?: React.ReactNode, wrapperClassName = 'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-ai-border/60 bg-ai-surface text-foreground transition group-hover:border-ai-border group-hover:bg-ai-surface group-hover:text-foreground') => {
    if (!icon) {
      return null;
    }

    return (
      <span className={wrapperClassName}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon, {
              className: 'h-4 w-4 text-foreground'
            })
          : icon}
      </span>
    );
  };

  const handleButtonClick = (button: GuideButton) => {
    switch (button.action) {
      case 'prompt':
        onPromptExample(button.value);
        break;
      case 'navigate':
        onNavigate(button.topic === 'stocks' ? '/discover' : button.value);
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
                {messageTypeLabel}
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
                    {renderIcon(button.icon)}
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

            {currentMessage.quickPrompts && currentMessage.quickPrompts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ai-text-muted">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Snabba prompts</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentMessage.quickPrompts.map((quickPrompt, index) => (
                    <Button
                      key={`${quickPrompt.label}-${index}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onPromptExample(quickPrompt.prompt)}
                      className="group flex h-auto w-full items-start justify-start gap-3 whitespace-normal rounded-ai-md border border-ai-border/60 bg-ai-surface-muted/70 px-4 py-3 text-left text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-ai-border hover:bg-ai-surface focus-visible:ring-1 focus-visible:ring-ai-border/60 focus-visible:ring-offset-0"
                    >
                      {renderIcon(
                        quickPrompt.icon,
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-ai-border/60 bg-ai-surface text-foreground transition group-hover:border-ai-border group-hover:bg-ai-surface group-hover:text-foreground'
                      )}
                      <div className="min-w-0 flex-1 space-y-1 text-left break-words">
                        <span className="block text-sm font-semibold text-foreground">
                          {quickPrompt.label}
                        </span>
                        {quickPrompt.description && (
                          <span className="block text-xs leading-snug text-ai-text-muted">
                            {quickPrompt.description}
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GuideBot;