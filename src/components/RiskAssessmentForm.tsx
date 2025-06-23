
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { ArrowLeft, ArrowRight, CheckCircle, User, Target, Brain, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RiskAssessmentFormProps {
  onComplete: (riskProfileId: string) => void;
}

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ onComplete }) => {
  const { saveRiskProfile, loading } = useRiskProfile();
  const { toast } = useToast();
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
    current_portfolio_value: '',
    // Add missing required fields with default values
    housing_situation: '',
    has_loans: false,
    loan_details: '',
    has_children: false,
    liquid_capital: '',
    emergency_buffer_months: '',
    investment_purpose: [] as string[],
    target_amount: '',
    target_date: '',
    risk_comfort_level: 3,
    panic_selling_history: false,
    control_importance: 3,
    market_crash_reaction: '',
    portfolio_change_frequency: '',
    activity_preference: '',
    investment_style_preference: '',
    overexposure_awareness: '',
    preferred_stock_count: ''
  });

  const steps = [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself',
      icon: <User className="w-5 h-5" />
    },
    {
      title: 'Investment Goals',
      description: 'What are your objectives?',
      icon: <Target className="w-5 h-5" />
    },
    {
      title: 'Risk Profile',
      description: 'How do you handle risk?',
      icon: <Brain className="w-5 h-5" />
    },
    {
      title: 'Portfolio Preferences',
      description: 'Your investment style',
      icon: <TrendingUp className="w-5 h-5" />
    }
  ];

  const sectors = [
    'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods',
    'Real Estate', 'Utilities', 'Industrials', 'Materials', 'Telecommunications'
  ];

  const handleInputChange = (field: string, value: any) => {
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

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      const profileData = {
        // Original fields
        age: formData.age ? parseInt(formData.age) : null,
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
        investment_horizon: formData.investment_horizon as any,
        investment_goal: formData.investment_goal as any,
        risk_tolerance: formData.risk_tolerance as any,
        investment_experience: formData.investment_experience as any,
        sector_interests: formData.sector_interests,
        monthly_investment_amount: formData.monthly_investment_amount ? parseFloat(formData.monthly_investment_amount) : null,
        current_portfolio_value: formData.current_portfolio_value ? parseFloat(formData.current_portfolio_value) : null,
        
        // Required new fields with defaults
        housing_situation: formData.housing_situation || null,
        has_loans: formData.has_loans,
        loan_details: formData.loan_details || null,
        has_children: formData.has_children,
        liquid_capital: formData.liquid_capital ? parseFloat(formData.liquid_capital) : null,
        emergency_buffer_months: formData.emergency_buffer_months ? parseInt(formData.emergency_buffer_months) : null,
        investment_purpose: formData.investment_purpose,
        target_amount: formData.target_amount ? parseFloat(formData.target_amount) : null,
        target_date: formData.target_date || null,
        risk_comfort_level: formData.risk_comfort_level,
        panic_selling_history: formData.panic_selling_history,
        control_importance: formData.control_importance,
        market_crash_reaction: formData.market_crash_reaction || null,
        portfolio_change_frequency: formData.portfolio_change_frequency || null,
        activity_preference: formData.activity_preference || null,
        investment_style_preference: formData.investment_style_preference || null,
        overexposure_awareness: formData.overexposure_awareness || null,
        preferred_stock_count: formData.preferred_stock_count ? parseInt(formData.preferred_stock_count) : null,
        current_holdings: [],
        current_allocation: {}
      };

      const result = await saveRiskProfile(profileData);
      if (result) {
        onComplete('profile-created');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save risk profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Your age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="income">Annual Income (SEK)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="Your annual income"
                  value={formData.annual_income}
                  onChange={(e) => handleInputChange('annual_income', e.target.value)}
                />
              </div>
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
              <Label>Investment Horizon</Label>
              <Select value={formData.investment_horizon} onValueChange={(value) => handleInputChange('investment_horizon', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (1-3 years)</SelectItem>
                  <SelectItem value="medium">Medium (3-7 years)</SelectItem>
                  <SelectItem value="long">Long (7+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Investment Goal</Label>
              <Select value={formData.investment_goal} onValueChange={(value) => handleInputChange('investment_goal', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="preservation">Preservation</SelectItem>
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
                  <SelectValue placeholder="Select tolerance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Investment Experience</Label>
              <Select value={formData.investment_experience} onValueChange={(value) => handleInputChange('investment_experience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sector Interests</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
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

            <div>
              <Label htmlFor="current_portfolio">Current Portfolio Value (SEK)</Label>
              <Input
                id="current_portfolio"
                type="number"
                placeholder="Value of your current investments"
                value={formData.current_portfolio_value}
                onChange={(e) => handleInputChange('current_portfolio_value', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {steps[currentStep].icon}
          Risk Assessment
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

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              Create Portfolio
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentForm;
