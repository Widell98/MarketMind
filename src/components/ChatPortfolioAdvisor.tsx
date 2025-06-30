import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, User, Bot, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  hasOptions?: boolean;
  options?: Array<{ value: string; label: string }>;
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
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  
  const { generatePortfolioFromConversation, loading } = useConversationalPortfolio();
  const { refetch } = usePortfolio();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questions = [
    {
      id: 'intro',
      question: 'Hej! Jag är din AI-portföljrådgivare. Är du ny inom investeringar eller har du erfarenhet?',
      key: 'isBeginnerInvestor',
      hasOptions: true,
      options: [
        { value: 'beginner', label: 'Ny inom investeringar' },
        { value: 'experienced', label: 'Har erfarenhet av investeringar' }
      ],
      processAnswer: (answer: string) => answer === 'beginner'
    },
    {
      id: 'age',
      question: 'Vilken åldersgrupp tillhör du?',
      key: 'age',
      hasOptions: true,
      options: [
        { value: '18-25', label: '18-25 år' },
        { value: '26-35', label: '26-35 år' },
        { value: '36-45', label: '36-45 år' },
        { value: '46-55', label: '46-55 år' },
        { value: '56+', label: '56+ år' }
      ]
    },
    {
      id: 'interests',
      question: 'Vad intresserar dig mest? Detta hjälper mig föreslå relevanta investeringar. (t.ex. teknik, hälsa, miljö, bank, spel, fastigheter)',
      key: 'interests',
      hasOptions: false,
      showIf: () => conversationData.isBeginnerInvestor === true,
      processAnswer: (answer: string) => answer.split(',').map(item => item.trim()).filter(item => item)
    },
    {
      id: 'companies',
      question: 'Vilka företag eller varumärken använder du ofta eller tycker om? (Du kan nämna flera)',
      key: 'companies',
      hasOptions: false,
      showIf: () => conversationData.isBeginnerInvestor === true,
      processAnswer: (answer: string) => answer.split(',').map(item => item.trim()).filter(item => item)
    },
    {
      id: 'goal',
      question: 'Vad är ditt huvudsakliga mål med investeringarna?',
      key: 'investmentGoal',
      hasOptions: true,
      options: [
        { value: 'pension', label: 'Pensionssparande' },
        { value: 'wealth', label: 'Förmögenhetsuppbyggnad' },
        { value: 'income', label: 'Regelbunden inkomst' },
        { value: 'growth', label: 'Kapital tillväxt' }
      ]
    },
    {
      id: 'timeHorizon',
      question: 'Hur lång tid tänker du investera pengarna?',
      key: 'timeHorizon',
      hasOptions: true,
      options: [
        { value: 'short', label: 'Kort sikt (1-3 år)' },
        { value: 'medium', label: 'Medellång sikt (3-7 år)' },
        { value: 'long', label: 'Lång sikt (7+ år)' }
      ]
    },
    {
      id: 'risk',
      question: 'Hur känner du inför risk i dina investeringar?',
      key: 'riskTolerance',
      hasOptions: true,
      options: [
        { value: 'conservative', label: 'Konservativ (låg risk)' },
        { value: 'balanced', label: 'Balanserad (måttlig risk)' },
        { value: 'aggressive', label: 'Aggressiv (hög risk)' }
      ]
    },
    {
      id: 'monthlyAmount',
      question: 'Ungefär hur mycket tänker du investera per månad? (skriv summan i kronor)',
      key: 'monthlyAmount',
      hasOptions: false
    },
    {
      id: 'hasPortfolio',
      question: 'Har du redan några investeringar som du vill optimera?',
      key: 'hasCurrentPortfolio',
      hasOptions: true,
      options: [
        { value: 'yes', label: 'Ja, jag har befintliga investeringar' },
        { value: 'no', label: 'Nej, jag börjar från början' }
      ],
      processAnswer: (answer: string) => answer === 'yes'
    },
    {
      id: 'portfolioHelp',
      question: 'Hur vill du att jag hjälper dig?',
      key: 'portfolioHelp',
      hasOptions: true,
      showIf: () => conversationData.hasCurrentPortfolio === false && conversationData.isBeginnerInvestor === true,
      options: [
        { value: 'simple_start', label: 'Hjälp mig börja enkelt' },
        { value: 'diverse_portfolio', label: 'Skapa diversifierad portfölj' },
        { value: 'growth_focused', label: 'Fokusera på tillväxt' },
        { value: 'dividend_income', label: 'Prioritera utdelning' }
      ]
    },
    {
      id: 'portfolioSize',
      question: 'Ungefär hur stor är din nuvarande portfölj? (skriv summan i kronor)',
      key: 'portfolioSize',
      hasOptions: false,
      showIf: () => conversationData.isBeginnerInvestor === false,
      processAnswer: (answer: string) => {
        const amount = parseInt(answer.replace(/[^\d]/g, ''));
        if (amount < 100000) return 'small';
        if (amount < 500000) return 'medium';
        if (amount < 1000000) return 'large';
        return 'very_large';
      }
    },
    {
      id: 'rebalancing',
      question: 'Hur ofta vill du justera din portfölj?',
      key: 'rebalancingFrequency',
      hasOptions: true,
      showIf: () => conversationData.isBeginnerInvestor === false,
      options: [
        { value: 'monthly', label: 'Månadsvis' },
        { value: 'quarterly', label: 'Kvartalsvis' },
        { value: 'yearly', label: 'Årligen' },
        { value: 'rarely', label: 'Sällan' }
      ]
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
      addBotMessage(firstQuestion.question, firstQuestion.hasOptions, firstQuestion.options);
      setWaitingForAnswer(true);
    }
  }, []);

  const addBotMessage = (content: string, hasOptions: boolean = false, options?: Array<{ value: string; label: string }>) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      hasOptions,
      options
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
    if (!waitingForAnswer || isComplete) return;

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Find the label for the answer if it has options
    let displayAnswer = answer;
    if (currentQuestion.hasOptions && currentQuestion.options) {
      const option = currentQuestion.options.find(opt => opt.value === answer);
      if (option) {
        displayAnswer = option.label;
      }
    }

    addUserMessage(displayAnswer);
    setWaitingForAnswer(false);
    
    // Process the answer
    let processedAnswer: any = answer;
    if (currentQuestion.processAnswer) {
      processedAnswer = currentQuestion.processAnswer(answer);
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
        addBotMessage(nextQuestion.question, nextQuestion.hasOptions, nextQuestion.options);
        setWaitingForAnswer(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim() && waitingForAnswer) {
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
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <Card className="flex-1 flex flex-col">
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
        
        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Messages Container - Fixed height with scroll */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.type === 'bot' ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none">
                        <p className="text-gray-800 leading-relaxed">{message.content}</p>
                        
                        {/* Show predefined options if available */}
                        {message.hasOptions && message.options && waitingForAnswer && (
                          <div className="mt-3 space-y-2">
                            {message.options.map((option) => (
                              <Button
                                key={option.value}
                                variant="outline"
                                size="sm"
                                className="mr-2 mb-2 text-left justify-start"
                                onClick={() => handleAnswer(option.value)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
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

          {/* Chat input - Fixed at bottom */}
          {waitingForAnswer && !isComplete && (
            <div className="flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Skriv ditt svar här..."
                  className="flex-1"
                  disabled={isComplete}
                />
                <Button 
                  type="submit" 
                  disabled={!currentInput.trim() || isComplete}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPortfolioAdvisor;
