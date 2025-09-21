import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, CheckCircle, Settings } from 'lucide-react';

const MembershipSection = () => {
  const { subscription, loading, createCheckout, openCustomerPortal } = useSubscription();

  const handleUpgrade = async () => {
    await createCheckout('premium');
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
  const tierLabel = tier === 'premium' ? 'Unlimited' : tier === 'pro' ? 'Pro' : 'Gratis';

  const benefits = [
    'Unlimited access till MarketMinds AI-analys, coach och verktyg för beslutsstöd',
    'Handplockade case, signaler och strategier som ger dig ett informationsövertag',
    'Personliga rekommendationer och mallar som sparar timmar av research varje vecka',
  ];

  return (
    <div className="space-y-6">
      <Card className="border bg-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            MarketMind Unlimited
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              69 kr/mån
            </Badge>
            {!isSubscribed && (
              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                Begränsad tid – skaffa ditt övertag
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Skapa ditt MarketMind-konto och uppgradera till Unlimited för att låsa upp hela plattformen.
            Du får en säljande kombination av smart AI-coachning, djupgående marknadsinsikter och verktyg
            som hjälper dig att agera innan marknaden gör det.
          </p>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Det här ingår
              </h3>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-muted/40 p-6 flex flex-col items-center text-center gap-4">
              <div>
                <div className="text-4xl font-bold tracking-tight">69 kr</div>
                <p className="text-sm text-muted-foreground">per månad · ingen bindningstid</p>
              </div>
              {!isSubscribed ? (
                <Button onClick={handleUpgrade} className="w-full">
                  Uppgradera och få unlimited access
                </Button>
              ) : (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-sm">
                  Du har redan unlimited access
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                Avsluta när du vill direkt via ditt konto. Full kontroll i appen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isSubscribed && (
        <Card className="border bg-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Hantera medlemskap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Du har en aktiv {tierLabel}-prenumeration. Hantera enkelt din betalning eller avsluta när som helst.
            </p>
            <Button onClick={handleManageSubscription} variant="outline" className="w-full" size="sm">
              Hantera prenumeration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MembershipSection;
