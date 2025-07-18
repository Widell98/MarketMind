
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import EnhancedRiskAssessmentForm from './EnhancedRiskAssessmentForm';

interface OnboardingProps {
  onComplete: (level: string, interests: string[]) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>(user?.user_metadata?.display_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleRiskAssessmentComplete = async (riskProfileId: string) => {
    setIsSubmitting(true);
    
    // If display name was changed, update user metadata
    if (displayName && displayName !== user?.user_metadata?.display_name) {
      try {
        await supabase.auth.updateUser({
          data: { display_name: displayName }
        });
      } catch (error) {
        console.error('Error updating user metadata:', error);
      }
    }
    
    // Complete onboarding with default values
    // The actual risk profile data is now stored in the database
    onComplete('analyst', ['Aktier']); // Default values since we have detailed profile
    setIsSubmitting(false);
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 p-5 flex flex-col">
      <div className="text-center mb-8 mt-8">
        <h1 className="text-2xl font-bold text-finance-navy mb-2">Välkommen till Market Mentor</h1>
        <p className="text-finance-gray">Låt oss skapa din personliga investeringsprofil</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <EnhancedRiskAssessmentForm onComplete={handleRiskAssessmentComplete} />
      </div>
      
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-finance-navy" />
            <span className="text-finance-navy">Skapar din portfölj...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
