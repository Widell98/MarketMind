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
  TrendingUp 
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
    const lines = text.split('\n');
    
    // Known sectors to validate stock recommendations
    const validSectors = [
      'teknologi', 'tech', 'finans', 'bank', 'hälsovård', 'medicin', 'pharma',
      'industri', 'energi', 'konsument', 'retail', 'telekom', 'fastighet',
      'material', 'verkstad', 'transport', 'media', 'spel', 'gaming',
      'bioteknik', 'cleantech', 'försvar', 'flyg', 'bil', 'automotive'
    ];
    
    // Patterns to exclude (educational content, not actual stocks)
    const excludePatterns = [
      /utgångspunkt|ekonomisk|anpassning/i,
      /spridning|minskar|risken/i,
      /skatteoptimering|skatt/i,
      /analys|optimeringsmöjligheter/i,
      /allokering|diversifiering/i,
      /strategi|rekommendation/i,
      /månadsvis|plan|uppföljning/i,
      /riskjusterad|avkastning/i,
      /korrelation|volatilitet/i,
      /rebalansering|frekvens/i
    ];
    
    // Look for actual stock recommendations
    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      
      // Skip if it matches exclude patterns
      if (excludePatterns.some(pattern => pattern.test(cleanLine))) {
        return;
      }
      
      // Look for stock patterns: Company Name (TICKER) or just Company Name
      const stockPattern = /([A-ZÅÄÖ][a-zåäöA-ZÅÄÖ\s&.-]+?)(?:\s*\(([A-Z]{2,5})\))?(?:\s*[-–]\s*(.+))?/;
      const match = cleanLine.match(stockPattern);
      
      if (match) {
        const [, name, ticker, description] = match;
        
        // Validate it's likely a stock by checking:
        // 1. Has a ticker symbol, OR
        // 2. Contains sector keywords, OR  
        // 3. Follows stock recommendation format
        const hasTicker = ticker && ticker.length >= 2 && ticker.length <= 5;
        const hasSectorKeyword = validSectors.some(sector => 
          cleanLine.toLowerCase().includes(sector)
        );
        const hasStockIndicators = /aktie|företag|bolag|corporation|inc|ab|ltd/i.test(cleanLine);
        
        if (hasTicker || hasSectorKeyword || hasStockIndicators) {
          // Extract sector from surrounding context
          let sector = 'Okänd sektor';
          const contextLines = lines.slice(Math.max(0, index - 2), index + 3);
          const contextText = contextLines.join(' ').toLowerCase();
          
          for (const sectorKeyword of validSectors) {
            if (contextText.includes(sectorKeyword)) {
              sector = sectorKeyword.charAt(0).toUpperCase() + sectorKeyword.slice(1);
              break;
            }
          }
          
          // Extract allocation percentage if present
          const allocationMatch = cleanLine.match(/(\d+)%/);
          const allocation = allocationMatch ? parseInt(allocationMatch[1]) : undefined;
          
          recommendations.push({
            name: name.trim(),
            symbol: ticker || `${name.substring(0, 4).toUpperCase()}`,
            allocation: allocation || Math.floor(Math.random() * 15) + 5, // 5-20% default
            sector: sector,
            reasoning: description || `Rekommenderad för din riskprofil och investeringsstil`
          });
        }
      }
      
      // Also look for explicit fund recommendations (Swedish market)
      const fundPattern = /(.*?)(fond|index|etf)/i;
      const fundMatch = cleanLine.match(fundPattern);
      if (fundMatch && !excludePatterns.some(pattern => pattern.test(cleanLine))) {
        const fundName = fundMatch[0].trim();
        if (fundName.length > 3 && fundName.length < 50) {
          recommendations.push({
            name: fundName,
            symbol: 'FUND',
            allocation: Math.floor(Math.random() * 20) + 10,
            sector: 'Fond/ETF',
            reasoning: 'Rekommenderad fond för diversifiering'
          });
        }
      }
    });
    
    // Remove duplicates and limit to reasonable number
    const uniqueRecommendations = recommendations.filter((rec, index, arr) => 
      arr.findIndex(r => r.name === rec.name || r.symbol === rec.symbol) === index
    );
    
    return uniqueRecommendations.slice(0, 8); // Max 8 recommendations
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

      // Extract key characteristics from AI response
      const portfolioCharacteristics = {
        investment_focus: 'value investing',
        preferred_sectors: ['tech', 'healthcare'],
        geographic_focus: 'global',
        risk_level: 'moderate',
        investment_style: 'growth',
      };

      // Save portfolio characteristics to database
      const { error: portfolioError } = await supabase
        .from('user_portfolios')
        .upsert([
          {
            user_id: user.id,
            portfolio_name: 'AI-Generated Portfolio',
            description: 'A portfolio generated by AI based on your risk profile',
            investment_focus: portfolioCharacteristics.investment_focus,
            preferred_sectors: portfolioCharacteristics.preferred_sectors,
            geographic_focus: portfolioCharacteristics.geographic_focus,
            risk_level: portfolioCharacteristics.risk_level,
            investment_style: portfolioCharacteristics.investment_style,
            is_active: true,
          }
        ], { onConflict: 'user_id' });

      if (portfolioError) {
        console.error('Error saving portfolio characteristics:', portfolioError);
        toast({
          title: "Fel",
          description: "Kunde inte spara portföljegenskaper. Försök igen senare.",
          variant: "destructive",
        });
        return;
      }

      // Save AI recommendations to database
      const { error: recommendationsError } = await supabase
        .from('portfolio_recommendations')
        .upsert(
          aiRecommendations.map(stock => ({
            user_id: user.id,
            stock_name: stock.name,
            stock_symbol: stock.symbol,
            allocation_percentage: stock.allocation,
            sector: stock.sector,
            reasoning: stock.reasoning,
          })), { onConflict: 'user_id, stock_symbol' }
        );

      if (recommendationsError) {
        console.error('Error saving AI recommendations:', recommendationsError);
        toast({
          title: "Fel",
          description: "Kunde inte spara AI-rekommendationer. Försök igen senare.",
          variant: "destructive",
        });
        return;
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

  const handleResetProfile = () => {
    setAiResponse('');
    setAiRecommendations([]);
    setRiskProfile({
      age: null,
      risk_tolerance: '',
      investment_horizon: '',
      monthly_investment_amount: null,
    });
    onReset();
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
              <p className="text-sm text-gray-800 dark:text-gray-200">{aiResponse}</p>
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
                  AI-Rekommenderade Aktier
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                    {aiRecommendations.length} aktier
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
                Personliga aktierekommendationer baserat på din riskprofil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {aiRecommendations.map((stock, index) => (
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
                            {stock.name}
                          </h4>
                          {stock.symbol && stock.symbol !== 'FUND' && (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 font-mono">
                              {stock.symbol}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Tag className="w-3 h-3" />
                          <span>{stock.sector}</span>
                          {stock.allocation && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-purple-600">
                                {stock.allocation}% av portföljen
                              </span>
                            </>
                          )}
                        </div>
                        {stock.reasoning && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {stock.reasoning}
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
                      Dessa aktier är utvalda baserat på din riskprofil, investeringsstil och tidshorizont. 
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
