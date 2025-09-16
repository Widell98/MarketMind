import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, User } from 'lucide-react';

interface ProfileUpdateConfirmationProps {
  profileUpdates: any;
  onConfirm: () => void;
  onReject: () => void;
}

const ProfileUpdateConfirmation: React.FC<ProfileUpdateConfirmationProps> = ({
  profileUpdates,
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
    <Card className="border-blue-200 bg-blue-50 my-2">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-full shrink-0">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-blue-900 mb-2">
              Vill du uppdatera din profil?
            </h4>
            
            <p className="text-sm text-blue-700 mb-3">
              Jag upptäckte förändringar i dina preferenser baserat på vår konversation:
            </p>

            <div className="space-y-1 mb-4">
              {Object.entries(profileUpdates).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-blue-800">
                    {keyLabels[key] ?? key}:
                  </span>{' '}
                  <span className="text-blue-700">{formatValue(key, value)}</span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={onConfirm}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Uppdatera profil
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={onReject}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <X className="w-4 h-4 mr-2" />
                Behåll nuvarande
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileUpdateConfirmation;