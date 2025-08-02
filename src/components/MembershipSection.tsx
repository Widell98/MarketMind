
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, CreditCard, Calendar, Settings, CheckCircle, AlertCircle } from 'lucide-react';

const MembershipSection = () => {
  const { 
    subscription, 
    usage, 
    loading, 
    createCheckout, 
    openCustomerPortal 
  } = useSubscription();

  const handleUpgrade = async (tier: 'premium' | 'pro') => {
    await createCheckout(tier);
  };

  const handleManageSubscription = async () => {
    await openCustomerPortal();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  const isSubscribed = subscription?.subscribed;
  const tier = subscription?.subscription_tier || 'free';

  return (
    <div className="space-y-6">
      {/* Current Membership Status */}
      <Card className="border bg-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Din medlemskapsstatus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={isSubscribed ? "default" : "secondary"}
                className={isSubscribed ? "bg-blue-600 text-white" : ""}
              >
                {tier === 'free' && 'Gratis'}
                {tier === 'premium' && 'Premium'}
                {tier === 'pro' && 'Pro'}
              </Badge>
              {isSubscribed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {isSubscribed ? 'Aktiv prenumeration' : 'Ingen aktiv prenumeration'}
            </div>
          </div>

          {subscription?.subscription_end && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Förnyas: {new Date(subscription.subscription_end).toLocaleDateString('sv-SE')}</span>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">AI-meddelanden idag</div>
              <div className="text-muted-foreground">
                {isSubscribed ? 'Obegränsat' : `${usage?.ai_messages_count || 0}/5`}
              </div>
            </div>
            <div>
              <div className="font-medium">Analyser idag</div>
              <div className="text-muted-foreground">
                {isSubscribed ? 'Obegränsat' : `${usage?.analysis_count || 0}/5`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Actions */}
      <Card className="border bg-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Hantera medlemskap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSubscribed ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Uppgradera ditt konto för att få tillgång till obegränsade AI-funktioner och avancerade verktyg.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => handleUpgrade('premium')}
                  className="w-full"
                  size="sm"
                >
                  <Crown className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Uppgradera till Premium</span>
                </Button>
                <Button 
                  onClick={() => handleUpgrade('pro')}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Crown className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Uppgradera till Pro</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Du har en aktiv {tier}-prenumeration. Hantera din prenumeration via Stripe.
              </p>
              <Button 
                onClick={handleManageSubscription}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Hantera prenumeration</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipSection;
