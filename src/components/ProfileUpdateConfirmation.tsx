import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, User } from 'lucide-react';

interface ProfileUpdateConfirmationProps {
  profileUpdates: any;
  summary?: string;
  onConfirm: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
}

const ProfileUpdateConfirmation: React.FC<ProfileUpdateConfirmationProps> = ({
  profileUpdates,
  summary,
  onConfirm,
  onReject
}) => {
  const keyLabels: Record<string, string> = {
    monthly_investment_amount: 'Månadssparande',
    risk_tolerance: 'Risktolerans',
    investment_horizon: 'Tidshorisont',
    liquid_capital: 'Likvidt kapital',
    emergency_buffer_months: 'Buffert (månader)',
    preferred_stock_count: 'Önskat antal aktier',
    housing_situation: 'Bostadssituation',
    has_loans: 'Har lån'
  };

  const housingSituationLabels: Record<string, string> = {
    owns_no_loan: 'Äger bostad utan lån',
    owns_with_loan: 'Äger bostad med lån',
    rents: 'Hyr bostad',
    lives_with_parents: 'Bor hos föräldrar'
  };

  const riskToleranceLabels: Record<string, string> = {
    conservative: 'Konservativ',
    moderate: 'Måttlig',
    aggressive: 'Aggressiv'
  };

  const investmentHorizonLabels: Record<string, string> = {
    short: 'Kort (1-3 år)',
    medium: 'Medel (3-7 år)',
    long: 'Lång (7+ år)'
  };

  const formatValue = (key: string, value: any) => {
    if (key === 'housing_situation') {
      return housingSituationLabels[String(value)] ?? String(value);
    }
    if (key === 'risk_tolerance') {
      return riskToleranceLabels[String(value)] ?? String(value);
    }
    if (key === 'investment_horizon') {
      return investmentHorizonLabels[String(value)] ?? String(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Ja' : 'Nej';
    }
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value.toLocaleString('sv-SE');
    }
    return String(value);
  };

  return (
    <Card className="relative my-2 overflow-hidden rounded-[22px] border border-[#205295]/18 bg-white/95 shadow-[0_22px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#144272]/12 via-white/60 to-[#205295]/10" />
      <CardHeader className="relative flex flex-row items-start gap-3 pb-2">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#144272]/85 via-[#205295] to-[#2C74B3] text-white shadow-[0_16px_38px_rgba(20,66,114,0.22)]">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-base font-semibold text-[#0F1C2E]">
            Vill du uppdatera din profil?
          </CardTitle>
          <CardDescription className="text-sm text-[#1f3c5c]">
            {summary ?? 'Jag upptäckte förändringar i dina preferenser baserat på vår konversation:'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="space-y-2 rounded-[18px] border border-white/60 bg-white/80 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          {Object.entries(profileUpdates).map(([key, value]) => (
            <div key={key} className="flex items-start justify-between gap-3 text-sm text-[#0F1C2E]">
              <span className="font-medium text-[#144272]">
                {keyLabels[key] ?? key}
              </span>
              <span className="truncate text-right text-[#1f3c5c]">
                {formatValue(key, value)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={onConfirm}
            className="h-9 rounded-full bg-gradient-to-r from-[#205295] via-[#2C74B3] to-[#144272] px-4 text-sm font-medium shadow-[0_12px_28px_rgba(20,66,114,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(20,66,114,0.28)]"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Uppdatera profil
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="h-9 rounded-full border-[#205295]/30 bg-white/80 px-4 text-sm font-medium text-[#205295] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#144272]/40 hover:bg-white"
          >
            <X className="mr-2 h-4 w-4" />
            Behåll nuvarande
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileUpdateConfirmation;