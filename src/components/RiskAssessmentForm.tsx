
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface RiskAssessmentFormProps {
  onComplete: (riskProfileId: string) => void;
}

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ onComplete }) => {
  const { saveRiskProfile, loading } = useRiskProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    age: '',
    annual_income: '',
    investment_horizon: '',
    investment_goal: '',
    risk_tolerance: '',
    investment_experience: '',
    sector_interests: [] as string[],
    monthly_investment_amount: '',
    current_portfolio_value: ''
  });

  const sectors = [
    'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods',
    'Real Estate', 'Utilities', 'Industrials', 'Materials', 'Telecommunications'
  ];

  const steps = [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself'
    },
    {
      title: 'Investment Goals',
      description: 'What are your investment objectives?'
    },
    {
      title: 'Risk & Experience',
      description: 'Help us understand your risk tolerance'
    },
    {
      title: 'Sector Preferences',
      description: 'Which sectors interest you?'
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSectorToggle = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      sector_interests: prev.sector_interests.includes(sector)
        ? prev.sector_interests.filter(s => s !== sector)
        : [...prev.sector_interests, sector]
    }));
  };

  const handleSubmit = async () => {
    const profileData = {
      age: formData.age ? parseInt(formData.age) : null,
      annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
      investment_horizon: formData.investment_horizon as any,
      investment_goal: formData.investment_goal as any,
      risk_tolerance: formData.risk_tolerance as any,
      investment_experience: formData.investment_experience as any,
      sector_interests: formData.sector_interests,
      monthly_investment_amount: formData.monthly_investment_amount ? parseFloat(formData.monthly_investment_amount) : null,
      current_portfolio_value: formData.current_portfolio_value ? parseFloat(formData.current_portfolio_value) : null
    };

    const success = await saveRiskProfile(profileData);
    if (success) {
      // The risk profile ID will be available after saving
      onComplete('generated');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter your age"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="income">Annual Income (SEK)</Label>
              <Input
                id="income"
                type="number"
                placeholder="Enter your annual income"
                value={formData.annual_income}
                onChange={(e) => handleInputChange('annual_income', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="current_value">Current Portfolio Value (SEK)</Label>
              <Input
                id="current_value"
                type="number"
                placeholder="Enter current portfolio value (0 if starting fresh)"
                value={formData.current_portfolio_value}
                onChange={(e) => handleInputChange('current_portfolio_value', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="monthly_investment">Monthly Investment Amount (SEK)</Label>
              <Input
                id="monthly_investment"
                type="number"
                placeholder="How much can you invest monthly?"
                value={formData.monthly_investment_amount}
                onChange={(e) => handleInputChange('monthly_investment_amount', e.target.value)}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Investment Time Horizon</Label>
              <Select value={formData.investment_horizon} onValueChange={(value) => handleInputChange('investment_horizon', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investment horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short-term (1-3 years)</SelectItem>
                  <SelectItem value="medium">Medium-term (3-7 years)</SelectItem>
                  <SelectItem value="long">Long-term (7+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary Investment Goal</Label>
              <Select value={formData.investment_goal} onValueChange={(value) => handleInputChange('investment_goal', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your main goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Growth - Maximize long-term returns</SelectItem>
                  <SelectItem value="income">Income - Generate regular dividends</SelectItem>
                  <SelectItem value="preservation">Preservation - Protect existing wealth</SelectItem>
                  <SelectItem value="balanced">Balanced - Mix of growth and income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Risk Tolerance</Label>
              <Select value={formData.risk_tolerance} onValueChange={(value) => handleInputChange('risk_tolerance', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your risk tolerance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative - Prefer stability over high returns</SelectItem>
                  <SelectItem value="moderate">Moderate - Accept some risk for better returns</SelectItem>
                  <SelectItem value="aggressive">Aggressive - Willing to take high risks for high returns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Investment Experience</Label>
              <Select value={formData.investment_experience} onValueChange={(value) => handleInputChange('investment_experience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - New to investing</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Some investment experience</SelectItem>
                  <SelectItem value="advanced">Advanced - Experienced investor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label>Sector Interests (Select all that interest you)</Label>
            <div className="grid grid-cols-2 gap-3">
              {sectors.map((sector) => (
                <div key={sector} className="flex items-center space-x-2">
                  <Checkbox
                    id={sector}
                    checked={formData.sector_interests.includes(sector)}
                    onCheckedChange={() => handleSectorToggle(sector)}
                  />
                  <Label htmlFor={sector} className="text-sm">{sector}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.age && formData.annual_income && formData.monthly_investment_amount;
      case 1:
        return formData.investment_horizon && formData.investment_goal;
      case 2:
        return formData.risk_tolerance && formData.investment_experience;
      case 3:
        return true; // Sector interests are optional
      default:
        return false;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          Risk Assessment Questionnaire
        </CardTitle>
        <CardDescription>
          {steps[currentStep].description} (Step {currentStep + 1} of {steps.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">{steps[currentStep].title}</h3>
          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
            >
              Generate Portfolio
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentForm;
