import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  User, 
  DollarSign, 
  TrendingUp, 
  Target, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Briefcase,
  Heart,
  Globe,
  Leaf,
  Brain,
  MessageSquare,
  Lightbulb,
  PieChart,
  Activity,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';
import { useNavigate } from 'react-router-dom';

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
  age?: number;
  experience?: string;
  sectors?: string[];
  interests?: string[];
  companies?: string[];
  portfolioHelp?: string;
  portfolioSize?: string;
  rebalancingFrequency?: string;
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

const ConversationalRiskAssessment = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationData, setConversationData] = useState<ConversationData>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [showPortfolioPreview, setShowPortfolioPreview] = useState(false);
  const { generatePortfolioFromConversation, loading } = useConversationalPortfolio();
  const navigate = useNavigate();

  // Helper function to extract actual stock/fund recommendations from AI response
  const extractRecommendations = (response: string): Array<{name: string, type: string, reasoning: string}> => {
    const recommendations: Array<{name: string, type: string, reasoning: string}> = [];
    
    // Look for stock symbols, fund names, and company names
    const stockPattern = /([A-Z]{2,5}(?:-[A-Z])?\.ST|[A-Z]{3,5})\s*(?:\([^)]+\))?/g;
    const fundPattern = /(Avanza|Nordnet|Swedbank|SEB|Länsförsäkringar|SPP|AMF|Handelsbanken)\s+[A-Za-z\s]+(?:fond|index|aktie)/gi;
    const companyPattern = /(Evolution Gaming|Spotify|Investor|Atlas Copco|H&M|Ericsson|Volvo|Sandvik|SKF|Telia|Essity|Getinge|Alfa Laval|SEB|Hexagon|Assa Abloy|ICA|Nibe|BioGaia|Addtech|Epiroc|Embracer|Sinch|Paradox|Tobii|Northvolt|Klarna)/gi;
    
    let match;
    
    // Extract stock symbols
    while ((match = stockPattern.exec(response)) !== null) {
      const symbol = match[1];
      if (symbol && !recommendations.some(r => r.name === symbol)) {
        recommendations.push({
          name: symbol,
          type: 'Aktie',
          reasoning: extractReasoningForStock(response, symbol)
        });
      }
    }
    
    // Extract fund names
    while ((match = fundPattern.exec(response)) !== null) {
      const fundName = match[0];
      if (fundName && !recommendations.some(r => r.name === fundName)) {
        recommendations.push({
          name: fundName,
          type: 'Fond',
          reasoning: extractReasoningForStock(response, fundName)
        });
      }
    }
    
    // Extract company names
    while ((match = companyPattern.exec(response)) !== null) {
      const companyName = match[0];
      if (companyName && !recommendations.some(r => r.name === companyName)) {
        recommendations.push({
          name: companyName,
          type: 'Aktie',
          reasoning: extractReasoningForStock(response, companyName)
        });
      }
    }
    
    return recommendations;
  };

  const extractReasoningForStock = (response: string, stockName: string): string => {
    const lines = response.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(stockName.toLowerCase())) {
        // Look for the next few lines that might contain reasoning
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          const line = lines[j].trim();
          if (line.length > 20 && !line.includes('**') && !line.includes('#')) {
            return line;
          }
        }
      }
    }
    return 'Rekommenderad baserat på din riskprofil och investeringsmål';
  };

  const steps = [
    {
      id: 'investor_type',
      title: 'Investerartyp',
      description: 'Berätta om din investeringserfarenhet',
      icon: <User className="w-5 h-5" />,
      component: () => (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Är du en nybörjare eller erfaren investerare?</h3>
            <p className="text-sm text-muted-foreground">
              Detta hjälper oss att anpassa rekommendationerna till din kunskapsnivå
            </p>
          </div>
          
          <RadioGroup 
            value={conversationData.isBeginnerInvestor?.toString()} 
            onValueChange={(value) => 
              setConversationData(prev => ({ 
                ...prev, 
                isBeginnerInvestor: value === 'true' 
              }))
            }
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="true" id="beginner" />
              <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                <div className="font-medium">Nybörjare</div>
                <div className="text-sm text-muted-foreground">Detta är första gången jag investerar</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="false" id="experienced" />
              <Label htmlFor="experienced" className="flex-1 cursor-pointer">
                <div className="font-medium">Erfaren</div>
                <div className="text-sm text-muted-foreground">Jag har investerat tidigare och förstår grunderna</div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      )
    },
    {
      id: 'basic_info',
      title: 'Grundläggande Information',
      description: 'Ålder och investeringsbelopp',
      icon: <User className="w-5 h-5" />,
      component: () => (
        <div className="space-y-4">
          <div>
            <Label htmlFor="age">Ålder</Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={conversationData.age || ''}
              onChange={(e) => setConversationData(prev => ({ 
                ...prev, 
                age: parseInt(e.target.value) || undefined 
              }))}
            />
          </div>
          
          <div>
            <Label htmlFor="monthlyAmount">Månadsbelopp för investering (SEK)</Label>
            <Input
              id="monthlyAmount"
              placeholder="5000"
              value={conversationData.monthlyAmount || ''}
              onChange={(e) => setConversationData(prev => ({ 
                ...prev, 
                monthlyAmount: e.target.value 
              }))}
            />
          </div>
        </div>
      )
    },
    ...(conversationData.isBeginnerInvestor ? [
      {
        id: 'economic_situation',
        title: 'Ekonomisk Situation',
        description: 'Din ekonomiska grund',
        icon: <DollarSign className="w-5 h-5" />,
        component: () => (
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthlyIncome">Månadsinkomst (SEK)</Label>
              <RadioGroup 
                value={conversationData.monthlyIncome} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, monthlyIncome: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="under_25000" id="income_1" />
                  <Label htmlFor="income_1">Under 25 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="25000_40000" id="income_2" />
                  <Label htmlFor="income_2">25 000 - 40 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="40000_60000" id="income_3" />
                  <Label htmlFor="income_3">40 000 - 60 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over_60000" id="income_4" />
                  <Label htmlFor="income_4">Över 60 000 SEK</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Tillgängligt kapital för investering</Label>
              <RadioGroup 
                value={conversationData.availableCapital} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, availableCapital: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="under_50000" id="capital_1" />
                  <Label htmlFor="capital_1">Under 50 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="50000_200000" id="capital_2" />
                  <Label htmlFor="capital_2">50 000 - 200 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="200000_500000" id="capital_3" />
                  <Label htmlFor="capital_3">200 000 - 500 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over_500000" id="capital_4" />
                  <Label htmlFor="capital_4">Över 500 000 SEK</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Har du en ekonomisk buffert?</Label>
              <RadioGroup 
                value={conversationData.emergencyFund} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, emergencyFund: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes_full" id="buffer_1" />
                  <Label htmlFor="buffer_1">Ja, 6+ månaders utgifter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes_partial" id="buffer_2" />
                  <Label htmlFor="buffer_2">Ja, men mindre än 6 månader</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="buffer_3" />
                  <Label htmlFor="buffer_3">Nej, ingen buffert</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Ekonomiska förpliktelser (välj alla som stämmer)</Label>
              <div className="space-y-2 mt-2">
                {[
                  { id: 'mortgage', label: 'Bolån' },
                  { id: 'student_loan', label: 'Studielån' },
                  { id: 'car_loan', label: 'Billån' },
                  { id: 'child_support', label: 'Barnkostnader' },
                  { id: 'other_debt', label: 'Andra lån' },
                  { id: 'none', label: 'Inga större förpliktelser' }
                ].map((obligation) => (
                  <div key={obligation.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={obligation.id}
                      checked={conversationData.financialObligations?.includes(obligation.id) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConversationData(prev => ({
                            ...prev,
                            financialObligations: [...(prev.financialObligations || []), obligation.id]
                          }));
                        } else {
                          setConversationData(prev => ({
                            ...prev,
                            financialObligations: prev.financialObligations?.filter(id => id !== obligation.id) || []
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={obligation.id}>{obligation.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'interests',
        title: 'Intressen & Preferenser',
        description: 'Vad intresserar dig?',
        icon: <Heart className="w-5 h-5" />,
        component: () => (
          <div className="space-y-4">
            <div>
              <Label>Vad är du intresserad av? (välj flera)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  'Teknik', 'Hälsa', 'Miljö', 'Gaming', 'Mode', 'Mat & Dryck',
                  'Resor', 'Bilar', 'Fastigheter', 'Finans', 'Utbildning', 'Sport'
                ].map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={conversationData.interests?.includes(interest) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConversationData(prev => ({
                            ...prev,
                            interests: [...(prev.interests || []), interest]
                          }));
                        } else {
                          setConversationData(prev => ({
                            ...prev,
                            interests: prev.interests?.filter(i => i !== interest) || []
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={interest} className="text-sm">{interest}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="companies">Vilka företag gillar du eller använder du ofta?</Label>
              <Textarea
                id="companies"
                placeholder="T.ex. Spotify, H&M, ICA, Volvo..."
                value={conversationData.companies?.join(', ') || ''}
                onChange={(e) => setConversationData(prev => ({ 
                  ...prev, 
                  companies: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
                }))}
              />
            </div>

            <div>
              <Label>Hållbarhet och miljö</Label>
              <RadioGroup 
                value={conversationData.sustainabilityPreference} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, sustainabilityPreference: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="very_important" id="sust_1" />
                  <Label htmlFor="sust_1">Mycket viktigt - vill bara investera hållbart</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="somewhat_important" id="sust_2" />
                  <Label htmlFor="sust_2">Ganska viktigt - föredrar hållbara alternativ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_important" id="sust_3" />
                  <Label htmlFor="sust_3">Inte så viktigt - fokuserar på avkastning</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Geografisk preferens</Label>
              <RadioGroup 
                value={conversationData.geographicPreference} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, geographicPreference: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sweden_only" id="geo_1" />
                  <Label htmlFor="geo_1">Bara svenska företag</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nordic" id="geo_2" />
                  <Label htmlFor="geo_2">Nordiska företag</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="global" id="geo_3" />
                  <Label htmlFor="geo_3">Globala företag</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )
      }
    ] : [
      {
        id: 'advanced_profile',
        title: 'Avancerad Profil',
        description: 'Din investeringserfarenhet',
        icon: <BarChart3 className="w-5 h-5" />,
        component: () => (
          <div className="space-y-4">
            <div>
              <Label>Hur länge har du investerat?</Label>
              <RadioGroup 
                value={conversationData.marketExperience} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, marketExperience: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-3_years" id="exp_1" />
                  <Label htmlFor="exp_1">1-3 år</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3-7_years" id="exp_2" />
                  <Label htmlFor="exp_2">3-7 år</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7-15_years" id="exp_3" />
                  <Label htmlFor="exp_3">7-15 år</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over_15_years" id="exp_4" />
                  <Label htmlFor="exp_4">Över 15 år</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Nuvarande portföljstorlek</Label>
              <RadioGroup 
                value={conversationData.portfolioSize} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, portfolioSize: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="size_1" />
                  <Label htmlFor="size_1">Under 100 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="size_2" />
                  <Label htmlFor="size_2">100 000 - 500 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="size_3" />
                  <Label htmlFor="size_3">500 000 - 1 000 000 SEK</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="very_large" id="size_4" />
                  <Label htmlFor="size_4">Över 1 000 000 SEK</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Hur ofta rebalanserar du din portfölj?</Label>
              <RadioGroup 
                value={conversationData.rebalancingFrequency} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, rebalancingFrequency: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="rebal_1" />
                  <Label htmlFor="rebal_1">Månadsvis</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quarterly" id="rebal_2" />
                  <Label htmlFor="rebal_2">Kvartalsvis</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="rebal_3" />
                  <Label htmlFor="rebal_3">Årligen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rarely" id="rebal_4" />
                  <Label htmlFor="rebal_4">Sällan eller aldrig</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Investeringsstil</Label>
              <RadioGroup 
                value={conversationData.investmentStyle} 
                onValueChange={(value) => setConversationData(prev => ({ ...prev, investmentStyle: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="value" id="style_1" />
                  <Label htmlFor="style_1">Värdeinvestering</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="growth" id="style_2" />
                  <Label htmlFor="style_2">Tillväxtinvestering</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dividend" id="style_3" />
                  <Label htmlFor="style_3">Utdelningsfokus</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="momentum" id="style_4" />
                  <Label htmlFor="style_4">Momentum/Trend</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )
      }
    ]),
    {
      id: 'goals_risk',
      title: 'Mål & Risk',
      description: 'Dina investeringsmål och risktolerans',
      icon: <Target className="w-5 h-5" />,
      component: () => (
        <div className="space-y-4">
          <div>
            <Label>Vad är ditt huvudsakliga investeringsmål?</Label>
            <RadioGroup 
              value={conversationData.investmentGoal} 
              onValueChange={(value) => setConversationData(prev => ({ ...prev, investmentGoal: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wealth_building" id="goal_1" />
                <Label htmlFor="goal_1">Bygga förmögenhet långsiktigt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="retirement" id="goal_2" />
                <Label htmlFor="goal_2">Spara till pension</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="house" id="goal_3" />
                <Label htmlFor="goal_3">Spara till bostad</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="goal_4" />
                <Label htmlFor="goal_4">Skapa passiv inkomst</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="education" id="goal_5" />
                <Label htmlFor="goal_5">Utbildning/barnens framtid</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Tidshorisont för investeringen</Label>
            <RadioGroup 
              value={conversationData.timeHorizon} 
              onValueChange={(value) => setConversationData(prev => ({ ...prev, timeHorizon: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short" id="time_1" />
                <Label htmlFor="time_1">1-3 år</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="time_2" />
                <Label htmlFor="time_2">3-10 år</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="long" id="time_3" />
                <Label htmlFor="time_3">Över 10 år</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Risktolerans</Label>
            <RadioGroup 
              value={conversationData.riskTolerance} 
              onValueChange={(value) => setConversationData(prev => ({ ...prev, riskTolerance: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conservative" id="risk_1" />
                <Label htmlFor="risk_1">Konservativ - säkerhet viktigast</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderate" id="risk_2" />
                <Label htmlFor="risk_2">Måttlig - balans mellan risk och avkastning</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aggressive" id="risk_3" />
                <Label htmlFor="risk_3">Aggressiv - högre risk för högre avkastning</Label>
              </div>
            </RadioGroup>
          </div>

          {conversationData.investmentGoal && (
            <div>
              <Label htmlFor="specificGoal">Specifikt mål (valfritt)</Label>
              <Input
                id="specificGoal"
                placeholder="T.ex. 500 000 SEK till 2030"
                value={conversationData.specificGoalAmount || ''}
                onChange={(e) => setConversationData(prev => ({ 
                  ...prev, 
                  specificGoalAmount: e.target.value 
                }))}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'psychology',
      title: 'Investeringspsykologi',
      description: 'Hur reagerar du på marknadsrörelser?',
      icon: <Brain className="w-5 h-5" />,
      component: () => (
        <div className="space-y-4">
          <div>
            <Label>Om börsen kraschar 30%, vad skulle du göra?</Label>
            <RadioGroup 
              value={conversationData.marketCrashReaction} 
              onValueChange={(value) => setConversationData(prev => ({ ...prev, marketCrashReaction: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy_more" id="crash_1" />
                <Label htmlFor="crash_1">Köpa mer - det är ett tillfälle!</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hold" id="crash_2" />
                <Label htmlFor="crash_2">Hålla kvar och vänta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell_some" id="crash_3" />
                <Label htmlFor="crash_3">Sälja en del för att minska risken</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell_all" id="crash_4" />
                <Label htmlFor="crash_4">Sälja allt för att undvika mer förlust</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Hur bekväm är du med volatilitet? (1 = mycket obekväm, 10 = mycket bekväm)</Label>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm">1</span>
              <input
                type="range"
                min="1"
                max="10"
                value={conversationData.volatilityComfort || 5}
                onChange={(e) => setConversationData(prev => ({ 
                  ...prev, 
                  volatilityComfort: parseInt(e.target.value) 
                }))}
                className="flex-1"
              />
              <span className="text-sm">10</span>
            </div>
            <div className="text-center mt-2">
              <Badge variant="outline">
                {conversationData.volatilityComfort || 5}/10
              </Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'current_portfolio',
      title: 'Nuvarande Portfölj',
      description: 'Har du redan investeringar?',
      icon: <PieChart className="w-5 h-5" />,
      component: () => (
        <div className="space-y-4">
          <div>
            <Label>Har du redan en portfölj?</Label>
            <RadioGroup 
              value={conversationData.hasCurrentPortfolio?.toString()} 
              onValueChange={(value) => setConversationData(prev => ({ 
                ...prev, 
                hasCurrentPortfolio: value === 'true' 
              }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="portfolio_yes" />
                <Label htmlFor="portfolio_yes">Ja, jag har redan investeringar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="portfolio_no" />
                <Label htmlFor="portfolio_no">Nej, jag börjar från början</Label>
              </div>
            </RadioGroup>
          </div>

          {conversationData.hasCurrentPortfolio && (
            <div className="space-y-4">
              <div>
                <Label>Vad vill du ha hjälp med?</Label>
                <RadioGroup 
                  value={conversationData.portfolioHelp} 
                  onValueChange={(value) => setConversationData(prev => ({ ...prev, portfolioHelp: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="optimize" id="help_1" />
                    <Label htmlFor="help_1">Optimera min befintliga portfölj</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="diversify" id="help_2" />
                    <Label htmlFor="help_2">Diversifiera bättre</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rebalance" id="help_3" />
                    <Label htmlFor="help_3">Rebalansera allokeringen</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="start_over" id="help_4" />
                    <Label htmlFor="help_4">Börja om från början</Label>
                  </div>
                </RadioGroup>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Du kan lägga till dina nuvarande innehav senare i portföljhanteraren för mer specifika rekommendationer.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    console.log('Final conversation data:', conversationData);
    
    const result = await generatePortfolioFromConversation(conversationData);
    
    if (result?.aiResponse) {
      setAiResponse(result.aiResponse);
      setShowPortfolioPreview(true);
    }
  };

  const handleCreatePortfolio = () => {
    navigate('/portfolio-implementation');
  };

  const renderConversationValue = (value: any): React.ReactNode => {
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Inga val gjorda';
      
      // Special handling for holdings array
      if (value.length > 0 && typeof value[0] === 'object' && 'name' in value[0]) {
        return (
          <div className="space-y-1">
            {value.map((holding: Holding, index: number) => (
              <div key={index} className="text-xs bg-muted/50 p-1 rounded">
                {holding.name} ({holding.quantity} st)
              </div>
            ))}
          </div>
        );
      }
      
      // Regular string arrays
      return value.join(', ');
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Ja' : 'Nej';
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      return value.toString();
    }
    
    return 'Inte angivet';
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (showPortfolioPreview && aiResponse) {
    const recommendations = extractRecommendations(aiResponse);
    
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Din Personliga Portföljstrategi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Portfolio Strategy */}
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {aiResponse}
              </div>
            </div>

            {/* Extracted Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Identifierade Rekommendationer ({recommendations.length})
                </h3>
                <div className="grid gap-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{rec.name}</div>
                        <Badge variant="secondary" className="text-xs">
                          {rec.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Summary */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Visa din riskprofil</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid gap-3">
                  {Object.entries(conversationData).map(([key, value]) => {
                    if (value === undefined || value === null || value === '') return null;
                    
                    const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    return (
                      <div key={key} className="flex justify-between items-start p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium text-muted-foreground">{displayKey}:</span>
                        <span className="text-right max-w-xs">
                          {renderConversationValue(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-3">
              <Button onClick={handleCreatePortfolio} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Skapa Portfölj
              </Button>
              <Button variant="outline" onClick={() => setShowPortfolioPreview(false)}>
                Tillbaka
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Personlig Portföljkonsultation
          </CardTitle>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Steg {currentStep + 1} av {steps.length}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
            {currentStepData.icon}
            <div>
              <h3 className="font-semibold">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
          </div>

          {currentStepData.component()}

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Föregående
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleComplete}
                disabled={loading}
                className="min-w-24"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Skapar...
                  </div>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Skapa Strategi
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Nästa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function canProceed(): boolean {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'investor_type':
        return conversationData.isBeginnerInvestor !== undefined;
      case 'basic_info':
        return !!(conversationData.age && conversationData.monthlyAmount);
      case 'economic_situation':
        return !!(conversationData.monthlyIncome && conversationData.availableCapital && conversationData.emergencyFund);
      case 'interests':
        return !!(conversationData.interests?.length || conversationData.companies?.length);
      case 'goals_risk':
        return !!(conversationData.investmentGoal && conversationData.timeHorizon && conversationData.riskTolerance);
      case 'psychology':
        return !!(conversationData.marketCrashReaction && conversationData.volatilityComfort);
      case 'advanced_profile':
        return true; // Optional step
      default:
        return true;
    }
  }
};

export default ConversationalRiskAssessment;
