import React from 'react';
import EnhancedRiskAssessmentForm from './EnhancedRiskAssessmentForm';

interface RiskAssessmentFormProps {
  onComplete: (riskProfileId: string) => void;
}

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ onComplete }) => {
  return <EnhancedRiskAssessmentForm onComplete={onComplete} />;
};

export default RiskAssessmentForm;
