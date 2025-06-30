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
      // Show immediate feedback
      toast({
        title: "Implementerar strategi",
        description: "Din portföljstrategi implementeras och profilen uppdateras...",
      });

      // Refresh portfolio data to ensure we have the latest
      await refetch();
      
      // Navigate to implementation page
      navigate('/portfolio-implementation');
      
      // Show success message after navigation
      setTimeout(() => {
        toast({
          title: "Strategi implementerad!",
          description: "Din portföljstrategi är nu aktiv och redo att användas",
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error implementing strategy:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte implementera strategin helt. Kontrollera din profil på implementeringssidan.",
        variant: "destructive",
      });
      
      // Navigate anyway since the portfolio might still be created
      navigate('/portfolio-implementation');
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
    <div className="flex flex-col h-[75vh] lg:h-[80vh] xl:h-[85vh] bg-transparent overflow-hidden">
      {/* Chat Header - matching AIChat style */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-primary shadow-sm">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">AI Portfolio Rådgivare</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Personlig konsultation</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
            Konsultation
          </Badge>
        </div>
      </div>

      {/* Messages Container - matching AIChat style */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.type === 'bot' ? (
                <div className="flex gap-2 sm:gap-3 items-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-3 sm:p-4 border shadow-sm">
                      <div className="prose prose-sm max-w-none text-foreground">
                        <p className="text-sm sm:text-base leading-relaxed mb-0">{message.content}</p>
                      </div>
                      
                      {/* Show predefined options if available */}
                      {message.hasOptions && message.options && waitingForAnswer && (
                        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                          {message.options.map((option) => (
                            <Button
                              key={option.value}
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 bg-background/80 hover:bg-background border-border/50 hover:border-border transition-all duration-200"
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
                <div className="flex gap-2 sm:gap-3 items-start justify-end">
                  <div className="bg-primary/10 backdrop-blur-sm rounded-2xl rounded-tr-lg p-2.5 sm:p-3 border border-primary/20 shadow-sm max-w-[80%] sm:max-w-md">
                    <p className="text-sm sm:text-base text-foreground">{message.content}</p>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Show AI response when complete */}
          {isComplete && portfolioResult && (
            <div className="flex gap-2 sm:gap-3 items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-green-50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                  <div className="prose prose-sm max-w-none">
                    {formatAIResponse(portfolioResult.aiResponse)}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <Button 
                      onClick={handleImplementStrategy}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={loading}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {loading ? "Implementerar..." : "Implementera Strategin"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex gap-2 sm:gap-3 items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-3 sm:p-4 border shadow-sm">
                <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                  <span>Analyserar dina svar och skapar strategi...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input - matching AIChat style */}
      {waitingForAnswer && !isComplete && (
        <div className="flex-shrink-0 p-3 sm:p-4 border-t bg-card/30 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Skriv ditt svar här..."
                className="pr-12 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors text-sm sm:text-base h-9 sm:h-10"
                disabled={isComplete}
              />
            </div>
            <Button 
              type="submit" 
              size="sm"
              disabled={!currentInput.trim() || isComplete}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 h-9 sm:h-10 px-3 sm:px-4"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatPortfolioAdvisor;
