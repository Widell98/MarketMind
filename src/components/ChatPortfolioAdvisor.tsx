import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Brain, CheckCircle, Loader2, MessageSquare } from 'lucide-react';
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';
import { useNavigate } from 'react-router-dom';
import AIResponseFormatter from './AIResponseFormatter';

interface Question {
  id: string;
  text: string;
  type: 'boolean' | 'text' | 'number' | 'select' | 'multiple';
  options?: string[];
  placeholder?: string;
  subText?: string;
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
  age?: number;
  experience?: string;
  sectors?: string[];
  interests?: string[];
  companies?: string[];
  portfolioHelp?: string;
  portfolioSize?: string;
  rebalancingFrequency?: string;
  // Enhanced fields
  monthlyIncome?: string;
  availableCapital?: string;
  emergencyFund?: string;
  financialObligations?: string[];
  sustainabilityPreference?: string;
  geographicPreference?: string;
  marketCrashReaction?: string;
  volatilityComfort?: number;
  marketExperience?: string;
  currentAllocation?: string;
  previousPerformance?: string;
  sectorExposure?: string[];
  investmentStyle?: string;
  dividendYieldRequirement?: string;
  maxDrawdownTolerance?: number;
  specificGoalAmount?: string;
  taxConsideration?: string;
}

const initialQuestions: Question[] = [
  {
    id: 'isBeginnerInvestor',
    text: 'Är du en nybörjare när det gäller investeringar?',
    type: 'boolean',
  },
  {
    id: 'age',
    text: 'Hur gammal är du?',
    type: 'number',
    placeholder: 'Ange din ålder',
  },
  {
    id: 'monthlyAmount',
    text: 'Ungefär hur mycket pengar kan du investera varje månad?',
    type: 'text',
    placeholder: 'Ange belopp i SEK',
  },
  {
    id: 'investmentGoal',
    text: 'Vad är ditt primära mål med dina investeringar?',
    type: 'select',
    options: [
      'Långsiktig tillväxt',
      'Generera passiv inkomst',
      'Spara till pensionen',
      'Annat',
    ],
  },
  {
    id: 'timeHorizon',
    text: 'Vilken tidshorisont har du för dina investeringar?',
    type: 'select',
    options: ['Kort (1-3 år)', 'Medellång (3-7 år)', 'Lång (7+ år)'],
  },
  {
    id: 'riskTolerance',
    text: 'Hur skulle du beskriva din risktolerans?',
    type: 'select',
    options: ['Låg', 'Medel', 'Hög'],
  },
  {
    id: 'hasCurrentPortfolio',
    text: 'Har du en befintlig investeringsportfölj?',
    type: 'boolean',
  },
  {
    id: 'portfolioHelp',
    text: 'Vad behöver du hjälp med?',
    type: 'select',
    options: ['Förvaltning', 'Optimering', 'Skapa en portfölj'],
  },
  {
    id: 'portfolioSize',
    text: 'Hur stor är din portfölj?',
    type: 'select',
    options: ['Liten', 'Mellan', 'Stor', 'Mycket stor'],
  },
  {
    id: 'rebalancingFrequency',
    text: 'Hur ofta vill du balansera om din portfölj?',
    type: 'select',
    options: ['Varje månad', 'Varje kvartal', 'Varje år', 'Aldrig'],
  },
  {
    id: 'interests',
    text: 'Vilka branscher eller företag intresserar dig?',
    type: 'multiple',
    options: [
      'Teknologi',
      'Hälsovård',
      'Energi',
      'Finans',
      'Fastigheter',
      'Konsumentvaror',
    ],
  },
  {
    id: 'companies',
    text: 'Vilka är dina favoritbolag?',
    type: 'multiple',
    options: [
      'Apple',
      'Microsoft',
      'Google',
      'Amazon',
      'Tesla',
      'Facebook',
    ],
  },
  {
    id: 'sustainabilityPreference',
    text: 'Hur viktigt är hållbarhet för dig?',
    type: 'select',
    options: ['Mycket viktigt', 'Viktigt', 'Inte så viktigt'],
  },
  {
    id: 'geographicPreference',
    text: 'Har du någon geografisk preferens?',
    type: 'select',
    options: ['Sverige', 'Norden', 'Europa', 'Globalt'],
  },
  {
    id: 'marketCrashReaction',
    text: 'Hur skulle du reagera på en kraftig börskrasch?',
    type: 'select',
    options: ['Sälja allt', 'Sälja en del', 'Behålla', 'Köpa mer'],
  },
  {
    id: 'volatilityComfort',
    text: 'Hur bekväm är du med hög volatilitet?',
    type: 'number',
    placeholder: 'Ange en siffra mellan 1-10',
  },
  {
    id: 'specificGoalAmount',
    text: 'Har du ett specifikt målbelopp du vill uppnå?',
    type: 'text',
    placeholder: 'Ange belopp i SEK',
  },
];

