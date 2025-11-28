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
    <div className="space-y-4 sm:space-y-6">
      <Card className="border bg-background rounded-lg sm:rounded-xl">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="break-words">MarketMind Unlimited</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 pt-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm">
              69 kr/mån
            </Badge>
            {!isSubscribed && (
              <span className="text-[10px] xs:text-xs font-medium uppercase tracking-wide text-primary">
                Begränsad tid – skaffa ditt övertag
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Skapa ditt MarketMind-konto och uppgradera till Unlimited för att låsa upp hela plattformen.
            Du får en säljande kombination av smart AI-coachning, djupgående marknadsinsikter och verktyg
            som hjälper dig att agera innan marknaden gör det.
          </p>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Det här ingår
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-foreground">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    <span className="break-words">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg sm:rounded-xl border bg-muted/40 p-4 sm:p-6 flex flex-col items-center text-center gap-3 sm:gap-4">
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">69 kr</div>
                <p className="text-xs sm:text-sm text-muted-foreground">per månad · ingen bindningstid</p>
              </div>
              {!isSubscribed ? (
                <Button onClick={handleUpgrade} className="w-full text-xs sm:text-sm">
                  Uppgradera och få unlimited access
                </Button>
              ) : (
                <Badge variant="outline" className="rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm">
                  Du har redan unlimited access
                </Badge>
              )}
              <p className="text-[10px] xs:text-xs text-muted-foreground">
                Avsluta när du vill direkt via ditt konto. Full kontroll i appen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isSubscribed && (
        <Card className="border bg-background rounded-lg sm:rounded-xl">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="break-words">Hantera medlemskap</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Du har en aktiv {tierLabel}-prenumeration. Hantera enkelt din betalning eller avsluta när som helst.
            </p>
            <Button onClick={handleManageSubscription} variant="outline" className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
              Hantera prenumeration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MembershipSection;
