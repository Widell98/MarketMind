
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  MessageSquare, 
  BarChart3, 
  Brain, 
  Zap,
  Check,
  X
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage: number;
  dailyLimit: number;
}

const PremiumUpgradeModal = ({ isOpen, onClose, currentUsage, dailyLimit }: PremiumUpgradeModalProps) => {
  const { createCheckout } = useSubscription();
  const navigate = useNavigate();

  const handleUpgrade = async (tier: 'premium' | 'pro') => {
    await createCheckout(tier);
  };

  const handlePremiumClick = () => {
    onClose();
    navigate('/profile', { state: { activeTab: 'membership' } });
  };

  const features = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Obegränsade AI-meddelanden",
      description: "Chatta utan begränsningar med din AI-assistent"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Avancerade analyser",
      description: "Djupgående portföljanalyser och marknadsinsikter"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI-genererade insikter",
      description: "Personliga rekommendationer baserade på din portfölj"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Prioriterad support",
      description: "Snabbare svar och premium-funktioner först"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border">
        <div className="bg-gradient-to-br from-muted/50 via-background to-muted/30 p-6 border-b">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Daglig gräns nådd!
            </DialogTitle>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Du har använt <span className="font-semibold text-foreground">{currentUsage}</span> av {dailyLimit} gratis meddelanden idag
              </p>
              <p className="text-sm text-muted-foreground">
                Uppgradera till Premium för obegränsad användning
              </p>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Användning idag</span>
              <span className="font-medium text-foreground">{currentUsage}/{dailyLimit}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((currentUsage / dailyLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Vad du får med Premium:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    {feature.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-foreground">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
              <div className="space-y-4">
                <div className="text-center">
                  <Badge className="bg-primary text-primary-foreground mb-2">
                    Mest populär
                  </Badge>
                  <h4 className="font-bold text-lg text-foreground">Premium</h4>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-foreground">69</span>
                    <span className="text-muted-foreground">SEK/mån</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    "Obegränsade AI-meddelanden",
                    "Avancerade analyser",
                    "Personliga insikter",
                    "E-postrapporter"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => handleUpgrade('premium')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  Välj Premium
                </Button>
              </div>
            </Card>

            <Card className="border p-4">
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-bold text-lg text-foreground">Gratis</h4>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-foreground">0</span>
                    <span className="text-muted-foreground">SEK/mån</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    "5 AI-meddelanden/dag",
                    "Grundläggande funktioner",
                    "Community support"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                  {[
                    "Obegränsade meddelanden",
                    "Avancerade analyser"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <X className="w-4 h-4" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Fortsätt med Gratis
                </Button>
              </div>
            </Card>
          </div>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Du kan avsluta prenumerationen när som helst</p>
            <p>Återstående meddelanden återställs imorgon</p>
            <Button 
              variant="link" 
              className="text-xs text-primary h-auto p-0"
              onClick={handlePremiumClick}
            >
              Visa alla medlemsfördelar →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;
