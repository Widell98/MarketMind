
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageSquare, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  options?: string[];
  timestamp: Date;
}

interface ConversationData {
  isBeginnerInvestor?: boolean;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
  monthlyAmount?: string;
  hasCurrentPortfolio?: boolean;
  currentHoldings?: Array<{ name: string; percentage: number }>;
  age?: string;
  experience?: string;
  sectors?: string[];
}

interface ConversationalRiskAssessmentProps {
  onComplete: (data: ConversationData) => void;
}

const ConversationalRiskAssessment: React.FC<ConversationalRiskAssessmentProps> = ({ onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation
    addBotMessage(
      "Hej! Jag hjälper dig att skapa en personlig portföljstrategi. Låt oss börja med några enkla frågor. Är du ny inom investeringar eller har du tidigare erfarenhet?",
      ["Nybörjare - jag är ny", "Erfaren - jag har investerat tidigare"]
    );
  }, []);

  const addBotMessage = (content: string, options?: string[]) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      options,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleOptionClick = (option: string) => {
    addUserMessage(option);
    processAnswer(option);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    addUserMessage(inputValue);
    processAnswer(inputValue);
    setInputValue('');
  };

  const processAnswer = (answer: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      switch (currentStep) {
        case 'welcome':
          handleExperienceLevel(answer);
          break;
        case 'beginner_goal':
          handleBeginnerGoal(answer);
          break;
        case 'time_horizon':
          handleTimeHorizon(answer);
          break;
        case 'risk_tolerance':
          handleRiskTolerance(answer);
          break;
        case 'monthly_amount':
          handleMonthlyAmount(answer);
          break;
        case 'age_question':
          handleAge(answer);
          break;
        case 'experienced_portfolio':
          handleExperiencedPortfolio(answer);
          break;
        case 'current_holdings':
          handleCurrentHoldings(answer);
          break;
        case 'sectors':
          handleSectors(answer);
          break;
        default:
          break;
      }
      setIsLoading(false);
    }, 800);
  };

  const handleExperienceLevel = (answer: string) => {
    const isBeginnerInvestor = answer.includes('Nybörjare');
    setConversationData(prev => ({ ...prev, isBeginnerInvestor }));

    if (isBeginnerInvestor) {
      setCurrentStep('beginner_goal');
      addBotMessage(
        "Perfekt! Som nybörjare börjar vi med grunderna. Vad är ditt huvudsakliga mål med investeringarna?",
        ["Långsiktig tillväxt", "Månatlig inkomst", "Spara till pension", "Bevara kapital"]
      );
    } else {
      setCurrentStep('experienced_portfolio');
      addBotMessage(
        "Bra! Har du en befintlig portfölj som du vill optimera eller vill du börja om från början?",
        ["Ja, jag har befintliga innehav", "Nej, jag vill börja om"]
      );
    }
  };

  const handleBeginnerGoal = (answer: string) => {
    setConversationData(prev => ({ ...prev, investmentGoal: answer }));
    setCurrentStep('time_horizon');
    addBotMessage(
      "Utmärkt! Vilken tidshorisont har du för dina investeringar?",
      ["1-3 år (kort sikt)", "3-7 år (medellång sikt)", "7+ år (lång sikt)"]
    );
  };

  const handleTimeHorizon = (answer: string) => {
    setConversationData(prev => ({ ...prev, timeHorizon: answer }));
    setCurrentStep('risk_tolerance');
    addBotMessage(
      "Bra! Hur känner du inför risk? Kom ihåg att högre risk ofta ger högre potentiell avkastning.",
      ["Låg risk - jag vill bevara mitt kapital", "Måttlig risk - balans mellan säkerhet och tillväxt", "Hög risk - jag vill maximera tillväxtpotentialen"]
    );
  };

  const handleRiskTolerance = (answer: string) => {
    setConversationData(prev => ({ ...prev, riskTolerance: answer }));
    setCurrentStep('monthly_amount');
    addBotMessage(
      "Hur mycket planerar du att investera månadsvis? (skriv ett ungefärligt belopp i SEK)"
    );
  };

  const handleMonthlyAmount = (answer: string) => {
    setConversationData(prev => ({ ...prev, monthlyAmount: answer }));
    setCurrentStep('age_question');
    addBotMessage("Slutligen, hur gammal är du? (detta hjälper oss att anpassa strategin)");
  };

  const handleAge = (answer: string) => {
    setConversationData(prev => ({ ...prev, age: answer }));
    
    addBotMessage("Tack! Nu har jag all information jag behöver för att skapa din personliga portföljstrategi. Jag kommer att analysera dina svar och generera en skräddarsydd portfölj åt dig.");
    
    setTimeout(() => {
      finishConversation();
    }, 2000);
  };

  const handleExperiencedPortfolio = (answer: string) => {
    const hasCurrentPortfolio = answer.includes('Ja');
    setConversationData(prev => ({ ...prev, hasCurrentPortfolio }));

    if (hasCurrentPortfolio) {
      setCurrentStep('current_holdings');
      addBotMessage(
        "Kan du lista dina nuvarande innehav och deras ungefärliga procentuella fördelning? Exempel: 'AAPL 30%, TSLA 20%, SPY 50%' eller bara sektorer som 'Tech 60%, Finans 40%'"
      );
    } else {
      setCurrentStep('sectors');
      addBotMessage(
        "Vilka sektorer eller områden är du mest intresserad av?",
        ["Teknologi", "Hälsovård", "Finans", "Konsumentvaror", "Energi", "Fastigheter"]
      );
    }
  };

  const handleCurrentHoldings = (answer: string) => {
    // Parse holdings from text like "AAPL 30%, TSLA 20%, SPY 50%"
    const holdingsRegex = /([A-Za-zÅÄÖåäö\s]+)\s+(\d+)%/g;
    const holdings: Array<{ name: string; percentage: number }> = [];
    let match;
    
    while ((match = holdingsRegex.exec(answer)) !== null) {
      holdings.push({
        name: match[1].trim(),
        percentage: parseInt(match[2])
      });
    }
    
    setConversationData(prev => ({ ...prev, currentHoldings: holdings }));
    setCurrentStep('sectors');
    
    addBotMessage(
      "Tack! Vilka sektorer vill du fokusera på framöver?",
      ["Teknologi", "Hälsovård", "Finans", "Konsumentvaror", "Energi", "Fastigheter"]
    );
  };

  const handleSectors = (answer: string) => {
    const sectors = answer.split(',').map(s => s.trim());
    setConversationData(prev => ({ ...prev, sectors }));
    
    addBotMessage("Perfekt! Nu har jag all information jag behöver för att optimera din portföljstrategi. Låt mig analysera och skapa en personlig rekommendation åt dig.");
    
    setTimeout(() => {
      finishConversation();
    }, 2000);
  };

  const finishConversation = () => {
    addBotMessage("✅ Analys klar! Jag skapar nu din personliga portföljstrategi baserat på vårt samtal.");
    
    setTimeout(() => {
      onComplete(conversationData);
    }, 1500);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Portfolio Advisor - Personlig Konsultation
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Steg {messages.filter(m => m.type === 'user').length + 1}
          </Badge>
          <span className="text-sm text-gray-600">
            Personlig rådgivning genom naturlig konversation
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 text-foreground'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  
                  {message.options && (
                    <div className="mt-3 space-y-2">
                      {message.options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleOptionClick(option)}
                          className="w-full justify-start text-left text-xs bg-white hover:bg-blue-50"
                          disabled={isLoading}
                        >
                          <ArrowRight className="w-3 h-3 mr-2" />
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString('sv-SE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 p-3 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-700">AI-assistenten tänker...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Text input for free-form answers */}
        {!messages[messages.length - 1]?.options && messages.length > 0 && !isLoading && (
          <div className="border-t p-4 flex-shrink-0">
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Skriv ditt svar här..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={!inputValue.trim() || isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationalRiskAssessment;