const ChatPortfolioAdvisor = () => {
  const [currentStep, setCurrentStep] = useState<'personal' | 'questions' | 'result'>('personal');
  const [isBeginner, setIsBeginner] = useState<boolean | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const { generatePortfolioFromConversation, loading } = useConversationalPortfolio();
  const [portfolioResult, setPortfolioResult] = useState<any>(null);
  const navigate = useNavigate();

  const currentQuestion = initialQuestions[currentQuestionIndex];

  const handleAnswer = (answer: any) => {
    setConversationData({ ...conversationData, [currentQuestion.id]: answer });
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < initialQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setCurrentStep('personal');
    }
  };

  const handleComplete = async () => {
    if (!conversationData || loading) return;

    console.log('Starting portfolio generation with conversation data:', conversationData);
    setLoading(true);

    try {
      const result = await generatePortfolioFromConversation(conversationData);
      
      if (result) {
        console.log('Portfolio generation successful:', result);
        setPortfolioResult(result);
        setCurrentStep('result');
      } else {
        console.error('Portfolio generation failed');
      }
    } catch (error) {
      console.error('Error in handleComplete:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'boolean':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{currentQuestion.text}</p>
            <div className="flex gap-4">
              <Button onClick={() => handleAnswer(true)}>Ja</Button>
              <Button variant="outline" onClick={() => handleAnswer(false)}>Nej</Button>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{currentQuestion.text}</p>
            <input
              type="text"
              placeholder={currentQuestion.placeholder}
              className="w-full p-3 border rounded-md"
              onChange={(e) =>
                setConversationData({
                  ...conversationData,
                  [currentQuestion.id]: e.target.value,
                })
              }
            />
            <Button onClick={goToNextQuestion}>Nästa</Button>
          </div>
        );
      case 'number':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{currentQuestion.text}</p>
            <input
              type="number"
              placeholder={currentQuestion.placeholder}
              className="w-full p-3 border rounded-md"
              onChange={(e) =>
                setConversationData({
                  ...conversationData,
                  [currentQuestion.id]: parseInt(e.target.value),
                })
              }
            />
            <Button onClick={goToNextQuestion}>Nästa</Button>
          </div>
        );
      case 'select':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{currentQuestion.text}</p>
            <select
              className="w-full p-3 border rounded-md"
              onChange={(e) =>
                handleAnswer(e.target.value)
              }
            >
              <option value="">Välj ett alternativ</option>
              {currentQuestion.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      case 'multiple':
        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{currentQuestion.text}</p>
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options?.map((option) => (
                <label key={option} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-md"
                    value={option}
                    onChange={(e) => {
                      const selectedOptions = conversationData[currentQuestion.id] as string[] || [];
                      if (e.target.checked) {
                        setConversationData({
                          ...conversationData,
                          [currentQuestion.id]: [...selectedOptions, option],
                        });
                      } else {
                        setConversationData({
                          ...conversationData,
                          [currentQuestion.id]: selectedOptions.filter((item) => item !== option),
                        });
                      }
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <Button onClick={goToNextQuestion}>Nästa</Button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPersonal = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Är du nybörjare eller erfaren?</h2>
          <p className="text-muted-foreground">
            Vi anpassar frågorna baserat på din erfarenhetsnivå
          </p>
        </div>
        <Button className="w-full" onClick={() => {
          setIsBeginner(true);
          setConversationData({ ...conversationData, isBeginnerInvestor: true });
          setCurrentStep('questions');
        }}>
          Jag är nybörjare
        </Button>
        <Button className="w-full" onClick={() => {
          setIsBeginner(false);
          setConversationData({ ...conversationData, isBeginnerInvestor: false });
          setCurrentStep('questions');
        }}>
          Jag är erfaren
        </Button>
      </div>
    );
  };

  const renderQuestions = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Fråga {currentQuestionIndex + 1} av {initialQuestions.length}</h2>
          <p className="text-muted-foreground">
            Svara på frågorna så gott du kan, AI:n anpassar sig efter dina svar
          </p>
        </div>

        {renderQuestion()}

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Föregående
          </Button>
          {currentQuestion.type !== 'boolean' && (
            <Button onClick={goToNextQuestion} disabled={loading}>
              {loading ? (
                <>
                  Laddar...
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : (
                <>
                  Nästa
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!portfolioResult) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Din Personliga Portföljstrategi</h2>
          <p className="text-muted-foreground">
            AI-advisorn har skapat en skräddarsydd investeringsstrategi baserat på din profil
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI-Genererad Portföljstrategi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIResponseFormatter response={portfolioResult.aiResponse} />
          </CardContent>
        </Card>

        {portfolioResult.stockRecommendations && portfolioResult.stockRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rekommenderade Aktier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {portfolioResult.stockRecommendations.map((stock, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{stock.name}</div>
                      {stock.symbol && (
                        <div className="text-sm text-muted-foreground">{stock.symbol}</div>
                      )}
                    </div>
                    <Badge variant="outline">{stock.sector || 'Okänd sektor'}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/portfolio-implementation')}
            className="flex-1"
          >
            Gå till Min Portfölj
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('personal')}
            className="flex-1"
          >
            Skapa Ny Profil
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      {currentStep === 'personal' && renderPersonal()}
      {currentStep === 'questions' && renderQuestions()}
      {currentStep === 'result' && renderResult()}
    </div>
  );
};

export default ChatPortfolioAdvisor;
