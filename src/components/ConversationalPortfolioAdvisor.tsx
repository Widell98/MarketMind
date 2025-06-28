import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowLeft, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConversationalRiskAssessment from './ConversationalRiskAssessment';
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';

interface ConversationData {
  isBeginnerInvestor?: boolean;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
  monthlyAmount?: string;
  hasCurrentPortfolio?: boolean;
  currentHoldings?: Array<{ name: string; percentage: number }>;
  age?: string;
  experience?: string;
  sectors?: string[];
}

const ConversationalPortfolioAdvisor = () => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'conversation' | 'generating' | 'results'>('intro');
  const [portfolioResult, setPortfolioResult] = useState<any>(null);
  const { generatePortfolioFromConversation, loading } = useConversationalPortfolio();
  const navigate = useNavigate();

  const handleStartConversation = () => {
    setCurrentStep('conversation');
  };

  const handleConversationComplete = async (conversationData: ConversationData) => {
    setCurrentStep('generating');
    
    const result = await generatePortfolioFromConversation(conversationData);
    
    if (result) {
      setPortfolioResult(result);
      setCurrentStep('results');
    } else {
      // Error occurred, go back to intro
      setCurrentStep('intro');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('intro');
    setPortfolioResult(null);
  };

  const handleImplementStrategy = () => {
    // Set a flag in localStorage to trigger page refresh in PortfolioImplementation
    localStorage.setItem('portfolio_generation_complete', 'true');
    
    // Navigate to the portfolio implementation page
    navigate('/portfolio-implementation');
    
    // Trigger a storage event for the current page
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'portfolio_generation_complete',
      newValue: 'true'
    }));
    
    // Clean up the flag
    setTimeout(() => {
      localStorage.removeItem('portfolio_generation_complete');
    }, 1000);
  };

  const formatAIResponse = (content: string) => {
    const sections = content.split(/###|\*\*/).filter(section => section.trim());
    
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const trimmedSection = section.trim();
          
          if (!trimmedSection) return null;
          
          if (/^\d+\./.test(trimmedSection)) {
            const [title, ...contentParts] = trimmedSection.split('\n');
            return (
              <div key={index} className="mb-4">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                    {title.match(/^\d+/)?.[0]}
                  </span>
                  {title.replace(/^\d+\.\s*/, '')}
                </h4>
                <div className="text-sm text-gray-700 leading-relaxed pl-8">
                  {contentParts.join('\n').trim()}
                </div>
              </div>
            );
          }
          
          if (trimmedSection.includes('- ')) {
            const lines = trimmedSection.split('\n');
            return (
              <div key={index} className="space-y-2">
                {lines.map((line, lineIndex) => {
                  if (line.trim().startsWith('- ')) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-2 text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{line.trim().substring(2)}</span>
                      </div>
                    );
                  }
                  return line.trim() ? (
                    <p key={lineIndex} className="text-sm text-gray-700 leading-relaxed">
                      {line.trim()}
                    </p>
                  ) : null;
                })}
              </div>
            );
          }
          
          return (
            <p key={index} className="text-sm text-gray-700 leading-relaxed">
              {trimmedSection}
            </p>
          );
        })}
      </div>
    );
  };

  if (currentStep === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Portfolio Advisor
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Skapa din personliga investeringsstrategi genom en naturlig konversation
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/70 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  För Nybörjare
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Grundläggande frågor om mål och risktolerans</li>
                  <li>• Enkel vägledning för att komma igång</li>
                  <li>• Fokus på långsiktig strategi</li>
                </ul>
              </div>
              
              <div className="p-4 bg-white/70 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  För Erfarna
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Analysera befintlig portfölj</li>
                  <li>• Optimeringsförslag</li>
                  <li>• Avancerade strategier</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Så här fungerar det:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Besvara frågor i en naturlig konversation</li>
                <li>2. AI:n analyserar dina svar och preferenser</li>
                <li>3. Få en personlig portföljstrategi med konkreta rekommendationer</li>
                <li>4. Implementera strategin med våra verktyg</li>
              </ol>
            </div>

            <Button 
              onClick={handleStartConversation}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
              size="lg"
            >
              Starta Personlig Konsultation
              <Brain className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'conversation') {
    return (
      <div className="max-w-4xl mx-auto">
        <ConversationalRiskAssessment onComplete={handleConversationComplete} />
      </div>
    );
  }

  if (currentStep === 'generating') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="h-[400px] flex items-center justify-center">
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Skapar din portföljstrategi...</h3>
            <p className="text-gray-600">
              AI:n analyserar dina svar och genererar en personlig investeringsstrategi
            </p>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'results' && portfolioResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Din Personliga Portföljstrategi
              </CardTitle>
              <Badge className="bg-green-100 text-green-700">
                Genererad av AI
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
              {formatAIResponse(portfolioResult.aiResponse)}
            </div>
            
            <div className="flex gap-4">
              <Button onClick={handleStartOver} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Gör ny bedömning
              </Button>
              <Button 
                onClick={handleImplementStrategy}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Implementera Strategin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default ConversationalPortfolioAdvisor;
