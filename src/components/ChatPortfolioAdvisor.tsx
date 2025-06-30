
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
      processAnswer: (answer: string) => {
        const lowerAnswer = answer.toLowerCase();
        return lowerAnswer.includes('ny') || lowerAnswer.includes('nybörjare') || lowerAnswer.includes('börjar');
      }
    },
    {
      id: 'age',
      question: 'Vilken åldersgrupp tillhör du? (18-25, 26-35, 36-45, 46-55, eller 56+)',
      key: 'age'
    },
    {
      id: 'interests',
      question: 'Vad intresserar dig mest? Detta hjälper mig föreslå relevanta investeringar. (t.ex. teknik, hälsa, miljö, bank, spel, fastigheter)',
      key: 'interests',
      showIf: () => conversationData.isBeginnerInvestor === true,
      processAnswer: (answer: string) => answer.split(',').map(item => item.trim()).filter(item => item)
    },
    {
      id: 'companies',
      question: 'Vilka företag eller varumärken använder du ofta eller tycker om? (Du kan nämna flera)',
      key: 'companies',
      showIf: () => conversationData.isBeginnerInvestor === true,
      processAnswer: (answer: string) => answer.split(',').map(item => item.trim()).filter(item => item)
    },
    {
      id: 'goal',
      question: 'Vad är ditt huvudsakliga mål med investeringarna? (t.ex. pensionssparande, förmögenhetsuppbyggnad, regelbunden inkomst)',
      key: 'investmentGoal'
    },
    {
      id: 'timeHorizon',
      question: 'Hur lång tid tänker du investera pengarna? (kort sikt 1-3 år, medellång sikt 3-7 år, eller lång sikt 7+ år)',
      key: 'timeHorizon',
      processAnswer: (answer: string) => {
        const lowerAnswer = answer.toLowerCase();
        if (lowerAnswer.includes('1-3') || lowerAnswer.includes('kort')) return 'short';
        if (lowerAnswer.includes('3-7') || lowerAnswer.includes('medel')) return 'medium';
        return 'long';
      }
    },
    {
      id: 'risk',
      question: 'Hur känner du inför risk i dina investeringar? (konservativ, balanserad, eller aggressiv)',
      key: 'riskTolerance',
      processAnswer: (answer: string) => {
        const lowerAnswer = answer.toLowerCase();
        if (lowerAnswer.includes('konservativ') || lowerAnswer.includes('låg')) return 'conservative';
        if (lowerAnswer.includes('balanserad') || lowerAnswer.includes('måttlig')) return 'balanced';
        return 'aggressive';
      }
    },
    {
      id: 'monthlyAmount',
      question: 'Ungefär hur mycket tänker du investera per månad? (i kronor)',
      key: 'monthlyAmount'
    },
    {
      id: 'hasPortfolio',
      question: 'Har du redan några investeringar som du vill optimera?',
      key: 'hasCurrentPortfolio',
      processAnswer: (answer: string) => {
        const lowerAnswer = answer.toLowerCase();
        return lowerAnswer.includes('ja') || lowerAnswer.includes('har');
      }
    },
    {
      id: 'portfolioHelp',
      question: 'Hur vill du att jag hjälper dig? (börja enkelt, skapa diversifierad portfölj, fokusera på tillväxt, eller prioritera utdelning)',
      key: 'portfolioHelp',
      showIf: () => conversationData.hasCurrentPortfolio === false && conversationData.isBeginnerInvestor === true,
      processAnswer: (answer: string) => {
        const lowerAnswer = answer.toLowerCase();
        if (lowerAnswer.includes('enkelt')) return 'simple_start';
        if (lowerAnswer.includes('diversifierad')) return 'diverse_portfolio';
        if (lowerAnswer.includes('tillväxt')) return 'growth_focused';
        return 'dividend_income';
      }
    },
    {
      id: 'portfolioSize',
      question: 'Ungefär hur stor är din nuvarande portfölj? (i kronor)',
      key: 'portfolioSize',
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
      question: 'Hur ofta vill du justera din portfölj? (månadsvis, kvartalsvis, årligen, eller sällan)',
      key: 'rebalancingFrequency',
      showIf: () => conversationData.isBeginnerInvestor === false,
      processAnswer: (answer: string) => {
        const lowerAnswer = answer.toLowerCase();
        if (lowerAnswer.includes('månad')) return 'monthly';
        if (lowerAnswer.includes('kvartal')) return 'quarterly';
        if (lowerAnswer.includes('år')) return 'yearly';
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
      addBotMessage(firstQuestion.question);
      setWaitingForAnswer(true);
    }
  }, []);

  const addBotMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
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

    addUserMessage(answer);
    setWaitingForAnswer(false);
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

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
        addBotMessage(nextQuestion.question);
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
                      <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none">
                        <p className="text-gray-800 leading-relaxed">{message.content}</p>
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

          {/* Chat input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={waitingForAnswer ? "Skriv ditt svar här..." : "Vänta på nästa fråga..."}
              className="flex-1"
              disabled={!waitingForAnswer || isComplete}
            />
            <Button 
              type="submit" 
              disabled={!currentInput.trim() || !waitingForAnswer || isComplete}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPortfolioAdvisor;
