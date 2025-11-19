import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, Settings, CheckCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

const SubscriptionCard: React.FC = () => {
  const { 
    subscription, 
    usage, 
    loading, 
    createCheckout, 
    openCustomerPortal,
    getRemainingUsage 
  } = useSubscription();
  
  const { toast } = useToast();

  const handleUpgrade = async (tier: 'premium' | 'pro') => {
    try {
      await createCheckout(tier);
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Fel",
        description: "Kunde inte starta uppgradering. Kontrollera att du är inloggad och försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleOpenPortal = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
      
      // Mer specifik felhantering
      let errorMessage = "Kunde inte öppna kundportalen.";
      
      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('inloggad')) {
          errorMessage = "Du måste vara inloggad för att hantera din prenumeration.";
        } else if (error.message.includes('customer') || error.message.includes('kund')) {
          errorMessage = "Kunde inte hitta din kundprofil. Försök uppgradera först.";
        } else if (error.message.includes('Stripe')) {
          errorMessage = "Problem med betalningssystemet. Kontakta support.";
        }
      }
      
      toast({
        title: "Fel",
        description: errorMessage + " Försök igen eller kontakta support om problemet kvarstår.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPremium = subscription?.subscribed;
  const tier = subscription?.subscription_tier || 'free';
  const remainingMessages = getRemainingUsage('ai_message');
  const remainingAnalyses = getRemainingUsage('analysis');

  const tierColors = {
    free: 'bg-gray-100 text-gray-800',
    premium: 'bg-blue-100 text-blue-800',
    pro: 'bg-purple-100 text-purple-800'
  };

  const tierIcons = {
    free: CheckCircle,
    premium: Crown,
    pro: Zap
  };

  const TierIcon = tierIcons[tier];

  return (
    <Card className={`${isPremium ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <TierIcon className="w-5 h-5" />
          <CardTitle className="text-lg">Din Plan</CardTitle>
        </div>
        <Badge className={tierColors[tier]}>
          {tier === 'free' && 'Gratis'}
          {tier === 'premium' && 'Premium'}
          {tier === 'pro' && 'Pro'}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isPremium ? (
          <>
            <CardDescription>
              Du använder den kostnadsfria versionen av AI Portfolio Analyst
            </CardDescription>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>AI-meddelanden idag</span>
                  <span>{remainingMessages === Infinity ? '∞' : `${remainingMessages}/5`}</span>
                </div>
                <Progress 
                  value={remainingMessages === Infinity ? 100 : (remainingMessages / 5) * 100} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Analyser idag</span>
                  <span>{remainingAnalyses === Infinity ? '∞' : `${remainingAnalyses}/5`}</span>
                </div>
                <Progress 
                  value={remainingAnalyses === Infinity ? 100 : (remainingAnalyses / 5) * 100} 
                  className="h-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => handleUpgrade('premium')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Uppgradera till Premium - 69 SEK/mån
              </Button>
              <Button 
                onClick={() => handleUpgrade('pro')}
                variant="outline"
                className="w-full"
              >
                <Zap className="w-4 h-4 mr-2" />
                Uppgradera till Pro - 149 SEK/mån
              </Button>
            </div>
          </>
        ) : (
          <>
            <CardDescription>
              Du har obegränsad tillgång till alla AI-funktioner
            </CardDescription>
            
            {subscription.subscription_end && (
              <div className="text-sm text-gray-600">
                Förnyas: {new Date(subscription.subscription_end).toLocaleDateString('sv-SE')}
              </div>
            )}

            <Button 
              onClick={handleOpenPortal}
              variant="outline" 
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Hantera prenumeration
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
