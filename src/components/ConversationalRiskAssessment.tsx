import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

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
}

interface ConversationalRiskAssessmentProps {
  onComplete: (data: ConversationData) => void;
}

const ConversationalRiskAssessment: React.FC<ConversationalRiskAssessmentProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const [currentHoldings, setCurrentHoldings] = useState<Holding[]>([]);

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
      question: 'Är du ny inom investeringar?',
      type: 'radio',
      options: [
        { value: 'true', label: 'Ja, jag är relativt ny' },
        { value: 'false', label: 'Nej, jag har erfarenhet' }
      ],
      key: 'isBeginnerInvestor'
    },
    {
      id: 'goal',
      question: 'Vad är ditt huvudsakliga investeringsmål?',
      type: 'radio',
      options: [
        { value: 'retirement', label: 'Pensionssparande' },
        { value: 'wealth_building', label: 'Förmögenhetsuppbyggnad' },
        { value: 'income', label: 'Regelbunden inkomst' },
        { value: 'education', label: 'Utbildning/Barn' },
        { value: 'house', label: 'Bostadsköp' },
        { value: 'other', label: 'Annat mål' }
      ],
      key: 'investmentGoal'
    },
    {
      id: 'timeHorizon',
      question: 'Hur lång är din investeringshorisont?',
      type: 'radio',
      options: [
        { value: 'short', label: 'Kort (1-3 år)' },
        { value: 'medium', label: 'Medellång (3-7 år)' },
        { value: 'long', label: 'Lång (7+ år)' }
      ],
      key: 'timeHorizon'
    },
    {
      id: 'risk',
      question: 'Hur ser du på risk i dina investeringar?',
      type: 'radio',
      options: [
        { value: 'conservative', label: 'Konservativ - Vill undvika förluster' },
        { value: 'balanced', label: 'Balanserad - Vill ha bra avkastning med måttlig risk' },
        { value: 'aggressive', label: 'Aggressiv - Vill maximera avkastning trots högre risk' }
      ],
      key: 'riskTolerance'
    },
    {
      id: 'monthlyAmount',
      question: 'Hur mycket planerar du att investera per månad?',
      type: 'radio',
      options: [
        { value: '1000-3000', label: '1 000 - 3 000 kr' },
        { value: '3000-5000', label: '3 000 - 5 000 kr' },
        { value: '5000-10000', label: '5 000 - 10 000 kr' },
        { value: '10000+', label: '10 000 kr eller mer' }
      ],
      key: 'monthlyAmount'
    },
    {
      id: 'hasPortfolio',
      question: 'Har du en befintlig portfölj du vill optimera?',
      type: 'radio',
      options: [
        { value: 'true', label: 'Ja, jag har redan investeringar' },
        { value: 'false', label: 'Nej, jag börjar från början' }
      ],
      key: 'hasCurrentPortfolio'
    },
    {
      id: 'currentHoldings',
      question: 'Berätta om dina nuvarande innehav',
      type: 'holdings',
      key: 'currentHoldings',
      showIf: () => conversationData.hasCurrentPortfolio === true
    },
    {
      id: 'age',
      question: 'Vilken åldersgrupp tillhör du?',
      type: 'radio',
      options: [
        { value: '18-25', label: '18-25 år' },
        { value: '26-35', label: '26-35 år' },
        { value: '36-45', label: '36-45 år' },
        { value: '46-55', label: '46-55 år' },
        { value: '56+', label: '56+ år' }
      ],
      key: 'age'
    },
    {
      id: 'experience',
      question: 'Hur skulle du beskriva din investeringserfarenhet?',
      type: 'radio',
      options: [
        { value: 'beginner', label: 'Nybörjare' },
        { value: 'intermediate', label: 'Medel' },
        { value: 'advanced', label: 'Avancerad' }
      ],
      key: 'experience'
    },
    {
      id: 'sectors',
      question: 'Vilka sektorer intresserar dig mest? (välj flera)',
      type: 'checkbox',
      options: [
        { value: 'technology', label: 'Teknologi' },
        { value: 'healthcare', label: 'Hälsovård' },
        { value: 'finance', label: 'Finans' },
        { value: 'energy', label: 'Energi' },
        { value: 'consumer', label: 'Konsument' },
        { value: 'industrial', label: 'Industri' },
        { value: 'real_estate', label: 'Fastigheter' }
      ],
      key: 'sectors'
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
  };

  const canProceed = () => {
    if (currentQuestion.type === 'holdings') {
      return currentHoldings.some(h => h.name.trim() && h.quantity > 0 && h.purchasePrice > 0);
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
            Portfolio Rådgivning
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
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
          
          {currentQuestion.type === 'radio' && (
            <RadioGroup
              value={String(conversationData[currentQuestion.key as keyof ConversationData])}
              onValueChange={handleAnswer}
            >
              {currentQuestion.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'checkbox' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={(conversationData.sectors || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentSectors = conversationData.sectors || [];
                      const newSectors = checked
                        ? [...currentSectors, option.value]
                        : currentSectors.filter(s => s !== option.value);
                      handleAnswer(newSectors);
                    }}
                  />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'holdings' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Lägg till dina nuvarande investeringar med antal aktier och inköpspris för en bättre analys.
              </p>
              
              <div className="space-y-3">
                {currentHoldings.map((holding, index) => (
                  <div key={holding.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Innehav {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHolding(holding.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`name-${holding.id}`}>Företag/Fond namn</Label>
                        <Input
                          id={`name-${holding.id}`}
                          placeholder="t.ex. Volvo, SEB, Avanza Global"
                          value={holding.name}
                          onChange={(e) => updateHolding(holding.id, 'name', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`symbol-${holding.id}`}>Symbol (valfritt)</Label>
                        <Input
                          id={`symbol-${holding.id}`}
                          placeholder="t.ex. VOLV-B, SEB-A"
                          value={holding.symbol || ''}
                          onChange={(e) => updateHolding(holding.id, 'symbol', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`quantity-${holding.id}`}>Antal aktier/andelar</Label>
                        <Input
                          id={`quantity-${holding.id}`}
                          type="number"
                          placeholder="100"
                          min="0"
                          step="1"
                          value={holding.quantity || ''}
                          onChange={(e) => updateHolding(holding.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`price-${holding.id}`}>Inköpspris per aktie (SEK)</Label>
                        <Input
                          id={`price-${holding.id}`}
                          type="number"
                          placeholder="150.50"
                          min="0"
                          step="0.01"
                          value={holding.purchasePrice || ''}
                          onChange={(e) => updateHolding(holding.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    {holding.name && holding.quantity > 0 && holding.purchasePrice > 0 && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        Totalt värde vid köp: {(holding.quantity * holding.purchasePrice).toLocaleString('sv-SE')} SEK
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addHolding}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till innehav
              </Button>
              
              {currentHoldings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Inga innehav tillagda än. Klicka på "Lägg till innehav" för att börja.</p>
                </div>
              )}
            </div>
          )}
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
            {isLastStep ? 'Slutför' : 'Nästa'}
            {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationalRiskAssessment;
