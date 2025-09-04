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
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'questions' | 'conversation' | 'completed' | 'transition'>('welcome');
  const [riskProfile, setRiskProfile] = useState<{
    age: number | null;
    risk_tolerance: string;
    investment_horizon: string;
    monthly_investment_amount: number | null;
    expectations?: string;
    concerns?: string;
    financial_situation?: string;
  }>({
    age: null,
    risk_tolerance: '',
    investment_horizon: '',
    monthly_investment_amount: null,
    expectations: '',
    concerns: '',
    financial_situation: '',
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
    
    // Initialize conversation with welcome message
    if (currentStep === 'welcome' && conversationHistory.length === 0) {
      setConversationHistory([
        {
          role: 'assistant',
          content: `👋 Hej och välkommen! Jag heter Anna Lindberg och jag är din personliga investeringsrådgivare. 

Jag har hjälpt hundratals svenskar att bygga sina drömportföljer under mina 15 år inom finansbranschen. Idag ska vi tillsammans skapa en investeringsstrategi som är helt anpassad för just dig!

Först skulle jag vilja lära känna dig lite bättre. Kan du berätta om din situation och vad som har fått dig att börja tänka på att investera? Vad hoppas du uppnå med dina investeringar? 😊`
        }
      ]);
    }
  }, [user, navigate, currentStep, conversationHistory.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleProfileChange = (field: string, value: any) => {
    setRiskProfile(prev => ({ ...prev, [field]: value }));
  };

  const sendConversationalMessage = async () => {
    if (!message.trim()) return;

    // Add user message to conversation
    const userMessage = { role: 'user' as const, content: message };
    setConversationHistory(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    
    setLoading(true);
    try {
      console.log('Sending conversational message:', currentMessage);
      
      // Create a more natural conversation context
      const conversationContext = [
        {
          role: 'system',
          content: `Du är Anna Lindberg, en erfaren svensk investeringsrådgivare med 15 års erfarenhet. Du för en varm, personlig konversation med klienten för att förstå deras investeringsbehov och känslor kring investeringar.

DITT UPPDRAG:
- För en naturlig, empatisk konversation på svenska
- Lyssna på deras oro och förväntningar - bekräfta och lugna
- Ställ uppföljningsfrågor baserat på vad de säger
- Var varm, professionell och förklarande
- Hjälp dem fylla i sin riskprofil genom konversation
- Ta hänsyn till deras personliga situation och känslor
- När du har tillräckligt med information, föreslå att skapa deras portfölj

AKTUELL RISKPROFIL:
- Ålder: ${riskProfile.age || 'Ej angiven'}
- Risktolerans: ${riskProfile.risk_tolerance || 'Ej angiven'} 
- Tidshorisont: ${riskProfile.investment_horizon || 'Ej angiven'}
- Månatligt belopp: ${riskProfile.monthly_investment_amount || 'Ej angiven'} SEK
- Förväntningar: ${riskProfile.expectations || 'Ej angivna'}
- Oro/bekymmer: ${riskProfile.concerns || 'Ej angivna'}

VIKTIGT: 
- Svara kortfattat (max 3-4 meningar) 
- Var empatisk och bekräfta deras känslor
- Ställ relevanta uppföljningsfrågor
- Om de har oro, lugna och förklara
- Om grunduppgifterna är ifyllda och ni pratat om mål/oro, föreslå att skapa portfölj`
        },
        ...conversationHistory,
        userMessage
      ];
      
      const response = await fetch(
        `https://qifolopsdeeyrevbuxfl.supabase.co/functions/v1/portfolio-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            message: currentMessage,
            userId: user?.id,
            chatHistory: conversationContext,
            analysisType: 'conversational_risk_assessment',
          }),
        }
      );

      console.log('AI response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Failed to send message. Status: ${response.status}`);
      }

      // Handle AI response
      let fullResponse = '';
      
      try {
        const data = await response.json();
        console.log('AI response data:', data);
        
        if (data && data.response) {
          fullResponse = data.response;
        } else if (data && data.message) {
          fullResponse = data.message;
        } else if (typeof data === 'string') {
          fullResponse = data;
        } else {
          console.log('Unexpected response format:', data);
          throw new Error('Invalid response format');
        }
      } catch (jsonError) {
        console.error('Response parsing error:', jsonError);
        throw new Error('Kunde inte tolka AI-svaret');
      }

      console.log('AI Response received:', fullResponse.substring(0, 200));

      if (fullResponse && fullResponse.trim().length > 0) {
        // Add AI response to conversation
        const aiMessage = { role: 'assistant' as const, content: fullResponse };
        setConversationHistory(prev => [...prev, aiMessage]);
        
        // If this looks like final portfolio advice, extract recommendations
        if (fullResponse.includes('portfölj') && fullResponse.includes('%')) {
          console.log('Detected portfolio recommendations, extracting...');
          const recommendations = extractRecommendations(fullResponse);
          console.log('Extracted recommendations:', recommendations);
          setAiRecommendations(recommendations);
          setCurrentStep('transition');
        }

      } else {
        console.error('Empty AI response received');
        const fallbackMessage = "Tyvärr kunde jag inte generera ett svar just nu. Kan du försöka ställa din fråga igen?";
        
        const aiMessage = { role: 'assistant' as const, content: fallbackMessage };
        setConversationHistory(prev => [...prev, aiMessage]);
      }
    } catch (error: any) {
      console.error('Error in conversation:', error);
      
      const errorMessage = { 
        role: 'assistant' as const, 
        content: "Ursäkta, jag hade ett tekniskt problem. Kan du försöka igen?" 
      };
      setConversationHistory(prev => [...prev, errorMessage]);
      
      toast({
        title: "Tekniskt problem",
        description: "Något gick fel i konversationen. Försök igen.",
        variant: "destructive",
      });
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

  const proceedToPortfolioGeneration = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att skapa din portfölj",
        variant: "destructive",
      });
      return;
    }

    // Check if we have basic information needed
    if (!riskProfile.age || !riskProfile.risk_tolerance || !riskProfile.investment_horizon) {
      toast({
        title: "Mer information behövs",
        description: "Vi behöver din ålder, risktolerans och tidshorisont för att skapa din portfölj.",
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
    if (riskProfile.age) completed += 20;
    if (riskProfile.risk_tolerance) completed += 20;
    if (riskProfile.investment_horizon) completed += 20;
    if (riskProfile.monthly_investment_amount) completed += 20;
    if (riskProfile.expectations) completed += 10;
    if (riskProfile.concerns) completed += 10;
    return completed;
  };

  // Show transition section if we have recommendations
  if (currentStep === 'transition' && aiRecommendations.length > 0) {
    return (
      <div className="space-y-6">
        {/* Portfolio Summary */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-800 dark:text-green-200">
                    🎉 Din portföljstrategi är klar!
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    Baserat på din profil och vårt samtal har jag skapat din personliga investeringsstrategi
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Sammanfattning av din profil:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Ålder</Badge>
                  <span>{riskProfile.age} år</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Månadssparande</Badge>
                  <span>{riskProfile.monthly_investment_amount?.toLocaleString()} SEK</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Risktolerans</Badge>
                  <span>{riskProfile.risk_tolerance === 'low' ? 'Låg' : riskProfile.risk_tolerance === 'moderate' ? 'Medel' : 'Hög'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Tidshorisont</Badge>
                  <span>{riskProfile.investment_horizon === 'short' ? 'Kort (1-3 år)' : riskProfile.investment_horizon === 'medium' ? 'Medel (3-7 år)' : 'Lång (7+ år)'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Introduction */}
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                  Nästa steg: Din personliga AI-assistent
                </CardTitle>
                <CardDescription className="text-blue-600 dark:text-blue-400">
                  Nu är det dags att implementera din strategi tillsammans med din egen AI-rådgivare
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Din AI-assistent kan hjälpa dig med:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Specifika frågor om dina rekommenderade aktier</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Timing för när du ska köpa olika innehav</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Rebalansering av din portfölj över tid</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Analys av marknadsläget och dina innehav</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fördjupad information om företag och fonder</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Justering av strategi när livet förändras</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                    Förberedd för dina behov
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                    Din AI-assistent känner redan till din riskprofil och dina rekommendationer. Den kan därför ge dig personliga råd direkt utan att du behöver förklara din situation igen.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={proceedToPortfolioGeneration}
              className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
              disabled={portfolioLoading}
            >
              {portfolioLoading ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Förbereder din AI-assistent...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 h-5" />
                  Fortsätt till din AI-assistent
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Profile Input - Now more conversational */}
      {currentStep !== 'completed' && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Grundläggande information
            </CardTitle>
            <CardDescription className="text-sm">
              Fyll i grunduppgifterna så Anna kan ge dig personliga råd
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
                  placeholder="T.ex. 5000"
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
                    <SelectValue placeholder="Hur mycket risk vågar du ta?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Låg - säkerhet viktigast</SelectItem>
                    <SelectItem value="moderate">Medel - balans mellan risk och avkastning</SelectItem>
                    <SelectItem value="high">Hög - villig att ta risk för högre avkastning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="investmentHorizon">Placeringshorisont</Label>
                <Select onValueChange={(value) => handleProfileChange('investment_horizon', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Hur länge tänker du spara?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Kort (1-3 år)</SelectItem>
                    <SelectItem value="medium">Medel (3-7 år)</SelectItem>
                    <SelectItem value="long">Lång (7+ år)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Additional conversational fields */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="expectations">Vad har du för förväntningar på dina investeringar?</Label>
                <Textarea
                  id="expectations"
                  placeholder="T.ex. 'Jag vill bygga förmögenhet långsiktigt', 'Spara till pension', 'Få bättre avkastning än sparkonto'..."
                  value={riskProfile.expectations || ''}
                  onChange={(e) => handleProfileChange('expectations', e.target.value)}
                  className="resize-none h-20"
                />
              </div>
              
              <div>
                <Label htmlFor="concerns">Vad oroar dig mest med att investera?</Label>
                <Textarea
                  id="concerns"
                  placeholder="T.ex. 'Rädd för att förlora pengar', 'Vet inte vilka aktier som är bra', 'Osäker på timing'..."
                  value={riskProfile.concerns || ''}
                  onChange={(e) => handleProfileChange('concerns', e.target.value)}
                  className="resize-none h-20"
                />
              </div>
            </div>
            
            <Progress value={progress()} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress()}% av grunduppgifterna ifyllda
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conversation with Anna */}
      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-950/20 dark:to-lime-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Prata med Anna - din personliga rådgivare
          </CardTitle>
          <CardDescription className="text-sm">
            Berätta mer om din situation så Anna kan skapa den perfekta strategin för dig
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="max-h-96 overflow-y-auto border rounded-lg bg-white dark:bg-gray-800 p-4 space-y-3">
              {conversationHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white ml-auto'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-green-600 dark:text-green-400">
                        <Brain className="w-4 h-4" />
                        Anna
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Anna skriver...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Textarea
            placeholder="Berätta om din situation, dina mål, eller ställ en fråga till Anna..."
            value={message}
            onChange={handleInputChange}
            className="resize-none h-20"
            disabled={loading}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              💡 Tips: Berätta gärna om dina intressen, oro, eller specifika mål
            </div>
            <Button
              onClick={sendConversationalMessage}
              disabled={loading || !message.trim()}
              className="bg-green-600 text-green-50 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Anna tänker...
                </>
              ) : (
                "Skicka till Anna"
              )}
            </Button>
          </div>
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

      {/* Action Buttons */}
      {currentStep !== 'completed' && (
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={handleResetProfile}
            disabled={isResetting}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Börja om
          </Button>
          {conversationHistory.length > 1 && !aiRecommendations.length && (
            <Button
              variant="outline"
              onClick={() => {
                setMessage("Baserat på vad vi pratat om, kan du skapa min personliga portföljstrategi nu?");
              }}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              Skapa min portfölj nu
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationalRiskAssessment;
