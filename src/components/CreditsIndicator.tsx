import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
interface CreditsIndicatorProps {
  type?: 'ai_message' | 'analysis' | 'insights' | 'predictive_analysis';
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}
const CreditsIndicator = ({
  type = 'ai_message',
  showUpgrade = true,
  onUpgrade
}: CreditsIndicatorProps) => {
  const {
    subscription,
    getRemainingUsage,
    isAdmin
  } = useSubscription();
  const {
    user
  } = useAuth();
  if (!user) return null;
  const isPremium = subscription?.subscribed;
  const remaining = getRemainingUsage(type);

  if (isAdmin) {
    return <Badge variant="secondary" className="text-xs">
        <Zap className="w-3 h-3 mr-1" />
        ∞ credits (admin)
      </Badge>;
  }

  if (isPremium) {
    return null;
  }

  const total = 5;
  const safeRemaining = Number.isFinite(remaining) ? remaining : total;
  const labelRemaining = Math.max(0, Math.min(total, safeRemaining));

  return <div className="flex items-center gap-2">
      <Badge variant={labelRemaining > 0 ? "secondary" : "destructive"} className="text-xs">
        <Zap className="w-3 h-3 mr-1" />
        {labelRemaining}/{total} credits kvar idag
      </Badge>
      {showUpgrade && labelRemaining === 0 && onUpgrade && <Button size="sm" onClick={onUpgrade} className="text-xs h-6 px-2">
          <Crown className="w-3 h-3 mr-1" />
          Uppgradera
        </Button>}
    </div>;
};
export default CreditsIndicator;