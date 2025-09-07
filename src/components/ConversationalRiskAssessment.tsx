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
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';

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
  const { generatePortfolioFromConversation, loading: portfolioLoading } = useConversationalPortfolio();

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
      console.log('Sending AI request with message:', message);
      
      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message,
          userId: user?.id,
          chatHistory: [],
          analysisType: 'risk_assessment',
          stream: false,
        },
      });

      if (error) {
        console.error('AI function error:', error);
        throw new Error(error.message || 'Edge function error');
      }

      // Handle JSON response
      let fullResponse = '';
      const payload: any = data;
      if (payload && typeof payload === 'object') {
        if (payload.response) fullResponse = payload.response;
        else if (payload.message) fullResponse = payload.message;
        else if (payload.content) fullResponse = payload.content;
        else fullResponse = JSON.stringify(payload);
      } else if (typeof payload === 'string') {
        fullResponse = payload;
      }

      console.log('AI Response received:', fullResponse ? fullResponse.substring(0, 200) + '...' : 'undefined');

      // Validate and process final response
      if (fullResponse && fullResponse.trim().length > 0) {
        console.log('Processing valid AI response...');
        setAiResponse(fullResponse);
        
        console.log('Extracting recommendations from AI response:', fullResponse.substring(0, 100) + '...');
        const recommendations = extractRecommendations(fullResponse);
        console.log('Final extracted recommendations:', recommendations);
        setAiRecommendations(recommendations);
        
        // Show success message
        toast({
          title: "AI-analys slutförd",
          description: "Dina personliga investeringsrekommendationer är redo!",
          variant: "default",
        });

      } else {
        console.error('Empty or invalid AI response received');
        const fallbackMessage = `Baserat på din riskprofil som konservativ investerare med medellång tidshorisont och pensionsmål, rekommenderar jag en diversifierad portfölj med fokus på stabila, svenska företag och fonder:

**Investeringsrekommendationer:**

1. **Avanza Global (AVZ-GLOBAL)**: Bred global indexfond med låga avgifter som ger dig exponering mot världsmarknaden. Perfekt för nybörjare. Allokering: 40%

2. **Investor B (INVE-B)**: Svenskt investmentbolag med lång historia och stabila utdelningar. Allokering: 20%

3. **Handelsbanken A (SHB-A)**: Välskött svensk storbank med stark position. Allokering: 15%

4. **Volvo B (VOLV-B)**: Stabilt industriföretag med fokus på hållbarhet. Allokering: 15%

5. **Castellum (CAST)**: Svenskt fastighetsbolag för diversifiering. Allokering: 10%

**Månadsplan:**
- Börja med 5000 SEK/månad enligt din budget
- Köp genom Avanza eller Nordnet för låga avgifter
- Använd månadssparande för automatisering
- Se över portföljen var 6:e månad

Detta är en konservativ portfölj som passar din profil som nybörjare med fokus på långsiktig pension.`;
        
        setAiResponse(fallbackMessage);
        
        toast({
          title: "Portföljstrategi genererad",
          description: "En fallback-strategi har genererats baserat på din profil.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Enhanced error handling with fallback message
      const errorMessage = error.message || 'Unknown error occurred';
      const fallbackResponse = `Ett tekniskt problem uppstod, men här är en grundläggande portföljstrategi baserat på din profil:

**Rekommenderad startportfölj för konservativ investerare:**

1. **Avanza Global (AVZ-GLOBAL)**: Global indexfond - 50%
2. **Handelsbanken Sverige Index (HSEIX)**: Svensk indexfond - 30% 
3. **Investor B (INVE-B)**: Svenskt investmentbolag - 20%

Börja med 5000 SEK/månad enligt din budget. Kontakta rådgivning för mer detaljerad hjälp.`;

      setAiResponse(fallbackResponse);
      
      toast({
        title: "Tekniskt problem",
        description: "En grundläggande strategi har genererats. För bästa resultat, försök igen senare.",
        variant: "destructive",
      });
      
      setAiRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const extractRecommendations = (text: string): RecommendedStock[] => {
    if (!text) return [];
    
    console.log('Extracting stock recommendations from AI response:', text);
    
    const recommendations: RecommendedStock[] = [];
    
    // Enhanced patterns to match various recommendation formats
    const patterns = [
      // Pattern 1: **Company Name (Symbol)**: Description with percentage
      /\*\*([^*]+?)\s*\(([^)]+?)\)\*\*:?\s*[^.]*?(\d+)%/gi,
      // Pattern 2: **Company Name**: Description with symbol somewhere
      /\*\*([^*]+?)\*\*:?\s*[^.]*?(?:\(([A-Z]{2,8})\))?[^.]*?(\d+)%/gi,
      // Pattern 3: Company Name (Symbol) with percentage
      /([A-ZÅÄÖ][a-zåäö\s&.-]+)\s*\(([A-Z]{2,8})\)[^.]*?(\d+)%/g,
      // Pattern 4: Look for ISIN codes
      /([^:]+?):\s*.*?ISIN:\s*([A-Z]{2}\d{10})[^.]*?(\d+(?:\.\d+)?)%/gi,
      // Pattern 5: Simple format with allocation
      /([A-ZÅÄÖ][a-zåäö\s&.-]+)\s*(?:\(([A-Z]{2,8})\))?\s*[:-]?\s*(\d+)%/g
    ];

    // Extract structured recommendations
    const lines = text.split('\n');
    let currentSection = '';
    let allocationPercentage = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect sections with percentages
      const sectionMatch = line.match(/^#+\s*(.+?)\s*\((\d+)%\)/) || 
                          line.match(/^(\d+)\.\s*\*\*(.+?)\s*\((\d+)%\)\*\*/);
      
      if (sectionMatch) {
        currentSection = sectionMatch[1] || sectionMatch[2];
        allocationPercentage = parseInt(sectionMatch[2] || sectionMatch[3]);
        console.log(`Found section: ${currentSection} with ${allocationPercentage}%`);
        continue;
      }
      
      // Look for individual stocks within sections
      if (currentSection && allocationPercentage > 0) {
        // Pattern for stocks with ISIN and fees
        const isinMatch = line.match(/\*\*([^*]+?)\s*\(ISIN:\s*([A-Z]{2}\d{10})\)\*\*:?\s*(.+?)(?:avgift|fee)\s*\(([^)]+)\)/i);
        if (isinMatch) {
          const [, name, isin, description, fee] = isinMatch;
          recommendations.push({
            name: name.trim(),
            symbol: extractSymbolFromName(name.trim()),
            allocation: allocationPercentage,
            sector: currentSection,
            reasoning: description.trim(),
            isin: isin,
            fee: fee
          });
          console.log('Added ISIN recommendation:', { name: name.trim(), isin, fee });
          continue;
        }
        
        // Pattern for stocks with symbols
        const stockMatch = line.match(/\*\*([^*]+?)\s*(?:\(([A-Z]{2,8})\))?\*\*:?\s*(.+)/i) ||
                          line.match(/[-•]\s*\*\*([^*]+?)\s*(?:\(([A-Z]{2,8})\))?\*\*:?\s*(.+)/i);
        
        if (stockMatch) {
          const [, name, symbol, description] = stockMatch;
          recommendations.push({
            name: name.trim(),
            symbol: symbol || extractSymbolFromName(name.trim()),
            allocation: Math.round(allocationPercentage / 2), // Split allocation if multiple stocks
            sector: currentSection,
            reasoning: description.trim()
          });
          console.log('Added stock recommendation:', { name: name.trim(), symbol: symbol || 'N/A' });
        }
      }
    }
    
    // Fallback: Use general patterns if structured extraction didn't work
    if (recommendations.length === 0) {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const [, name, symbolOrPercentage, percentageOrSymbol] = match;
          
          let actualName = name.trim();
          let actualSymbol = '';
          let actualPercentage = 0;
          
          // Determine which capture group contains what
          if (/^\d+$/.test(symbolOrPercentage)) {
            actualPercentage = parseInt(symbolOrPercentage);
            actualSymbol = extractSymbolFromName(actualName);
          } else {
            actualSymbol = symbolOrPercentage || extractSymbolFromName(actualName);
            actualPercentage = parseInt(percentageOrSymbol) || 0;
          }
          
          if (actualName.length > 2 && !recommendations.find(r => 
            r.name.toLowerCase() === actualName.toLowerCase() || 
            r.symbol.toLowerCase() === actualSymbol.toLowerCase()
          )) {
            recommendations.push({
              name: actualName,
              symbol: actualSymbol,
              allocation: actualPercentage,
              sector: 'Allmän',
              reasoning: `AI-rekommenderad med ${actualPercentage}% allokering`
            });
          }
        }
      });
    }
    
    console.log('Final extracted recommendations:', recommendations);
    return recommendations.slice(0, 10);
  };

  const extractSymbolFromName = (name: string): string => {
    // Map common Swedish company names to their symbols
    const symbolMap: { [key: string]: string } = {
      'proethos fond': 'PROETHOS',
      'spiltan aktiefond investmentbolag': 'SPILTAN',
      'nvidia': 'NVDA',
      'embracer group': 'EMBRAC B',
      'essity': 'ESSITY B',
      'orkla': 'ORK',
      'volvo': 'VOLV B',
      'abb': 'ABB',
      'ericsson': 'ERIC B',
      'h&m': 'HM B',
      'atlas copco': 'ATCO A'
    };
    
    const lowerName = name.toLowerCase();
    for (const [key, symbol] of Object.entries(symbolMap)) {
      if (lowerName.includes(key)) {
        return symbol;
      }
    }
    
    // Extract symbol from parentheses if present
    const symbolMatch = name.match(/\(([A-Z]{2,8})\)/);
    if (symbolMatch) {
      return symbolMatch[1];
    }
    
    // Generate symbol from name
    return name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5);
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

    // Frontend validation before sending to backend
    if (riskProfile.age !== null && (riskProfile.age < 18 || riskProfile.age > 100)) {
      toast({
        title: "Ogiltig ålder",
        description: "Åldern måste vara mellan 18 och 100 år. Vänligen justera din ålder ovan.",
        variant: "destructive",
      });
      return;
    }

    if (riskProfile.monthly_investment_amount !== null && riskProfile.monthly_investment_amount < 0) {
      toast({
        title: "Ogiltigt belopp",
        description: "Månadssparande måste vara ett positivt tal.",
        variant: "destructive",
      });
      return;
    }

    if (!aiResponse || aiRecommendations.length === 0) {
      toast({
        title: "Fel",
        description: "Du måste först få AI-rekommendationer innan du kan slutföra",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      // Build conversation data from the current assessment
      const conversationData = {
        isBeginnerInvestor: false,
        hasCurrentPortfolio: false,
        age: riskProfile.age || 25,
        investmentGoal: 'wealth',
        timeHorizon: riskProfile.investment_horizon || 'medium',
        riskTolerance: riskProfile.risk_tolerance || 'balanced',
        monthlyAmount: riskProfile.monthly_investment_amount?.toString() || '5000',
        interests: [],
        companies: aiRecommendations.map(r => r.name)
      };

      // Use the enhanced conversational portfolio hook
      const result = await generatePortfolioFromConversation(conversationData);

      if (result && result.aiResponse) {
        // Show the AI-generated portfolio strategy to user
        setAiResponse(`🎉 Din personliga portföljstrategi är klar!

${result.aiResponse}

Din kompletta portfölj har sparats och du kan implementera rekommendationerna direkt.`);

        toast({
          title: "Portföljstrategi skapad!",
          description: "Din personliga investeringsstrategi är nu redo och visas ovan.",
        });

        // Wait a bit for user to see the response, then navigate
        setTimeout(() => {
          navigate('/portfolio-implementation', { 
            state: { 
              portfolio: result.portfolio,
              aiResponse: result.aiResponse,
              recommendations: result.stockRecommendations
            }
          });
        }, 3000);
      } else {
        toast({
          title: "Profil skapad",
          description: "Din riskprofil har sparats men ingen AI-rekommendation kunde genereras.",
          variant: "destructive"
        });
        onComplete();
      }
    } catch (error: any) {
      console.error('Error during completion:', error);
      
      // Enhanced error handling for specific validation errors
      if (error.message && error.message.includes('Age must be between 18 and 100')) {
        toast({
          title: "Ålder utanför giltigt intervall",
          description: "Åldern måste vara mellan 18 och 100 år. Vänligen justera din ålder ovan och försök igen.",
          variant: "destructive",
        });
        return;
      }
      
      if (error.message && error.message.includes('Invalid monthly investment amount')) {
        toast({
          title: "Ogiltigt månadsbelopp",  
          description: "Månadssparandet måste vara ett positivt tal. Vänligen justera beloppet ovan.",
          variant: "destructive",
        });
        return;
      }
      
      if (error.message && error.message.includes('Invalid risk tolerance')) {
        toast({
          title: "Ogiltig risknivå",
          description: "Vänligen välj en giltig risknivå från listan.",
          variant: "destructive",
        });
        return;
      }
      
      if (error.message && error.message.includes('Invalid investment horizon')) {
        toast({
          title: "Ogiltig placeringshorisont",
          description: "Vänligen välj en giltig placeringshorisont från listan.",
          variant: "destructive",
        });
        return;
      }
      
      // Generic error handling for other validation errors
      if (error.code === 'P0001' || (error.message && error.message.includes('must be'))) {
        toast({
          title: "Valideringsfel",
          description: `${error.message || 'Vänligen kontrollera dina uppgifter och försök igen.'}`,
          variant: "destructive",
        });
        return;
      }
      
      // Generic error for unknown issues
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

      // Clear AI market insights
      await supabase
        .from('ai_market_insights')
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
                          <span className="font-medium text-purple-600">{rec.sector}</span>
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
          disabled={!aiResponse || isResetting || portfolioLoading}
          className="bg-blue-600 text-blue-50 hover:bg-blue-700"
        >
          {isResetting || portfolioLoading ? (
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
