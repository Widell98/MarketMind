
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, User, Bot, ArrowLeft, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface ConversationData {
  isBeginnerInvestor?: boolean;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
  monthlyAmount?: string;
  hasCurrentPortfolio?: boolean;
  currentHoldings?: Array<{
    id: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    symbol?: string;
  }>;
  age?: string;
  experience?: string;
  sectors?: string[];
  interests?: string[];
  companies?: string[];
  portfolioHelp?: string;
  portfolioSize?: string;
  rebalancingFrequency?: string;
}

const ChatPortfolioAdvisor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [portfolioResult, setPortfolioResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { generatePortfolioFromConversation, loading } = useConversationalPortfolio();
  const { refetch } = usePortfolio();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questions = [
    {
      id: 'intro',
      question: 'Hej! Jag är din AI-portföljrådgivare. Är du ny inom investeringar eller har du erfarenhet?',
      options: ['Jag är ny inom investeringar', 'Jag har erfarenhet av investeringar'],
      key: 'isBeginnerInvestor',
      processAnswer: (answer: string) => answer.includes('ny')
    },
    {
      id: 'age',
      question: 'Vilken åldersgrupp tillhör du?',
      options: ['18-25 år', '26-35 år', '36-45 år', '46-55 år', '56+ år'],
      key: 'age'
    },
    {
      id: 'interests',
      question: 'Vad intresserar dig mest? Detta hjälper mig föreslå relevanta investeringar.',
      options: ['Teknik och innovation', 'Hälsa och välmående', 'Miljö och hållbarhet', 'Bank och finans', 'Spel och underhållning', 'Fastigheter'],
      key: 'interests',
      showIf: () => conversationData.isBeginnerInvestor === true,
      allowCustom: true
    },
    {
      id: 'companies',
      question: 'Vilka företag eller varumärken använder du ofta eller tycker om? (Du kan skriva flera separerade med komma)',
      key: 'companies',
      showIf: () => conversationData.isBeginnerInvestor === true,
      allowCustom: true,
      customOnly: true
    },
    {
      id: 'goal',
      question: 'Vad är ditt huvudsakliga mål med investeringarna?',
      options: ['Pensionssparande', 'Förmögenhetsuppbyggnad', 'Regelbunden inkomst', 'Utbildning/Barn', 'Bostadsköp'],
      key: 'investmentGoal',
      allowCustom: true
    },
    {
      id: 'timeHorizon',
      question: 'Hur lång tid tänker du investera pengarna?',
      options: ['1-3 år (kort sikt)', '3-7 år (medellång sikt)', '7+ år (lång sikt)'],
      key: 'timeHorizon',
      processAnswer: (answer: string) => {
        if (answer.includes('1-3')) return 'short';
        if (answer.includes('3-7')) return 'medium';
        return 'long';
      }
    },
    {
      id: 'risk',
      question: 'Hur känner du inför risk i dina investeringar?',
      options: ['Konservativ - Vill undvika förluster', 'Balanserad - Okej med måttlig risk', 'Aggressiv - Vill maximera avkastning'],
      key: 'riskTolerance',
      processAnswer: (answer: string) => {
        if (answer.includes('Konservativ')) return 'conservative';
        if (answer.includes('Balanserad')) return 'balanced';
        return 'aggressive';
      }
    },
    {
      id: 'monthlyAmount',
      question: 'Ungefär hur mycket tänker du investera per månad?',
      options: ['1 000 - 3 000 kr', '3 000 - 5 000 kr', '5 000 - 10 000 kr', '10 000 kr eller mer'],
      key: 'monthlyAmount',
      allowCustom: true
    },
    {
      id: 'hasPortfolio',
      question: 'Har du redan några investeringar som du vill optimera?',
      options: ['Ja, jag har investeringar', 'Nej, jag börjar från början'],
      key: 'hasCurrentPortfolio',
      processAnswer: (answer: string) => answer.includes('Ja')
    },
    {
      id: 'portfolioHelp',
      question: 'Hur vill du att jag hjälper dig?',
      options: ['Börja enkelt med några få fonder', 'Skapa en diversifierad portfölj', 'Fokusera på tillväxtbolag', 'Prioritera utdelningsinkomst'],
      key: 'portfolioHelp',
      showIf: () => conversationData.hasCurrentPortfolio === false && conversationData.isBeginnerInvestor === true,
      processAnswer: (answer: string) => {
        if (answer.includes('enkelt')) return 'simple_start';
        if (answer.includes('diversifierad')) return 'diverse_portfolio';
        if (answer.includes('tillväxt')) return 'growth_focused';
        return 'dividend_income';
      }
    },
    {
      id: 'portfolioSize',
      question: 'Ungefär hur stor är din nuvarande portfölj?',
      options: ['Under 100 000 kr', '100 000 - 500 000 kr', '500 000 - 1 miljon kr', 'Över 1 miljon kr'],
      key: 'portfolioSize',
      showIf: () => conversationData.isBeginnerInvestor === false,
      processAnswer: (answer: string) => {
        if (answer.includes('Under 100')) return 'small';
        if (answer.includes('100 000 - 500')) return 'medium';
        if (answer.includes('500 000 - 1')) return 'large';
        return 'very_large';
      }
    },
    {
      id: 'rebalancing',
      question: 'Hur ofta vill du justera din portfölj?',
      options: ['Månadsvis', 'Kvartalsvis', 'Årligen', 'Sällan, bara vid stora förändringar'],
      key: 'rebalancingFrequency',
      showIf: () => conversationData.isBeginnerInvestor === false,
      processAnswer: (answer: string) => {
        if (answer.includes('Månadsvis')) return 'monthly';
        if (answer.includes('Kvartalsvis')) return 'quarterly';
        if (answer.includes('Årligen')) return 'yearly';
        return 'rarely';
      }
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation
    if (messages.length === 0) {
      const firstQuestion = questions[0];
      addBotMessage(firstQuestion.question, firstQuestion.options);
    }
  }, []);

  const addBotMessage = (content: string, options?: string[]) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    
    if (options) {
      // Add a small delay before showing options
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `${Date.now()}-options`,
          type: 'bot',
          content: `OPTIONS:${JSON.stringify(options)}`,
          timestamp: new Date()
        }]);
      }, 500);
    }
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

  const getCurrentQuestion = () => {
    let questionIndex = currentStep;
    while (questionIndex < questions.length) {
      const question = questions[questionIndex];
      if (!question.showIf || question.showIf()) {
        return question;
      }
      questionIndex++;
    }
    return null;
  };

  const handleAnswer = (answer: string) => {
    addUserMessage(answer);
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Process the answer
    let processedAnswer: any = answer;
    if (currentQuestion.processAnswer) {
      processedAnswer = currentQuestion.processAnswer(answer);
    }

    // Handle array fields
    if (currentQuestion.key === 'interests' || currentQuestion.key === 'companies') {
      if (currentQuestion.key === 'companies' || answer.includes(',')) {
        processedAnswer = answer.split(',').map(item => item.trim()).filter(item => item);
      } else {
        processedAnswer = [answer];
      }
    }

    // Update conversation data
    const updatedData = {
      ...conversationData,
      [currentQuestion.key]: processedAnswer
    };
    setConversationData(updatedData);

    // Move to next question
    setTimeout(() => {
      moveToNextQuestion();
    }, 1000);
  };

  const moveToNextQuestion = () => {
    let nextStep = currentStep + 1;
    
    // Skip questions that shouldn't be shown
    while (nextStep < questions.length) {
      const nextQuestion = questions[nextStep];
      if (!nextQuestion.showIf || nextQuestion.showIf()) {
        break;
      }
      nextStep++;
    }

    if (nextStep >= questions.length) {
      // Conversation complete
      completeConversation();
    } else {
      setCurrentStep(nextStep);
      const nextQuestion = questions[nextStep];
      
      setTimeout(() => {
        if (nextQuestion.customOnly) {
          addBotMessage(nextQuestion.question);
        } else {
          addBotMessage(nextQuestion.question, nextQuestion.options);
        }
      }, 500);
    }
  };

  const completeConversation = async () => {
    setIsGenerating(true);
    addBotMessage('Tack för alla svar! Jag skapar nu din personliga portföljstrategi...');
    
    const result = await generatePortfolioFromConversation(conversationData);
    
    if (result) {
      setPortfolioResult(result);
      setIsComplete(true);
      await refetch();
      
      setTimeout(() => {
        addBotMessage('🎉 Din personliga portföljstrategi är klar! Här är mina rekommendationer:');
      }, 1000);
    }
    setIsGenerating(false);
  };

  const handleCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim()) {
      handleAnswer(currentInput.trim());
      setCurrentInput('');
    }
  };

  const handleImplementStrategy = async () => {
    try {
      await refetch();
      toast({
        title: "Navigerar till implementering",
        description: "Din portföljstrategi är nu redo att implementera",
      });
      navigate('/portfolio-implementation');
    } catch (error) {
      console.error('Error refreshing portfolio data:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte ladda portföljdata. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const formatAIResponse = (content: string) => {
    const sections = content.split(/###|\*\*/).filter(section => section.trim());
    
    return (
      <div className="space-y-3">
        {sections.map((section, index) => {
          const trimmedSection = section.trim();
          if (!trimmedSection) return null;
          
          return (
            <div key={index} className="text-sm text-gray-700 leading-relaxed">
              {trimmedSection}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI Portfolio Rådgivare
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50">
              Personlig konsultation
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.type === 'bot' ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      {message.content.startsWith('OPTIONS:') ? (
                        <div className="space-y-2">
                          {JSON.parse(message.content.replace('OPTIONS:', '')).map((option: string, index: number) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="block w-full text-left justify-start h-auto p-3 whitespace-normal"
                              onClick={() => handleAnswer(option)}
                              disabled={isComplete}
                            >
                              {option}
                            </Button>
                          ))}
                          {getCurrentQuestion()?.allowCustom && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600 mb-2">Eller skriv ditt eget svar:</p>
                              <form onSubmit={handleCustomInput} className="flex gap-2">
                                <Input
                                  value={currentInput}
                                  onChange={(e) => setCurrentInput(e.target.value)}
                                  placeholder="Skriv här..."
                                  className="flex-1"
                                  disabled={isComplete}
                                />
                                <Button type="submit" size="sm" disabled={!currentInput.trim() || isComplete}>
                                  <Send className="w-4 h-4" />
                                </Button>
                              </form>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none">
                          <p className="text-gray-800 leading-relaxed">{message.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 justify-end">
                    <div className="bg-gray-100 p-3 rounded-2xl rounded-tr-none max-w-xs">
                      <p className="text-gray-800">{message.content}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Show AI response when complete */}
            {isComplete && portfolioResult && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-green-50 p-4 rounded-2xl rounded-tl-none border border-green-200">
                    {formatAIResponse(portfolioResult.aiResponse)}
                    
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <Button 
                        onClick={handleImplementStrategy}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        disabled={loading}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Implementera Strategin
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Brain className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <span>Analyserar dina svar och skapar strategi...</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Custom input for text-only questions */}
          {getCurrentQuestion()?.customOnly && !isComplete && (
            <form onSubmit={handleCustomInput} className="flex gap-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Skriv ditt svar här..."
                className="flex-1"
              />
              <Button type="submit" disabled={!currentInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPortfolioAdvisor;
