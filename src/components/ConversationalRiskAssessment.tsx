import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, Trash2, ArrowRight, ArrowLeft, MessageSquare, Type } from 'lucide-react';

interface Holding {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  symbol?: string;
}

interface ConversationData {
  isBeginnerInvestor?: boolean;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
  monthlyAmount?: string;
  hasCurrentPortfolio?: boolean;
  currentHoldings?: Holding[];
  age?: string;
  experience?: string;
  sectors?: string[];
  interests?: string[];
  companies?: string[];
  portfolioHelp?: string;
  portfolioSize?: string;
  rebalancingFrequency?: string;
}

interface ConversationalRiskAssessmentProps {
  onComplete: (data: ConversationData) => void;
}

const ConversationalRiskAssessment: React.FC<ConversationalRiskAssessmentProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const [currentHoldings, setCurrentHoldings] = useState<Holding[]>([]);
  const [freeTextInput, setFreeTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const addHolding = () => {
    const newHolding: Holding = {
      id: Date.now().toString(),
      name: '',
      quantity: 0,
      purchasePrice: 0,
      symbol: ''
    };
    setCurrentHoldings([...currentHoldings, newHolding]);
  };

  const updateHolding = (id: string, field: keyof Holding, value: string | number) => {
    setCurrentHoldings(holdings =>
      holdings.map(holding =>
        holding.id === id ? { ...holding, [field]: value } : holding
      )
    );
  };

  const removeHolding = (id: string) => {
    setCurrentHoldings(holdings => holdings.filter(holding => holding.id !== id));
  };

  const questions = [
    {
      id: 'beginner',
      question: 'Hej! Låt oss börja enkelt - är du ny inom investeringar?',
      type: 'chat',
      options: [
        { value: 'true', label: 'Ja, jag är relativt ny' },
        { value: 'false', label: 'Nej, jag har erfarenhet' }
      ],
      key: 'isBeginnerInvestor',
      allowTextInput: false
    },
    {
      id: 'interests',
      question: 'Vad intresserar dig mest i vardagen? (Detta hjälper mig föreslå relevanta investeringar)',
      type: 'multiple',
      options: [
        { value: 'technology', label: 'Teknik och innovation' },
        { value: 'healthcare', label: 'Hälsa och välmående' },
        { value: 'environment', label: 'Miljö och hållbarhet' },
        { value: 'finance', label: 'Bank och finans' },
        { value: 'gaming', label: 'Spel och underhållning' },
        { value: 'real_estate', label: 'Fastigheter' },
        { value: 'consumer_goods', label: 'Konsumentprodukter' },
        { value: 'automotive', label: 'Bilar och transport' }
      ],
      key: 'interests',
      showIf: () => conversationData.isBeginnerInvestor === true,
      allowTextInput: true,
      textInputPrompt: 'Eller skriv dina egna intressen:'
    },
    {
      id: 'companies',
      question: 'Vilka företag eller varumärken använder du ofta eller tycker om?',
      type: 'text',
      key: 'companies',
      showIf: () => conversationData.isBeginnerInvestor === true,
      allowTextInput: true,
      textInputPrompt: 'Berätta om företag du gillar:'
    },
    {
      id: 'goal',
      question: 'Vad är ditt huvudsakliga mål med investeringarna?',
      type: 'chat',
      options: [
        { value: 'retirement', label: 'Pensionssparande' },
        { value: 'wealth_building', label: 'Förmögenhetsuppbyggnad' },
        { value: 'income', label: 'Regelbunden inkomst' },
        { value: 'education', label: 'Utbildning/Barn' },
        { value: 'house', label: 'Bostadsköp' },
        { value: 'other', label: 'Annat mål' }
      ],
      key: 'investmentGoal',
      allowTextInput: true,
      textInputPrompt: 'Eller beskriv ditt eget mål:'
    },
    {
      id: 'timeHorizon',
      question: 'Intressant! Hur lång tid tänker du investera pengarna?',
      type: 'chat',
      options: [
        { value: 'short', label: 'Kort sikt (1-3 år)' },
        { value: 'medium', label: 'Medellång sikt (3-7 år)' },
        { value: 'long', label: 'Lång sikt (7+ år)' }
      ],
      key: 'timeHorizon',
      allowTextInput: false
    },
    {
      id: 'risk',
      question: 'Bra att veta! Hur känner du inför risk i dina investeringar?',
      type: 'chat',
      options: [
        { value: 'conservative', label: 'Konservativ - Vill undvika förluster' },
        { value: 'balanced', label: 'Balanserad - Okej med måttlig risk för bättre avkastning' },
        { value: 'aggressive', label: 'Aggressiv - Vill maximera avkastning trots högre risk' }
      ],
      key: 'riskTolerance',
      allowTextInput: false
    },
    {
      id: 'monthlyAmount',
      question: 'Ungefär hur mycket tänker du investera per månad?',
      type: 'chat',
      options: [
        { value: '1000-3000', label: '1 000 - 3 000 kr' },
        { value: '3000-5000', label: '3 000 - 5 000 kr' },
        { value: '5000-10000', label: '5 000 - 10 000 kr' },
        { value: '10000+', label: '10 000 kr eller mer' }
      ],
      key: 'monthlyAmount',
      allowTextInput: true,
      textInputPrompt: 'Eller ange ett specifikt belopp:'
    },
    {
      id: 'hasPortfolio',
      question: 'Har du redan några investeringar som du vill optimera?',
      type: 'chat',
      options: [
        { value: 'true', label: 'Ja, jag har redan investeringar' },
        { value: 'false', label: 'Nej, jag börjar från början' }
      ],
      key: 'hasCurrentPortfolio',
      allowTextInput: false
    },
    {
      id: 'portfolioHelp',
      question: 'Hur vill du att jag hjälper dig med din nya portfölj?',
      type: 'chat',
      options: [
        { value: 'simple_start', label: 'Börja enkelt med några få fonder' },
        { value: 'diverse_portfolio', label: 'Skapa en diversifierad portfölj' },
        { value: 'growth_focused', label: 'Fokusera på tillväxtbolag' },
        { value: 'dividend_income', label: 'Prioritera utdelningsinkomst' }
      ],
      key: 'portfolioHelp',
      showIf: () => conversationData.hasCurrentPortfolio === false && conversationData.isBeginnerInvestor === true,
      allowTextInput: true,
      textInputPrompt: 'Eller beskriv hur du vill att jag ska hjälpa dig:'
    },
    {
      id: 'currentHoldings',
      question: 'Kan du berätta vilka investeringar du har idag?',
      type: 'holdings',
      key: 'currentHoldings',
      showIf: () => conversationData.hasCurrentPortfolio === true,
      allowTextInput: false
    },
    {
      id: 'portfolioSize',
      question: 'Ungefär hur stor är din nuvarande portfölj?',
      type: 'chat',
      options: [
        { value: 'small', label: 'Under 100 000 kr' },
        { value: 'medium', label: '100 000 - 500 000 kr' },
        { value: 'large', label: '500 000 - 1 miljon kr' },
        { value: 'very_large', label: 'Över 1 miljon kr' }
      ],
      key: 'portfolioSize',
      showIf: () => conversationData.isBeginnerInvestor === false,
      allowTextInput: true,
      textInputPrompt: 'Eller ange en specifik summa:'
    },
    {
      id: 'rebalancing',
      question: 'Hur ofta vill du justera din portfölj?',
      type: 'chat',
      options: [
        { value: 'monthly', label: 'Månadsvis' },
        { value: 'quarterly', label: 'Kvartalsvis' },
        { value: 'yearly', label: 'Årligen' },
        { value: 'rarely', label: 'Sällan, bara vid stora förändringar' }
      ],
      key: 'rebalancingFrequency',
      showIf: () => conversationData.isBeginnerInvestor === false,
      allowTextInput: false
    },
    {
      id: 'age',
      question: 'Vilken åldersgrupp tillhör du?',
      type: 'chat',
      options: [
        { value: '18-25', label: '18-25 år' },
        { value: '26-35', label: '26-35 år' },
        { value: '36-45', label: '36-45 år' },
        { value: '46-55', label: '46-55 år' },
        { value: '56+', label: '56+ år' }
      ],
      key: 'age',
      allowTextInput: false
    }
  ];

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleAnswer = (value: any) => {
    // Convert string values to boolean for specific fields
    let processedValue = value;
    if (currentQuestion.key === 'isBeginnerInvestor' || currentQuestion.key === 'hasCurrentPortfolio') {
      processedValue = value === 'true';
    }
    
    const updatedData = { ...conversationData, [currentQuestion.key]: processedValue };
    setConversationData(updatedData);
    setShowTextInput(false);
    setFreeTextInput('');
  };

  const handleTextSubmit = () => {
    if (!freeTextInput.trim()) return;

    let processedValue: any = freeTextInput.trim();
    
    // For multiple choice questions, convert text to array and add to existing values
    if (currentQuestion.type === 'multiple') {
      const existingValues = conversationData[currentQuestion.key as keyof ConversationData] as string[] || [];
      const textValues = processedValue.split(',').map((v: string) => v.trim()).filter((v: string) => v);
      processedValue = [...existingValues, ...textValues];
    }
    // For text-type questions expecting arrays (like companies), convert to array
    else if (currentQuestion.key === 'companies' || currentQuestion.key === 'interests') {
      const textValues = processedValue.split(',').map((v: string) => v.trim()).filter((v: string) => v);
      processedValue = textValues;
    }
    // For other questions, keep as string

    const updatedData = { ...conversationData, [currentQuestion.key]: processedValue };
    setConversationData(updatedData);
    setShowTextInput(false);
    setFreeTextInput('');
  };

  const handleNext = () => {
    if (currentQuestion.type === 'holdings') {
      const validHoldings = currentHoldings.filter(h => h.name.trim() && h.quantity > 0 && h.purchasePrice > 0);
      setConversationData({ ...conversationData, currentHoldings: validHoldings });
    }

    if (isLastStep) {
      const finalData = currentQuestion.type === 'holdings' 
        ? { ...conversationData, currentHoldings: currentHoldings.filter(h => h.name.trim() && h.quantity > 0 && h.purchasePrice > 0) }
        : conversationData;
      onComplete(finalData);
    } else {
      // Skip holdings step if user doesn't have existing portfolio
      let nextStep = currentStep + 1;
      while (nextStep < questions.length && questions[nextStep].showIf && !questions[nextStep].showIf!()) {
        nextStep++;
      }
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      let prevStep = currentStep - 1;
      while (prevStep >= 0 && questions[prevStep].showIf && !questions[prevStep].showIf!()) {
        prevStep--;
      }
      setCurrentStep(Math.max(0, prevStep));
    }
    setShowTextInput(false);
    setFreeTextInput('');
  };

  const canProceed = () => {
    if (currentQuestion.type === 'holdings') {
      return currentHoldings.length === 0 || currentHoldings.some(h => h.name.trim() && h.quantity > 0 && h.purchasePrice > 0);
    }
    return conversationData[currentQuestion.key as keyof ConversationData] !== undefined;
  };

  // Skip questions that shouldn't be shown
  if (currentQuestion.showIf && !currentQuestion.showIf()) {
    let nextStep = currentStep + 1;
    while (nextStep < questions.length && questions[nextStep].showIf && !questions[nextStep].showIf!()) {
      nextStep++;
    }
    if (nextStep < questions.length) {
      setCurrentStep(nextStep);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Portfolio Rådgivning
          </CardTitle>
          <Badge variant="outline">
            {currentStep + 1} av {questions.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chat-style question display */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none flex-1">
              <p className="text-gray-800 leading-relaxed">{currentQuestion.question}</p>
            </div>
          </div>
          
          {/* Answer options */}
          <div className="space-y-3 ml-11">
            {currentQuestion.type === 'chat' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      String(conversationData[currentQuestion.key as keyof ConversationData]) === option.value 
                        ? "default" 
                        : "outline"
                    }
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleAnswer(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
                
                {currentQuestion.allowTextInput && (
                  <div className="mt-3 pt-3 border-t">
                    {!showTextInput ? (
                      <Button
                        variant="ghost"
                        onClick={() => setShowTextInput(true)}
                        className="w-full justify-start text-left h-auto p-3 text-blue-600 hover:text-blue-700"
                      >
                        <Type className="w-4 h-4 mr-2" />
                        {currentQuestion.textInputPrompt || 'Skriv ditt eget svar...'}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm text-blue-600">
                          {currentQuestion.textInputPrompt || 'Ditt svar:'}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={freeTextInput}
                            onChange={(e) => setFreeTextInput(e.target.value)}
                            placeholder="Skriv här..."
                            onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleTextSubmit}
                            disabled={!freeTextInput.trim()}
                            size="sm"
                          >
                            Skicka
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowTextInput(false);
                            setFreeTextInput('');
                          }}
                          className="text-gray-500"
                        >
                          Avbryt
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div className="space-y-2">
                {!showTextInput ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowTextInput(true)}
                    className="w-full justify-start text-left h-auto p-3"
                  >
                    <Type className="w-4 h-4 mr-2" />
                    {currentQuestion.textInputPrompt || 'Skriv ditt svar...'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm text-blue-600">
                      {currentQuestion.textInputPrompt || 'Ditt svar:'}
                    </Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={freeTextInput}
                        onChange={(e) => setFreeTextInput(e.target.value)}
                        placeholder="T.ex. Apple, Spotify, Tesla..."
                        className="flex-1 min-h-[80px]"
                      />
                      <Button
                        onClick={handleTextSubmit}
                        disabled={!freeTextInput.trim()}
                        size="sm"
                      >
                        Skicka
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowTextInput(false);
                        setFreeTextInput('');
                      }}
                      className="text-gray-500"
                    >
                      Avbryt
                    </Button>
                  </div>
                )}

                {/* Show entered companies/interests */}
                {conversationData[currentQuestion.key as keyof ConversationData] && 
                 Array.isArray(conversationData[currentQuestion.key as keyof ConversationData]) && 
                 (conversationData[currentQuestion.key as keyof ConversationData] as string[]).length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <Label className="text-xs text-blue-600 font-medium">Dina val:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(conversationData[currentQuestion.key as keyof ConversationData] as string[])
                        .map((value, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {value}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentQuestion.type === 'multiple' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      (conversationData[currentQuestion.key as keyof ConversationData] as string[] || []).includes(option.value)
                        ? "default" 
                        : "outline"
                    }
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => {
                      const currentValues = conversationData[currentQuestion.key as keyof ConversationData] as string[] || [];
                      const newValues = currentValues.includes(option.value)
                        ? currentValues.filter(s => s !== option.value)
                        : [...currentValues, option.value];
                      handleAnswer(newValues);
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
                
                {currentQuestion.allowTextInput && (
                  <div className="mt-3 pt-3 border-t">
                    {!showTextInput ? (
                      <Button
                        variant="ghost"
                        onClick={() => setShowTextInput(true)}
                        className="w-full justify-start text-left h-auto p-3 text-blue-600 hover:text-blue-700"
                      >
                        <Type className="w-4 h-4 mr-2" />
                        {currentQuestion.textInputPrompt || 'Lägg till egna alternativ...'}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm text-blue-600">
                          {currentQuestion.textInputPrompt || 'Lägg till egna alternativ (separera med komma):'}
                        </Label>
                        <div className="flex gap-2">
                          <Textarea
                            value={freeTextInput}
                            onChange={(e) => setFreeTextInput(e.target.value)}
                            placeholder="T.ex. IKEA, ICA, Handelsbanken..."
                            className="flex-1 min-h-[80px]"
                          />
                          <Button
                            onClick={handleTextSubmit}
                            disabled={!freeTextInput.trim()}
                            size="sm"
                          >
                            Lägg till
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowTextInput(false);
                            setFreeTextInput('');
                          }}
                          className="text-gray-500"
                        >
                          Avbryt
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Show selected custom values */}
                {conversationData[currentQuestion.key as keyof ConversationData] && 
                 Array.isArray(conversationData[currentQuestion.key as keyof ConversationData]) && 
                 (conversationData[currentQuestion.key as keyof ConversationData] as string[]).some(val => 
                   !currentQuestion.options?.some(opt => opt.value === val)
                 ) && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <Label className="text-xs text-blue-600 font-medium">Dina egna tillägg:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(conversationData[currentQuestion.key as keyof ConversationData] as string[])
                        .filter(val => !currentQuestion.options?.some(opt => opt.value === val))
                        .map((customValue, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {customValue}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentQuestion.type === 'holdings' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Lägg till dina nuvarande investeringar med antal och inköpspris för bättre analys.
                  </p>
                  
                  <div className="space-y-3">
                    {currentHoldings.map((holding, index) => (
                      <div key={holding.id} className="p-3 border rounded-lg bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Innehav {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHolding(holding.id)}
                            className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`name-${holding.id}`} className="text-xs">Företag/Fond</Label>
                            <Input
                              id={`name-${holding.id}`}
                              placeholder="t.ex. Volvo, SEB"
                              value={holding.name}
                              onChange={(e) => updateHolding(holding.id, 'name', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`symbol-${holding.id}`} className="text-xs">Symbol (valfritt)</Label>
                            <Input
                              id={`symbol-${holding.id}`}
                              placeholder="VOLV-B"
                              value={holding.symbol || ''}
                              onChange={(e) => updateHolding(holding.id, 'symbol', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`quantity-${holding.id}`} className="text-xs">Antal aktier</Label>
                            <Input
                              id={`quantity-${holding.id}`}
                              type="number"
                              placeholder="100"
                              min="0"
                              step="1"
                              value={holding.quantity || ''}
                              onChange={(e) => updateHolding(holding.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`price-${holding.id}`} className="text-xs">Inköpspris (SEK)</Label>
                            <Input
                              id={`price-${holding.id}`}
                              type="number"
                              placeholder="150.50"
                              min="0"
                              step="0.01"
                              value={holding.purchasePrice || ''}
                              onChange={(e) => updateHolding(holding.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={addHolding}
                    className="w-full mt-3"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Lägg till innehav
                  </Button>
                  
                  {currentHoldings.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Inga innehav än. Du kan också hoppa över detta steg.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Föregående
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {isLastStep ? 'Skapa min strategi' : 'Nästa'}
            {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationalRiskAssessment;
