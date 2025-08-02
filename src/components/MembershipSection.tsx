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
    return <div className="space-y-6">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>;
  }
  const isSubscribed = subscription?.subscribed;
  const tier = subscription?.subscription_tier || 'free';
  return <div className="space-y-6">
      {/* Current Membership Status */}
      

      {/* Membership Actions */}
      <Card className="border bg-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Hantera medlemskap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSubscribed ? <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Uppgradera ditt konto för att få tillgång till obegränsade AI-funktioner och avancerade verktyg.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button onClick={() => handleUpgrade('premium')} className="w-full" size="sm">
                  <Crown className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Uppgradera till Premium</span>
                </Button>
                <Button onClick={() => handleUpgrade('pro')} variant="outline" className="w-full" size="sm">
                  <Crown className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Uppgradera till Pro</span>
                </Button>
              </div>
            </div> : <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Du har en aktiv {tier}-prenumeration. Hantera din prenumeration via Stripe.
              </p>
              <Button onClick={handleManageSubscription} variant="outline" className="w-full" size="sm">
                <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Hantera prenumeration</span>
              </Button>
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default MembershipSection;