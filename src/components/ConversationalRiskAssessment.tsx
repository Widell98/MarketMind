
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, MessageSquare, ArrowRight, CheckCircle, Loader2, TrendingUp, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  options?: string[];
  inputType?: 'text' | 'textarea' | 'number';
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
  interests?: string[];
  companies?: string[];
  portfolioSize?: string;
  rebalancingFrequency?: string;
  marketTiming?: string;
  complexStrategies?: string[];
  riskManagement?: string;
  globalExposure?: string;
  alternativeInvestments?: string[];
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation
    addBotMessage(
      "Hej! Jag hjälper dig att skapa en personlig portföljstrategi. Låt oss börja med att förstå din erfarenhetsnivå inom investeringar.",
      ["Nybörjare - jag är ny inom investeringar", "Erfaren - jag har investerat i flera år"]
    );
  }, []);

  const addBotMessage = (content: string, options?: string[], inputType?: 'text' | 'textarea' | 'number') => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      options,
      inputType,
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
        case 'beginner_interests':
          handleBeginnerInterests(answer);
          break;
        case 'beginner_companies':
          handleBeginnerCompanies(answer);
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
        case 'portfolio_question':
          handlePortfolioQuestion(answer);
          break;
        case 'current_holdings':
          handleCurrentHoldings(answer);
          break;
        case 'portfolio_help':
          handlePortfolioHelp(answer);
          break;
        case 'experienced_portfolio_size':
          handleExperiencedPortfolioSize(answer);
          break;
        case 'rebalancing_frequency':
          handleRebalancingFrequency(answer);
          break;
        case 'market_timing':
          handleMarketTiming(answer);
          break;
        case 'complex_strategies':
          handleComplexStrategies(answer);
          break;
        case 'risk_management':
          handleRiskManagement(answer);
          break;
        case 'global_exposure':
          handleGlobalExposure(answer);
          break;
        case 'alternative_investments':
          handleAlternativeInvestments(answer);
          break;
        case 'age_question':
          handleAge(answer);
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
      setCurrentStep('beginner_interests');
      addBotMessage(
        "Perfekt! Som nybörjare vill jag förstå vad som intresserar dig. Vilka områden eller branscher tycker du är spännande? (t.ex. teknologi, hållbarhet, gaming, hälsa, etc.)",
        undefined,
        'textarea'
      );
    } else {
      setCurrentStep('experienced_portfolio_size');
      addBotMessage(
        "Utmärkt! Som erfaren investerare - ungefär hur stor är din nuvarande portfölj?",
        ["Under 100 000 SEK", "100 000 - 500 000 SEK", "500 000 - 1 miljon SEK", "Över 1 miljon SEK"]
      );
    }
  };

  const handleBeginnerInterests = (answer: string) => {
    const interests = answer.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setConversationData(prev => ({ ...prev, interests }));
    setCurrentStep('beginner_companies');
    
    addBotMessage(
      "Fantastiskt! Baserat på dina intressen - finns det några specifika företag du känner till och tycker verkar intressanta? (t.ex. Tesla, Spotify, H&M, etc.)",
      undefined,
      'textarea'
    );
  };

  const handleBeginnerCompanies = (answer: string) => {
    const companies = answer.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setConversationData(prev => ({ ...prev, companies }));
    setCurrentStep('beginner_goal');
    
    addBotMessage(
      "Bra! Nu förstår jag bättre vad som intresserar dig. Vad är ditt huvudsakliga mål med investeringarna?",
      ["Långsiktig tillväxt - jag vill att pengarna ska växa över tid", "Månatlig inkomst - jag vill ha utdelningar", "Pension - jag sparar till framtiden", "Bevara kapital - jag vill inte förlora pengar"]
    );
  };

  const handleBeginnerGoal = (answer: string) => {
    setConversationData(prev => ({ ...prev, investmentGoal: answer }));
    setCurrentStep('time_horizon');
    addBotMessage(
      "Perfekt! Vilken tidshorisont har du för dina investeringar?",
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
      "Hur mycket planerar du att investera månadsvis? (skriv ett ungefärligt belopp i SEK)",
      undefined,
      'number'
    );
  };

  const handleMonthlyAmount = (answer: string) => {
    setConversationData(prev => ({ ...prev, monthlyAmount: answer }));
    setCurrentStep('portfolio_question');
    addBotMessage(
      "Nu kommer en avgörande fråga: Har du redan en befintlig portfölj med investeringar?",
      ["Ja, jag har redan investeringar", "Nej, jag ska börja från början"]
    );
  };

  const handlePortfolioQuestion = (answer: string) => {
    const hasCurrentPortfolio = answer.includes('Ja');
    setConversationData(prev => ({ ...prev, hasCurrentPortfolio }));

    if (hasCurrentPortfolio) {
      setCurrentStep('current_holdings');
      addBotMessage(
        "Perfekt! Kan du lista dina nuvarande innehav och deras ungefärliga procentuella fördelning? \n\nExempel: 'Avanza Global 40%, Handelsbanken Sverige 30%, Tesla 20%, Spotify 10%' eller bara sektorer som 'Teknik 60%, Bank 40%'",
        undefined,
        'textarea'
      );
    } else {
      setCurrentStep('portfolio_help');
      addBotMessage(
        "Inga problem! Jag hjälper dig att skapa din första portfölj. Vad känns viktigast för dig när vi bygger din portfölj?",
        [
          "Enkelhet - jag vill ha få, breda innehav",
          "Diversifiering - jag vill sprida riskerna",
          "Fokus på mina intressen - investera i det jag förstår",
          "Låga avgifter - minimera kostnaderna"
        ]
      );
    }
  };

  const handleCurrentHoldings = (answer: string) => {
    // Parse holdings from text
    const holdingsRegex = /([A-Za-zÅÄÖåäö\s&.,-]+?)\s+(\d+)%/g;
    const holdings: Array<{ name: string; percentage: number }> = [];
    let match;
    
    while ((match = holdingsRegex.exec(answer)) !== null) {
      holdings.push({
        name: match[1].trim(),
        percentage: parseInt(match[2])
      });
    }
    
    setConversationData(prev => ({ ...prev, currentHoldings: holdings }));
    setCurrentStep('age_question');
    
    addBotMessage("Tack! Slutligen, hur gammal är du? (detta hjälper oss att anpassa strategin)");
  };

  const handlePortfolioHelp = (answer: string) => {
    setConversationData(prev => ({ ...prev, portfolioHelp: answer }));
    setCurrentStep('age_question');
    addBotMessage("Utmärkt! Slutligen, hur gammal är du? (detta hjälper oss att anpassa strategin)");
  };

  // Experienced investor questions
  const handleExperiencedPortfolioSize = (answer: string) => {
    setConversationData(prev => ({ ...prev, portfolioSize: answer }));
    setCurrentStep('rebalancing_frequency');
    addBotMessage(
      "Hur ofta rebalanserar du din portfölj?",
      ["Månadsvis", "Kvartalsvis", "Årligen", "Aldrig - jag låter den växa organiskt"]
    );
  };

  const handleRebalancingFrequency = (answer: string) => {
    setConversationData(prev => ({ ...prev, rebalancingFrequency: answer }));
    setCurrentStep('market_timing');
    addBotMessage(
      "Vad är din syn på market timing?",
      [
        "Jag försöker tajma marknaden aktivt",
        "Jag gör mindre justeringar baserat på marknadsläge",
        "Jag investerar regelbundet oavsett marknadsläge (DCA)",
        "Jag investerar bara när jag ser tydliga möjligheter"
      ]
    );
  };

  const handleMarketTiming = (answer: string) => {
    setConversationData(prev => ({ ...prev, marketTiming: answer }));
    setCurrentStep('complex_strategies');
    addBotMessage(
      "Vilka av dessa mer avancerade strategier har du erfarenhet av? (välj flera om det stämmer)",
      [
        "Optioner och derivat",
        "Blankning (short selling)",
        "Valutahandel (Forex)",
        "Kryptovalutor",
        "Inga av ovanstående"
      ]
    );
  };

  const handleComplexStrategies = (answer: string) => {
    const strategies = answer === "Inga av ovanstående" ? [] : [answer];
    setConversationData(prev => ({ ...prev, complexStrategies: strategies }));
    setCurrentStep('risk_management');
    addBotMessage(
      "Hur hanterar du riskhantering i din portfölj?",
      [
        "Jag använder stop-loss order systematiskt",
        "Jag diversifierar över olika tillgångsklasser",
        "Jag hedgar med derivat",
        "Jag förlitar mig på fundamental analys",
        "Jag accepterar volatilitet för långsiktig tillväxt"
      ]
    );
  };

  const handleRiskManagement = (answer: string) => {
    setConversationData(prev => ({ ...prev, riskManagement: answer }));
    setCurrentStep('global_exposure');
    addBotMessage(
      "Hur ser din geografiska exponering ut?",
      [
        "Huvudsakligen svenska bolag",
        "Nordiska marknader",
        "Global exponering med USA-fokus",
        "Verkligt global diversifiering",
        "Inkluderar tillväxtmarknader aktivt"
      ]
    );
  };

  const handleGlobalExposure = (answer: string) => {
    setConversationData(prev => ({ ...prev, globalExposure: answer }));
    setCurrentStep('alternative_investments');
    addBotMessage(
      "Vilka alternativa investeringar är du intresserad av?",
      [
        "REITs (fastighetsfonder)",
        "Råvaror och metaller",
        "Private equity",
        "Inga alternativa investeringar",
        "Andra alternativ"
      ]
    );
  };

  const handleAlternativeInvestments = (answer: string) => {
    const alternatives = answer === "Inga alternativa investeringar" ? [] : [answer];
    setConversationData(prev => ({ ...prev, alternativeInvestments: alternatives }));
    setCurrentStep('portfolio_question');
    addBotMessage(
      "Sista frågan: Har du en befintlig portfölj du vill optimera?",
      ["Ja, jag vill optimera min nuvarande portfölj", "Nej, jag vill bygga en ny strategi"]
    );
  };

  const handleAge = (answer: string) => {
    setConversationData(prev => ({ ...prev, age: answer }));
    
    const isExperienced = !conversationData.isBeginnerInvestor;
    const message = isExperienced 
      ? "Perfekt! Nu har jag en djup förståelse för din investeringsprofil och erfarenhet. Jag kommer att skapa en avancerad portföljstrategi som passar din sofistikerade approach."
      : "Tack! Nu har jag all information jag behöver för att skapa din personliga portföljstrategi baserat på dina intressen och mål.";
    
    addBotMessage(message);
    
    setTimeout(() => {
      finishConversation();
    }, 2000);
  };

  const finishConversation = () => {
    const isExperienced = !conversationData.isBeginnerInvestor;
    const completionMessage = isExperienced
      ? "✅ Analys klar! Jag skapar nu en avancerad portföljstrategi som tar hänsyn till din erfarenhet och sofistikerade krav."
      : "✅ Analys klar! Jag skapar nu din personliga portföljstrategi med fokus på dina intressen och en bra start för din investeringsresa.";
      
    addBotMessage(completionMessage);
    
    setTimeout(() => {
      onComplete(conversationData);
    }, 1500);
  };

  const getCurrentInputType = () => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.inputType || 'text';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[700px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          {conversationData.isBeginnerInvestor === false ? (
            <>
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Avancerad Portfolio Konsultation
            </>
          ) : (
            <>
              <Lightbulb className="w-5 h-5 text-green-600" />
              Personlig Portfolio Guide
            </>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Steg {messages.filter(m => m.type === 'user').length + 1}
          </Badge>
          <span className="text-sm text-gray-600">
            {conversationData.isBeginnerInvestor === false 
              ? "Avancerad rådgivning för erfarna investerare"
              : "Personlig rådgivning anpassad för dig"
            }
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
                  className={`max-w-[85%] p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 text-foreground'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                  
                  {message.options && (
                    <div className="mt-4 space-y-2">
                      {message.options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleOptionClick(option)}
                          className="w-full justify-start text-left text-xs bg-white hover:bg-blue-50 p-3 h-auto"
                          disabled={isLoading}
                        >
                          <ArrowRight className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="text-left">{option}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-3">
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
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 p-4 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-700">AI-assistenten analyserar ditt svar...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input section */}
        {!messages[messages.length - 1]?.options && messages.length > 0 && !isLoading && (
          <div className="border-t p-4 flex-shrink-0">
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              {getCurrentInputType() === 'textarea' ? (
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Skriv ditt svar här... (du kan lista flera saker separerade med komma)"
                  className="flex-1 min-h-[80px] resize-none"
                  disabled={isLoading}
                />
              ) : (
                <Input
                  type={getCurrentInputType()}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={getCurrentInputType() === 'number' ? "t.ex. 5000" : "Skriv ditt svar här..."}
                  className="flex-1"
                  disabled={isLoading}
                />
              )}
              <Button type="submit" disabled={!inputValue.trim() || isLoading} className="px-6">
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
