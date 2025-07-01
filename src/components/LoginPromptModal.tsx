
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, BarChart3, Shield, Zap, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPromptModal = ({ isOpen, onClose }: LoginPromptModalProps) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/auth');
  };

  const benefits = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI-driven portföljanalys",
      description: "Få personliga rekommendationer baserade på din riskprofil"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Realtidsövervakning",
      description: "Följ dina innehav och få marknadsinsikter i realtid"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Målsättningar & tracking",
      description: "Sätt upp investeringsmål och följ din progress"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Avancerad analys",
      description: "Djupgående analys av din portföljs prestanda och risk"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Säker datahantering",
      description: "Dina investeringsdata är säkert krypterad och skyddad"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Snabba insights",
      description: "Få omedelbara AI-insights om dina investeringsbeslut"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary shadow-xl">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold mb-2">
            Skapa ditt konto för att komma igång
          </DialogTitle>
          <DialogDescription className="text-center text-base mb-6">
            Lås upp kraften i AI-driven portföljhantering och ta kontroll över dina investeringar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge className="px-3 py-1 bg-primary text-primary-foreground">
              <Brain className="w-3 h-3 mr-1" />
              AI-Optimerad
            </Badge>
            <Badge className="px-3 py-1 bg-secondary text-secondary-foreground">
              <Shield className="w-3 h-3 mr-1" />
              Säker
            </Badge>
            <Badge className="px-3 py-1 bg-accent text-accent-foreground">
              <Zap className="w-3 h-3 mr-1" />
              Realtid
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground flex-shrink-0">
                  {benefit.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleLogin} className="flex-1">
              <LogIn className="w-4 h-4 mr-2" />
              Skapa konto / Logga in
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Fortsätt utan konto
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Gratis att komma igång • Inga dolda avgifter • Avsluta när som helst
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;
