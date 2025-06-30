import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Recommendation {
  name: string;
  symbol: string;
  sector: string;
  targetPrice: number;
  market: string;
}

interface ConversationData {
  age: string;
  riskTolerance: string;
  timeHorizon: string;
  investmentGoal: string;
  monthlyAmount: string;
  interests: string[];
  isBeginnerInvestor: boolean;
  aiRecommendations: Recommendation[];
}

const ConversationalPortfolioAdvisor = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImplementing, setIsImplementing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversationData, setConversationData] = useState<ConversationData>({
    age: '',
    riskTolerance: '',
    timeHorizon: '',
    investmentGoal: '',
    monthlyAmount: '',
    interests: [],
    isBeginnerInvestor: false,
    aiRecommendations: []
  });
  const { addHolding, refetch: refetchHoldings } = useUserHoldings();

  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;

    setIsSubmitting(true);
    const userMessage = question;
    setQuestion('');

    try {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

      const response = await fetch('/api/portfolio-ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          userId: user?.id,
          chatHistory: messages,
          analysisType: 'portfolio_generation',
          conversationData: conversationData
        }),
      });

      if (!response.ok) {
        throw new Error('Kunde inte få svar från AI-assistenten');
      }

      const data = await response.json();
      console.log('AI Chat Response:', data);

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        
        // If this was a portfolio generation request and we got recommendations
        if (data.isPortfolioGeneration && data.extractedRecommendations?.length > 0) {
          console.log('Setting AI recommendations:', data.extractedRecommendations);
          setConversationData(prev => ({
            ...prev,
            aiRecommendations: data.extractedRecommendations
          }));
        }
      } else {
        throw new Error(data.message || 'Ett fel uppstod');
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skicka meddelandet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImplementStrategy = async () => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att implementera strategin",
        variant: "destructive",
      });
      return;
    }

    if (!conversationData.aiRecommendations || conversationData.aiRecommendations.length === 0) {
      toast({
        title: "Ingen strategi att implementera",
        description: "Vänligen genomför konsultationen först för att få AI-rekommendationer",
        variant: "destructive",
      });
      return;
    }

    setIsImplementing(true);

    try {
      console.log('Implementing strategy with recommendations:', conversationData.aiRecommendations);

      // Create risk profile
      const riskProfileData = {
        user_id: user.id,
        age: getAgeFromRange(conversationData.age),
        risk_tolerance: conversationData.riskTolerance,
        investment_horizon: conversationData.timeHorizon,
        investment_goal: conversationData.investmentGoal,
        monthly_investment_amount: parseFloat(conversationData.monthlyAmount) || 0,
        sector_interests: conversationData.interests || [],
        investment_experience: conversationData.isBeginnerInvestor ? 'beginner' : 'intermediate',
        current_portfolio_value: 0,
        preferred_stock_count: conversationData.aiRecommendations.length || 8
      };

      const { data: riskProfile, error: riskError } = await supabase
        .from('user_risk_profiles')
        .insert(riskProfileData)
        .select()
        .single();

      if (riskError) {
        console.error('Error creating risk profile:', riskError);
        throw new Error('Kunde inte skapa riskprofil');
      }

      console.log('Risk profile created:', riskProfile);

      // Create portfolio with AI recommendations
      const portfolioData = {
        user_id: user.id,
        risk_profile_id: riskProfile.id,
        portfolio_name: `${conversationData.investmentGoal} Portfolio`,
        asset_allocation: {
          stocks: 70,
          bonds: 20,
          alternatives: 10
        },
        recommended_stocks: conversationData.aiRecommendations,
        total_value: parseFloat(conversationData.monthlyAmount) * 12 || 60000,
        expected_return: 7.5,
        risk_score: getRiskScore(conversationData.riskTolerance),
        is_active: true,
        is_public: false
      };

      const { data: portfolio, error: portfolioError } = await supabase
        .from('user_portfolios')
        .insert(portfolioData)
        .select()
        .single();

      if (portfolioError) {
        console.error('Error creating portfolio:', portfolioError);
        throw new Error('Kunde inte skapa portfölj');
      }

      console.log('Portfolio created:', portfolio);

      // Save AI recommendations as holdings in the database
      if (conversationData.aiRecommendations && conversationData.aiRecommendations.length > 0) {
        for (const recommendation of conversationData.aiRecommendations) {
          const holdingData = {
            holding_type: 'recommendation' as const,
            name: recommendation.name || recommendation.symbol,
            symbol: recommendation.symbol,
            purchase_price: recommendation.targetPrice || recommendation.price || 100,
            sector: recommendation.sector || 'Technology',
            market: recommendation.market || 'Swedish',
            currency: 'SEK'
          };

          console.log('Adding AI recommendation as holding:', holdingData);
          
          const success = await addHolding(holdingData);
          if (!success) {
            console.error('Failed to add holding:', holdingData);
          }
        }

        // Refresh holdings data
        setTimeout(() => {
          refetchHoldings();
        }, 1000);
      }

      toast({
        title: "Strategi implementerad!",
        description: `Din ${conversationData.investmentGoal}-portfölj har skapats med ${conversationData.aiRecommendations.length} AI-rekommendationer.`,
      });

      // Navigate to portfolio implementation page
      navigate('/portfolio-implementation');

    } catch (error) {
      console.error('Error implementing strategy:', error);
      toast({
        title: "Fel vid implementering",
        description: error.message || "Ett oväntat fel uppstod. Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setIsImplementing(false);
    }
  };

  const getAgeFromRange = (ageRange: string): number => {
    const [minAge, maxAge] = ageRange.split('-').map(Number);
    return Math.floor((minAge + maxAge) / 2);
  };

  const getRiskScore = (riskTolerance: string): number => {
    switch (riskTolerance) {
      case 'low':
        return 3;
      case 'medium':
        return 5;
      case 'high':
        return 7;
      default:
        return 5;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Skapa din investeringsstrategi</CardTitle>
        <CardDescription>
          Svara på frågorna nedan för att skapa en personlig portföljstrategi med AI-hjälp
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age">Ålder</Label>
            <Select onValueChange={(value) => setConversationData(prev => ({ ...prev, age: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Välj ålder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="18-25">18-25</SelectItem>
                <SelectItem value="26-35">26-35</SelectItem>
                <SelectItem value="36-45">36-45</SelectItem>
                <SelectItem value="46-55">46-55</SelectItem>
                <SelectItem value="56-65">56-65</SelectItem>
                <SelectItem value="65+">65+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="riskTolerance">Risktolerans</Label>
            <Select onValueChange={(value) => setConversationData(prev => ({ ...prev, riskTolerance: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Välj risktolerans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Låg</SelectItem>
                <SelectItem value="medium">Medel</SelectItem>
                <SelectItem value="high">Hög</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeHorizon">Tidshorisont</Label>
            <Select onValueChange={(value) => setConversationData(prev => ({ ...prev, timeHorizon: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Välj tidshorisont" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Kort (1-3 år)</SelectItem>
                <SelectItem value="medium">Medel (3-7 år)</SelectItem>
                <SelectItem value="long">Lång (7+ år)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="investmentGoal">Investeringsmål</Label>
            <Select onValueChange={(value) => setConversationData(prev => ({ ...prev, investmentGoal: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Välj investeringsmål" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retirement">Pension</SelectItem>
                <SelectItem value="saving">Sparande</SelectItem>
                <SelectItem value="growth">Kapitaltillväxt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="monthlyAmount">Månatligt belopp (SEK)</Label>
          <Input
            type="number"
            id="monthlyAmount"
            placeholder="Ange belopp"
            value={conversationData.monthlyAmount}
            onChange={(e) => setConversationData(prev => ({ ...prev, monthlyAmount: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="interests">Intressen (separera med kommatecken)</Label>
          <Textarea
            id="interests"
            placeholder="Teknik, Hälsa, Energi..."
            value={conversationData.interests.join(', ')}
            onChange={(e) => setConversationData(prev => ({ ...prev, interests: e.target.value.split(',').map(item => item.trim()) }))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Input
            type="checkbox"
            id="beginnerInvestor"
            checked={conversationData.isBeginnerInvestor}
            onChange={(e) => setConversationData(prev => ({ ...prev, isBeginnerInvestor: e.target.checked }))}
          />
          <Label htmlFor="beginnerInvestor">Är du nybörjare inom investeringar?</Label>
        </div>

        <div>
          <Label htmlFor="question">Fråga AI-assistenten</Label>
          <Input
            type="text"
            id="question"
            placeholder="Skriv din fråga här..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmitQuestion();
              }
            }}
          />
        </div>

        <Button onClick={handleSubmitQuestion} disabled={isSubmitting}>
          {isSubmitting ? "Skickar..." : "Skicka fråga"}
        </Button>

        {messages.length > 0 && (
          <div className="mt-4 space-y-2">
            {messages.map((msg, index) => (
              <Card key={index} className={msg.role === 'user' ? "bg-muted/50" : "bg-card"}>
                <CardContent>
                  <p className="font-medium">{msg.role === 'user' ? "Du:" : "AI-Assistent:"}</p>
                  <p>{msg.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" onClick={handleImplementStrategy} disabled={isImplementing || conversationData.aiRecommendations.length === 0}>
              {isImplementing ? "Implementerar..." : "Implementera Strategin"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Implementera Strategin?</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill implementera den genererade strategin? Detta kommer att skapa en portfölj baserad på AI-rekommendationerna.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleImplementStrategy} disabled={isImplementing}>
                Ja, implementera
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default ConversationalPortfolioAdvisor;
