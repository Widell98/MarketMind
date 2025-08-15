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
      {/* Guide Bot Message */}
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Compass className="w-4 h-4 text-white" />
        </div>
        
        <Card className="flex-1 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-amber-900 dark:text-amber-100">
              {currentMessage.title}
            </span>
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Guide
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-amber-900 dark:text-amber-100 whitespace-pre-line leading-relaxed">
              {currentMessage.content}
            </div>
            
            {currentMessage.buttons && (
              <div className="grid grid-cols-1 gap-2">
                {currentMessage.buttons.map((button, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleButtonClick(button)}
                    className="justify-start h-auto p-3 text-left bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  >
                    <div className="flex items-start gap-3 w-full">
                      {button.icon && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          {React.cloneElement(button.icon as React.ReactElement, {
                            className: "w-4 h-4 text-amber-600 dark:text-amber-300"
                          })}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-amber-900 dark:text-amber-100">
                          {button.text}
                        </div>
                        {button.description && (
                          <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            {button.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GuideBot;