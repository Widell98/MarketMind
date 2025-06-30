
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles } from 'lucide-react';
import ChatPortfolioAdvisor from './ChatPortfolioAdvisor';

const ConversationalPortfolioAdvisor = () => {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return <ChatPortfolioAdvisor />;
  }

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
            Skapa din personliga investeringsstrategi genom en naturlig chatt-konversation
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/70 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Chattbaserad konsultation
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Naturlig konversation med AI-rådgivare</li>
                <li>• En fråga i taget för bättre fokus</li>
                <li>• Anpassade följdfrågor baserat på dina svar</li>
              </ul>
            </div>
            
            <div className="p-4 bg-white/70 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Personlig analys
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Analyserar dina intressen och mål</li>
                <li>• Föreslår konkreta investeringar</li>
                <li>• Skapar actionable strategi</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Så här fungerar det:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Starta en chatt med AI-rådgivaren</li>
              <li>2. Svara på frågor om dina mål och preferenser</li>
              <li>3. Få en personlig portföljstrategi med konkreta rekommendationer</li>
              <li>4. Implementera strategin med våra verktyg</li>
            </ol>
          </div>

          <Button 
            onClick={() => setShowChat(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
            size="lg"
          >
            Starta Chatt-konsultation
            <Brain className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationalPortfolioAdvisor;
