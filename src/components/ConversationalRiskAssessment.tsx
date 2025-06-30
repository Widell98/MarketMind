
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Building2, 
  Brain, 
  CheckCircle2, 
  ChevronDown, 
  Info, 
  RotateCcw, 
  Tag, 
  TrendingUp,
  Zap
} from 'lucide-react';
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ConversationalRiskAssessmentProps {
  onComplete: () => void;
  onReset: () => void;
}

interface RecommendedStock {
  name: string;
  symbol: string;
  allocation?: number;
  sector: string;
  reasoning?: string;
  isin?: string;
  fee?: string;
}

const ConversationalRiskAssessment: React.FC<ConversationalRiskAssessmentProps> = ({
  onComplete,
  onReset
}) => {
  const [message, setMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [riskProfile, setRiskProfile] = useState<{
    age: number | null;
    risk_tolerance: string;
    investment_horizon: string;
    monthly_investment_amount: number | null;
  }>({
    age: null,
    risk_tolerance: '',
    investment_horizon: '',
    monthly_investment_amount: null,
  });
  const [aiRecommendations, setAiRecommendations] = useState<RecommendedStock[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/sign-in');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleProfileChange = (field: string, value: any) => {
    setRiskProfile(prev => ({ ...prev, [field]: value }));
  };

  const sendMessageToAI = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/portfolio-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            userId: user?.id,
            chatHistory: [],
            analysisType: 'risk_assessment',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message. Status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.response) {
        setAiResponse(data.response);
        const recommendations = extractRecommendations(data.response);
        setAiRecommendations(recommendations);
      } else {
        console.warn('No response received from AI.');
        setAiResponse('Inget svar mottaget från AI.');
        setAiRecommendations([]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Något gick fel",
        description: "Kunde inte kommunicera med AI-tjänsten. Försök igen senare.",
        variant: "destructive",
      });
      setAiResponse(`Fel vid kommunikation med AI: ${error.message}`);
      setAiRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const extractRecommendations = (text: string): RecommendedStock[] => {
    if (!text) return [];
    
    const recommendations: RecommendedStock[] = [];
    
    // Enhanced patterns to match funds and stocks with ISIN codes and fees
    const patterns = [
      // Pattern for funds with ISIN and fees: "Name (t.ex. Fund Name, ISIN: CODE, avgift: X%)"
      /(?:t\.ex\.\s+)([^,\(]+?)(?:\s*,\s*ISIN:\s*([A-Z0-9]{12})\s*,\s*avgift:\s*([\d,\.]+%?))?/gi,
      // Pattern for ETFs: "Name ETF (t.ex. Fund Name)"
      /([^(]+?)\s*ETF\s*\(t\.ex\.\s+([^)]+)\)/gi,
      // Pattern for simple fund names: "Name fond/ETF"
      /([A-ZÅÄÖ][a-zåäöA-ZÅÄÖ\s&.-]+?)\s+(fond|ETF|fonder)/gi,
      // Pattern for percentage allocations: "X% Name"
      /(\d+)%\s+([A-ZÅÄÖ][a-zåäöA-ZÅÄÖ\s&.-]+?)(?:\s*\(|$)/gi
    ];

    // Known Swedish and international fund/stock providers
    const validProviders = [
      'länsförsäkringar', 'amf', 'avanza', 'nordnet', 'spiltan', 'handelsbanken',
      'seb', 'swedbank', 'ishares', 'vanguard', 'xact', 'spdr', 'lyxor',
      'invesco', 'blackrock', 'fidelity', 'jpmorgan'
    ];

    // Sector mapping for better categorization
    const sectorMapping: { [key: string]: string } = {
      'global': 'Global Fond',
      'teknologi': 'Teknologi',
      'tech': 'Teknologi', 
      'innovation': 'Innovation',
      'småbolag': 'Småbolag',
      'small cap': 'Småbolag',
      'tillväxt': 'Tillväxt',
      'growth': 'Tillväxt',
      'clean energy': 'Ren Energi',
      'grön energi': 'Ren Energi',
      'emerging': 'Tillväxtmarknader',
      'sverige': 'Sverige',
      'nasdaq': 'Teknologi',
      'europa': 'Europa',
      'asien': 'Asien',
      'fastighetsfond': 'Fastighet',
      'private equity': 'Private Equity'
    };

    // Process each pattern
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [, name1, name2OrIsin, feeOrName] = match;
        
        let fundName = name1?.trim() || '';
        let isin = '';
        let fee = '';
        
        // Handle different match groups based on pattern
        if (name2OrIsin && name2OrIsin.match(/^[A-Z0-9]{12}$/)) {
          // ISIN pattern
          isin = name2OrIsin;
          fee = feeOrName || '';
        } else if (name2OrIsin) {
          // Fund name pattern
          fundName = name2OrIsin.trim();
        }
        
        // Skip if it's just a generic term or too short
        if (fundName.length < 3 || 
            /^(fond|etf|aktie|procent|%|tillväxt|global|teknologi)$/i.test(fundName)) {
          continue;
        }
        
        // Check if it contains a valid provider or sector
        const lowerName = fundName.toLowerCase();
        const hasValidProvider = validProviders.some(provider => lowerName.includes(provider));
        const sector = Object.keys(sectorMapping).find(key => 
          lowerName.includes(key.toLowerCase())
        );
        
        if (hasValidProvider || sector || isin) {
          // Extract allocation percentage from surrounding text
          const allocationMatch = text.match(new RegExp(`(\\d+)%\\s+[^\\n]*${fundName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
          const allocation = allocationMatch ? parseInt(allocationMatch[1]) : undefined;
          
          recommendations.push({
            name: fundName,
            symbol: isin || fundName.substring(0, 4).toUpperCase(),
            allocation: allocation,
            sector: sector ? sectorMapping[sector] : 'Fond/ETF',
            reasoning: `Rekommenderad för din riskprofil och investeringsstil`,
            isin: isin || undefined,
            fee: fee || undefined
          });
        }
      }
    });

    // Remove duplicates and clean up
    const uniqueRecommendations = recommendations.filter((rec, index, arr) => 
      arr.findIndex(r => r.name.toLowerCase() === rec.name.toLowerCase()) === index
    );

    return uniqueRecommendations.slice(0, 6); // Limit to 6 recommendations
  };

  const formatAIResponseWithSummary = (response: string, recommendations: RecommendedStock[]) => {
    if (!recommendations.length) return response;

    const summary = `

## 📊 Sammanfattning av AI-rekommendationer

Baserat på din riskprofil rekommenderar AI:n följande innehav:

${recommendations.map((rec, index) => `
**${index + 1}. ${rec.name}**
- Sektor: ${rec.sector}
- Fördelning: ${rec.allocation || 'Ej specificerad'}%
${rec.isin ? `- ISIN: ${rec.isin}` : ''}
${rec.fee ? `- Avgift: ${rec.fee}` : ''}
`).join('')}

---

${response}`;

    return summary;
  };

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att spara din profil",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      // Save risk profile to database
      const { data, error } = await supabase
        .from('user_risk_profiles')
        .upsert([
          {
            user_id: user.id,
            age: riskProfile.age,
            risk_tolerance: riskProfile.risk_tolerance,
            investment_horizon: riskProfile.investment_horizon,
            monthly_investment_amount: riskProfile.monthly_investment_amount,
          }
        ], { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving risk profile:', error);
        toast({
          title: "Fel",
          description: "Kunde inte spara din riskprofil. Försök igen senare.",
          variant: "destructive",
        });
        return;
      }

      // Get risk profile ID
      const { data: riskProfileData } = await supabase
        .from('user_risk_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!riskProfileData) {
        throw new Error('Could not retrieve risk profile ID');
      }

      // Save portfolio to database with required fields
      const { error: portfolioError } = await supabase
        .from('user_portfolios')
        .upsert([
          {
            user_id: user.id,
            risk_profile_id: riskProfileData.id,
            portfolio_name: 'AI-Generated Portfolio',
            asset_allocation: {
              stocks: 70,
              bonds: 20,
              alternatives: 10
            },
            recommended_stocks: aiRecommendations,
            is_active: true,
          }
        ], { onConflict: 'user_id' });

      if (portfolioError) {
        console.error('Error saving portfolio:', portfolioError);
        toast({
          title: "Fel",
          description: "Kunde inte spara portföljen. Försök igen senare.",
          variant: "destructive",
        });
        return;
      }

      // Get portfolio ID for recommendations
      const { data: portfolioData } = await supabase
        .from('user_portfolios')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (portfolioData && aiRecommendations.length > 0) {
        // Save recommendations to portfolio_recommendations table
        const { error: recommendationsError } = await supabase
          .from('portfolio_recommendations')
          .upsert(
            aiRecommendations.map(stock => ({
              user_id: user.id,
              portfolio_id: portfolioData.id,
              recommendation_type: 'stock_recommendation',
              title: stock.name,
              description: `${stock.allocation || 0}% allocation in ${stock.sector}`,
              ai_reasoning: stock.reasoning,
            })), { onConflict: 'user_id, portfolio_id, title' }
          );

        if (recommendationsError) {
          console.error('Error saving recommendations:', recommendationsError);
        }
      }

      toast({
        title: "Profil skapad",
        description: "Din riskprofil och AI-rekommendationer har sparats.",
      });

      onComplete();
    } catch (error) {
      console.error('Error during completion:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod. Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetProfile = async () => {
    if (!user) return;

    try {
      // Clear existing AI recommendations
      await supabase
        .from('portfolio_recommendations')
        .delete()
        .eq('user_id', user.id);

      // Clear existing portfolio
      await supabase
        .from('user_portfolios')
        .delete()
        .eq('user_id', user.id);

      // Reset local state
      setAiResponse('');
      setAiRecommendations([]);
      setRiskProfile({
        age: null,
        risk_tolerance: '',
        investment_horizon: '',
        monthly_investment_amount: null,
      });

      toast({
        title: "Profil rensad",
        description: "All tidigare data har rensats. Du kan nu skapa en ny profil.",
      });

      onReset();
    } catch (error) {
      console.error('Error resetting profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte rensa profilen helt. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const progress = () => {
    let completed = 0;
    if (riskProfile.age) completed += 25;
    if (riskProfile.risk_tolerance) completed += 25;
    if (riskProfile.investment_horizon) completed += 25;
    if (riskProfile.monthly_investment_amount) completed += 25;
    return completed;
  };

  return (
    <div className="space-y-6">
      {/* Risk Profile Input */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Din Riskprofil
          </CardTitle>
          <CardDescription className="text-sm">
            Fyll i informationen nedan för att skapa en personlig riskprofil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Ålder</Label>
              <Input
                type="number"
                id="age"
                placeholder="Ange din ålder"
                value={riskProfile.age === null ? '' : riskProfile.age.toString()}
                onChange={(e) => handleProfileChange('age', e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
            <div>
              <Label htmlFor="monthlyInvestment">Månadssparande (SEK)</Label>
              <Input
                type="number"
                id="monthlyInvestment"
                placeholder="Ange belopp"
                value={riskProfile.monthly_investment_amount === null ? '' : riskProfile.monthly_investment_amount.toString()}
                onChange={(e) => handleProfileChange('monthly_investment_amount', e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="riskTolerance">Risknivå</Label>
              <Select onValueChange={(value) => handleProfileChange('risk_tolerance', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Välj risknivå" defaultValue={riskProfile.risk_tolerance} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Låg</SelectItem>
                  <SelectItem value="moderate">Medel</SelectItem>
                  <SelectItem value="high">Hög</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="investmentHorizon">Placeringshorisont</Label>
              <Select onValueChange={(value) => handleProfileChange('investment_horizon', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Välj tidshorisont" defaultValue={riskProfile.investment_horizon} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Kort (1-3 år)</SelectItem>
                  <SelectItem value="medium">Medel (3-7 år)</SelectItem>
                  <SelectItem value="long">Lång (7+ år)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Progress value={progress()} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {progress()}% av profilen ifylld
          </p>
        </CardContent>
      </Card>

      {/* AI Interaction */}
      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-950/20 dark:to-lime-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Interagera med AI
          </CardTitle>
          <CardDescription className="text-sm">
            Ställ frågor om din investeringsstrategi och få personliga svar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Skriv ditt meddelande här"
            value={message}
            onChange={handleInputChange}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={sendMessageToAI}
              disabled={loading}
              className="bg-green-600 text-green-50 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Laddar...
                </>
              ) : (
                "Skicka"
              )}
            </Button>
          </div>
          {aiResponse && (
            <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
              <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200">
                <div className="whitespace-pre-wrap text-sm">
                  {formatAIResponseWithSummary(aiResponse, aiRecommendations)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

        {/* AI Recommendations Summary */}
        {aiRecommendations.length > 0 && (
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Rekommenderade Innehav
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                    {aiRecommendations.length} innehav
                  </Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetProfile}
                  disabled={isResetting}
                  className="text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isResetting ? "Rensar..." : "Gör om profil"}
                </Button>
              </div>
              <CardDescription className="text-sm">
                Personliga fond- och aktierekommendationer baserat på din riskprofil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {aiRecommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {rec.name}
                          </h4>
                          {rec.isin && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 font-mono">
                              {rec.isin}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Tag className="w-3 h-3" />
                          <span>{rec.sector}</span>
                          {rec.allocation && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-purple-600">
                                {rec.allocation}% av portföljen
                              </span>
                            </>
                          )}
                          {rec.fee && (
                            <>
                              <span>•</span>
                              <span className="text-xs text-gray-500">
                                Avgift: {rec.fee}
                              </span>
                            </>
                          )}
                        </div>
                        {rec.reasoning && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {rec.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge 
                        variant="secondary" 
                        className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Rekommenderad
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                      Om AI-rekommendationerna
                    </p>
                    <p className="text-purple-600 dark:text-purple-300 text-xs leading-relaxed">
                      Dessa fonder och aktier är utvalda baserat på din riskprofil, investeringsstil och tidshorizont. 
                      Kom ihåg att göra egen research innan du investerar.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Completion and Reset */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={handleResetProfile}
          disabled={isResetting}
        >
          Rensa
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!aiResponse || isResetting}
          className="bg-blue-600 text-blue-50 hover:bg-blue-700"
        >
          {isResetting ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Slutför
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConversationalRiskAssessment;
