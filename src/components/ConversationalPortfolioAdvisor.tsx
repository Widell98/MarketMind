
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Upload } from 'lucide-react';
import ChatPortfolioAdvisor from './ChatPortfolioAdvisor';

const ConversationalPortfolioAdvisor = () => {
  const [searchParams] = useSearchParams();
  const [showChat, setShowChat] = useState(false);
  const [shouldImportCSV, setShouldImportCSV] = useState(false);

  useEffect(() => {
    // Check if direct parameter is present to skip intro
    if (searchParams.get('direct') === 'true') {
      setShowChat(true);
    }
  }, [searchParams]);

  const handleStartChat = useCallback(() => {
    setShowChat(true);
  }, []);

  const handleImportCSV = useCallback(() => {
    setShouldImportCSV(true);
    setShowChat(true);
  }, []);

  if (showChat) {
    return (
      <ChatPortfolioAdvisor
        autoOpenHoldingsImport={shouldImportCSV}
        onHoldingsImportHandled={() => setShouldImportCSV(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-semibold text-foreground mb-3">
            AI Portfolio Advisor
          </CardTitle>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Skapa din personliga investeringsstrategi genom en naturlig chatt-konversation
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8 px-8 pb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-border/60 bg-background/80 dark:bg-card/50 shadow-sm backdrop-blur-sm">
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                Chattbaserad konsultation
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full mt-2 flex-shrink-0"></span>
                  Naturlig konversation med AI-rådgivare
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full mt-2 flex-shrink-0"></span>
                  En fråga i taget för bättre fokus
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full mt-2 flex-shrink-0"></span>
                  Anpassade följdfrågor baserat på dina svar
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-border/60 bg-background/80 dark:bg-card/50 shadow-sm backdrop-blur-sm">
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                Personlig analys
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full mt-2 flex-shrink-0"></span>
                  Analyserar dina intressen och mål
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full mt-2 flex-shrink-0"></span>
                  Föreslår konkreta investeringar
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full mt-2 flex-shrink-0"></span>
                  Skapar actionable strategi
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
            <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <span className="text-primary">Så här fungerar det:</span>
            </h3>
            <ol className="text-muted-foreground space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                Starta en chatt med AI-rådgivaren
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                Svara på frågor om dina mål och preferenser
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                Få en personlig portföljstrategi med konkreta rekommendationer
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                Implementera strategin med våra verktyg
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleStartChat}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              Starta Chatt-konsultation
              <Brain className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={handleImportCSV}
              variant="outline"
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              Importera portfölj via CSV
              <Upload className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationalPortfolioAdvisor;
