import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, MessageCircle, ArrowRight } from 'lucide-react';
import ConversationalRiskAssessment from './ConversationalRiskAssessment';
import ChatPortfolioAdvisor from './ChatPortfolioAdvisor';

const EnhancedConversationalPortfolioAdvisor = () => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'assessment' | 'chat'>('intro');

  const handleStartAssessment = () => {
    setCurrentStep('assessment');
  };

  const handleCompleteAssessment = () => {
    setCurrentStep('chat');
  };

  const handleResetAssessment = () => {
    setCurrentStep('intro');
  };

  if (currentStep === 'chat') {
    return <ChatPortfolioAdvisor />;
  }

  if (currentStep === 'assessment') {
    return (
      <ConversationalRiskAssessment 
        onComplete={handleCompleteAssessment}
        onReset={handleResetAssessment}
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
            Skapa din personliga investeringsstrategi
          </CardTitle>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Träffa Anna Lindberg, din personliga AI-rådgivare, och skapa en investeringsstrategi som passar just dig
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8 px-8 pb-8">
          <div className="grid md:grid-cols-2 gap-6 bg-blue-50/50 rounded-xl p-6 border border-blue-100/30">
            <div className="p-6 bg-accent/50 rounded-xl border border-border/50">
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                Personlig konsultation
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  Naturlig konversation med erfaren rådgivare Anna
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  Berätta om dina mål, oro och förväntningar
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  Få empati och förståelse för din situation
                </li>
              </ul>
            </div>
            
            <div className="p-6 bg-accent/50 rounded-xl border border-border/50">
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                Skräddarsydd strategi
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  Personlig portfölj baserad på dina behov
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  Konkreta aktier och fonder att köpa
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  Fortsatt stöd från din AI-assistent
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
                <div>
                  <strong>Träffa Anna</strong> - Prata med din personliga rådgivare om din situation, mål och oro
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                <div>
                  <strong>Få din strategi</strong> - Anna skapar en personlig portfölj med konkreta rekommendationer
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                <div>
                  <strong>Fortsätt chatten</strong> - Din AI-assistent hjälper dig implementera och följa upp
                </div>
              </li>
            </ol>
          </div>

          <Button 
            onClick={handleStartAssessment}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            Träffa Anna - Din Personliga Rådgivare
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-1">
              <strong>Anna Lindberg</strong> - Personlig investeringsrådgivare med 15 års erfarenhet
            </p>
            <p>
              Specialiserad på att hjälpa svenskar skapa personliga investeringsstrategier
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedConversationalPortfolioAdvisor;