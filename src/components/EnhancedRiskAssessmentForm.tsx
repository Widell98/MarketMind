
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, TrendingUp, Shield, Target, Brain, PiggyBank, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedRiskAssessmentFormProps {
  onComplete: (riskProfileId: string) => void;
}

const STORAGE_KEY = 'enhanced_risk_assessment_form_data';
const STORAGE_STEP_KEY = 'enhanced_risk_assessment_current_step';

const EnhancedRiskAssessmentForm: React.FC<EnhancedRiskAssessmentFormProps> = ({ onComplete }) => {
  const { saveRiskProfile, loading } = useRiskProfile();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    // Grundläggande information
    age: '',
    annual_income: '',
    housing_situation: '',
    has_loans: false,
    loan_details: '',
    has_children: false,
    liquid_capital: '',
    
    // Sparmål och tidshorisont
    investment_purpose: [] as string[],
    target_amount: '',
    target_date: '',
    investment_horizon: '',
    investment_goal: '',
    monthly_investment_amount: '',
    
    // Portföljpreferenser
    preferred_stock_count: '',
    
    // Riskprofil och psykologi
    risk_tolerance: '',
    risk_comfort_level: [3],
    panic_selling_history: false,
    control_importance: [3],
    market_crash_reaction: '',
    
    // Investeringsstil
    portfolio_change_frequency: '',
    activity_preference: '',
    investment_style_preference: '',
    investment_experience: '',
    
    // Nuvarande innehav
    current_portfolio_value: '',
    overexposure_awareness: '',
    sector_interests: [] as string[]
  });

  // Load saved data on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(STORAGE_STEP_KEY);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        console.log('Loaded saved form data from localStorage');
        
        toast({
          title: "Formulärdata återställt",
          description: "Din tidigare ifyllda information har återställts",
        });
      }
      
      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
        console.log('Loaded saved step from localStorage:', savedStep);
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  }, [toast]);

  // Save data to localStorage whenever formData or currentStep changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
    }
  }, [formData, currentStep]);

  // Clear saved data function
  const clearSavedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);
      
      // Reset form to initial state
      setFormData({
        age: '',
        annual_income: '',
        housing_situation: '',
        has_loans: false,
        loan_details: '',
        has_children: false,
        liquid_capital: '',
        investment_purpose: [] as string[],
        target_amount: '',
        target_date: '',
        investment_horizon: '',
        investment_goal: '',
        monthly_investment_amount: '',
        preferred_stock_count: '',
        risk_tolerance: '',
        risk_comfort_level: [3],
        panic_selling_history: false,
        control_importance: [3],
        market_crash_reaction: '',
        portfolio_change_frequency: '',
        activity_preference: '',
        investment_style_preference: '',
        investment_experience: '',
        current_portfolio_value: '',
        overexposure_awareness: '',
        sector_interests: [] as string[]
      });
      
      setCurrentStep(0);
      setValidationErrors({});
      
      toast({
        title: "Formulär återställt",
        description: "All ifylld data har raderats",
      });
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  };

  const investmentPurposes = [
    'Bostad', 'Pension', 'Ekonomisk frihet', 'Barnens framtid', 
    'Passiv inkomst', 'Buffert', 'Upplevelser', 'Annat'
  ];

  const sectors = [
    'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods',
    'Real Estate', 'Utilities', 'Industrials', 'Materials', 'Telecommunications'
  ];

  const steps = [
    {
      title: 'Person & Kontext',
      description: 'Berätta om din ekonomiska situation',
      icon: <PiggyBank className="w-5 h-5" />
    },
    {
      title: 'Sparmål & Tidshorisont',
      description: 'Vad investerar du för?',
      icon: <Target className="w-5 h-5" />
    },
    {
      title: 'Portföljpreferenser',
      description: 'Hur vill du bygga din portfölj?',
      icon: <Shield className="w-5 h-5" />
    },
    {
      title: 'Riskprofil & Psykologi',
      description: 'Hur hanterar du risk?',
      icon: <Brain className="w-5 h-5" />
    },
    {
      title: 'Investeringsstil',
      description: 'Hur aktiv vill du vara?',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      title: 'Nuvarande Innehav',
      description: 'Vad äger du idag?',
      icon: <Shield className="w-5 h-5" />
    }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePurposeToggle = (purpose: string) => {
    setFormData(prev => ({
      ...prev,
      investment_purpose: prev.investment_purpose.includes(purpose)
        ? prev.investment_purpose.filter(p => p !== purpose)
        : [...prev.investment_purpose, purpose]
    }));
  };

  const handleSectorToggle = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      sector_interests: prev.sector_interests.includes(sector)
        ? prev.sector_interests.filter(s => s !== sector)
        : [...prev.sector_interests, sector]
    }));
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0:
        if (!formData.age) errors.age = 'Ålder krävs';
        if (!formData.annual_income) errors.annual_income = 'Årsinkomst krävs';
        if (!formData.housing_situation) errors.housing_situation = 'Bostadssituation krävs';
        break;
      case 1:
        if (formData.investment_purpose.length === 0) errors.investment_purpose = 'Välj minst ett sparmål';
        if (!formData.investment_horizon) errors.investment_horizon = 'Tidshorisont krävs';
        if (!formData.monthly_investment_amount) errors.monthly_investment_amount = 'Månadssparande krävs';
        break;
      case 2:
        if (!formData.preferred_stock_count) errors.preferred_stock_count = 'Antal innehav krävs';
        break;
      case 3:
        if (!formData.risk_tolerance) errors.risk_tolerance = 'Risktolerans krävs';
        if (!formData.market_crash_reaction) errors.market_crash_reaction = 'Kraschreaktion krävs';
        break;
      case 4:
        if (!formData.activity_preference) errors.activity_preference = 'Aktivitetspreferens krävs';
        if (!formData.investment_experience) errors.investment_experience = 'Investeringserfarenh krävs';
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    try {
      const profileData = {
        // Grundläggande
        age: formData.age ? parseInt(formData.age) : null,
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
        housing_situation: formData.housing_situation,
        has_loans: formData.has_loans,
        loan_details: formData.loan_details || null,
        has_children: formData.has_children,
        liquid_capital: formData.liquid_capital ? parseFloat(formData.liquid_capital) : null,
        emergency_buffer_months: null, // Removed this field
        
        // Sparmål
        investment_purpose: formData.investment_purpose,
        target_amount: formData.target_amount ? parseFloat(formData.target_amount) : null,
        target_date: formData.target_date || null,
        investment_horizon: formData.investment_horizon as any,
        investment_goal: formData.investment_goal as any,
        monthly_investment_amount: formData.monthly_investment_amount ? parseFloat(formData.monthly_investment_amount) : null,
        
        // Portfolio preferences
        preferred_stock_count: formData.preferred_stock_count ? parseInt(formData.preferred_stock_count) : null,
        
        // Risk
        risk_tolerance: formData.risk_tolerance as any,
        risk_comfort_level: formData.risk_comfort_level[0],
        panic_selling_history: formData.panic_selling_history,
        control_importance: formData.control_importance[0],
        market_crash_reaction: formData.market_crash_reaction,
        
        // Stil
        portfolio_change_frequency: formData.portfolio_change_frequency,
        activity_preference: formData.activity_preference,
        investment_style_preference: formData.investment_style_preference,
        investment_experience: formData.investment_experience as any,
        
        // Innehav
        current_portfolio_value: formData.current_portfolio_value ? parseFloat(formData.current_portfolio_value) : null,
        overexposure_awareness: formData.overexposure_awareness,
        sector_interests: formData.sector_interests,
        current_holdings: [],
        current_allocation: {}
      };

      const result = await saveRiskProfile(profileData);
      if (result) {
        // Clear saved data on successful submission
        clearSavedData();
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Ålder *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Din ålder"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />
                {validationErrors.age && (
                  <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.age}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="income">Årsinkomst (SEK) *</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="Din årsinkomst"
                  value={formData.annual_income}
                  onChange={(e) => handleInputChange('annual_income', e.target.value)}
                />
                {validationErrors.annual_income && (
                  <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.annual_income}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Bostadssituation *</Label>
              <Select value={formData.housing_situation} onValueChange={(value) => handleInputChange('housing_situation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj bostadssituation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owns_no_loan">Äger bostad utan lån</SelectItem>
                  <SelectItem value="owns_with_loan">Äger bostad med lån</SelectItem>
                  <SelectItem value="rents">Hyr bostad</SelectItem>
                  <SelectItem value="lives_with_parents">Bor hos föräldrar</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.housing_situation && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.housing_situation}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_loans"
                  checked={formData.has_loans}
                  onCheckedChange={(checked) => handleInputChange('has_loans', checked)}
                />
                <Label htmlFor="has_loans">Har lån (utöver bostad)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_children"
                  checked={formData.has_children}
                  onCheckedChange={(checked) => handleInputChange('has_children', checked)}
                />
                <Label htmlFor="has_children">Har barn</Label>
              </div>
            </div>

            {formData.has_loans && (
              <div>
                <Label htmlFor="loan_details">Beskrivning av lån</Label>
                <Textarea
                  id="loan_details"
                  placeholder="Beskriv dina lån (typ, belopp, ränta)"
                  value={formData.loan_details}
                  onChange={(e) => handleInputChange('loan_details', e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="liquid_capital">Likvidt kapital (SEK)</Label>
              <Input
                id="liquid_capital"
                type="number"
                placeholder="Kontanter och sparkonto"
                value={formData.liquid_capital}
                onChange={(e) => handleInputChange('liquid_capital', e.target.value)}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label>Vad investerar du för? (Välj alla som stämmer) *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {investmentPurposes.map((purpose) => (
                  <div key={purpose} className="flex items-center space-x-2">
                    <Checkbox
                      id={purpose}
                      checked={formData.investment_purpose.includes(purpose)}
                      onCheckedChange={() => handlePurposeToggle(purpose)}
                    />
                    <Label htmlFor={purpose} className="text-sm">{purpose}</Label>
                  </div>
                ))}
              </div>
              {validationErrors.investment_purpose && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.investment_purpose}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_amount">Målbelopp (SEK)</Label>
                <Input
                  id="target_amount"
                  type="number"
                  placeholder="Hur mycket vill du nå?"
                  value={formData.target_amount}
                  onChange={(e) => handleInputChange('target_amount', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="target_date">Måldatum</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => handleInputChange('target_date', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Tidshorisont *</Label>
              <Select value={formData.investment_horizon} onValueChange={(value) => handleInputChange('investment_horizon', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj tidshorisont" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Kort (1-3 år)</SelectItem>
                  <SelectItem value="medium">Medellång (3-7 år)</SelectItem>
                  <SelectItem value="long">Lång (7+ år)</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.investment_horizon && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.investment_horizon}
                </div>
              )}
            </div>

            <div>
              <Label>Primärt investeringsmål</Label>
              <Select value={formData.investment_goal} onValueChange={(value) => handleInputChange('investment_goal', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj huvudmål" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Tillväxt - Maximera långsiktig avkastning</SelectItem>
                  <SelectItem value="income">Inkomst - Generera utdelningar</SelectItem>
                  <SelectItem value="preservation">Bevarande - Skydda befintligt kapital</SelectItem>
                  <SelectItem value="balanced">Balanserat - Mix av tillväxt och inkomst</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="monthly_investment">Månadssparande (SEK) *</Label>
              <Input
                id="monthly_investment"
                type="number"
                placeholder="Hur mycket kan du spara per månad?"
                value={formData.monthly_investment_amount}
                onChange={(e) => handleInputChange('monthly_investment_amount', e.target.value)}
              />
              {validationErrors.monthly_investment_amount && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.monthly_investment_amount}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Hur många innehav vill du ha i din portfölj? *</Label>
              <p className="text-sm text-gray-600 mb-4">
                Färre innehav ger mer koncentrerad risk men potentiellt högre avkastning. 
                Fler innehav ger större riskspridning men kan vara svårare att följa.
              </p>
              <Select value={formData.preferred_stock_count} onValueChange={(value) => handleInputChange('preferred_stock_count', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj antal innehav" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3-5 innehav (Koncentrerad portfölj)</SelectItem>
                  <SelectItem value="8">6-10 innehav (Balanserad portfölj)</SelectItem>
                  <SelectItem value="15">11-20 innehav (Diversifierad portfölj)</SelectItem>
                  <SelectItem value="25">20+ innehav (Bred diversifiering)</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.preferred_stock_count && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.preferred_stock_count}
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Vägledning för val av antal innehav:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>3-5 innehav:</strong> För erfarna investerare som vill fokusera på sina bästa investeringsidéer</li>
                  <li><strong>6-10 innehav:</strong> Bra balans mellan fokus och riskspridning för de flesta investerare</li>
                  <li><strong>11-20 innehav:</strong> Ger god diversifiering utan att bli för komplicerat att följa</li>
                  <li><strong>20+ innehav:</strong> Maximal riskspridning, närmar sig indexfondsstrategi</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>Hur skulle du känna om din portfölj minskar med 20% på kort tid? *</Label>
              <Select value={formData.market_crash_reaction} onValueChange={(value) => handleInputChange('market_crash_reaction', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj din reaktion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="panic_sell">Panik - skulle sälja allt direkt</SelectItem>
                  <SelectItem value="worried_hold">Orolig men håller kvar</SelectItem>
                  <SelectItem value="calm_hold">Lugn och håller kvar</SelectItem>
                  <SelectItem value="buy_more">Ser det som en köpmöjlighet</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.market_crash_reaction && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.market_crash_reaction}
                </div>
              )}
            </div>

            <div>
              <Label>Risktolerans *</Label>
              <Select value={formData.risk_tolerance} onValueChange={(value) => handleInputChange('risk_tolerance', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj risktolerans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Konservativ - Föredrar stabilitet</SelectItem>
                  <SelectItem value="moderate">Måttlig - Accepterar viss risk</SelectItem>
                  <SelectItem value="aggressive">Aggressiv - Villig att ta hög risk</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.risk_tolerance && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.risk_tolerance}
                </div>
              )}
            </div>

            <div>
              <Label>Riskkomfort (1-5): {formData.risk_comfort_level[0]}</Label>
              <div className="mt-2">
                <Slider
                  value={formData.risk_comfort_level}
                  onValueChange={(value) => handleInputChange('risk_comfort_level', value)}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Låg risk</span>
                  <span>Hög risk</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Kontrollbehov (1-5): {formData.control_importance[0]}</Label>
              <div className="mt-2">
                <Slider
                  value={formData.control_importance}
                  onValueChange={(value) => handleInputChange('control_importance', value)}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Låg kontroll</span>
                  <span>Hög kontroll</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="panic_selling"
                checked={formData.panic_selling_history}
                onCheckedChange={(checked) => handleInputChange('panic_selling_history', checked)}
              />
              <Label htmlFor="panic_selling">Har sålt investeringar i panik tidigare</Label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label>Hur aktiv vill du vara? *</Label>
              <Select value={formData.activity_preference} onValueChange={(value) => handleInputChange('activity_preference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj aktivitetsnivå" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passive">Passiv - Följer strategi automatiskt</SelectItem>
                  <SelectItem value="semi_active">Semi-aktiv - Gör mindre justeringar</SelectItem>
                  <SelectItem value="active">Aktiv - Gör egna beslut regelbundet</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.activity_preference && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.activity_preference}
                </div>
              )}
            </div>

            <div>
              <Label>Investeringserfarenh *</Label>
              <Select value={formData.investment_experience} onValueChange={(value) => handleInputChange('investment_experience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj erfarenhetsnivå" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Nybörjare - Ny på investeringar</SelectItem>
                  <SelectItem value="intermediate">Mellan - Viss erfarenhet</SelectItem>
                  <SelectItem value="advanced">Avancerad - Erfaren investerare</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.investment_experience && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.investment_experience}
                </div>
              )}
            </div>

            <div>
              <Label>Hur ofta gör du förändringar i portföljen?</Label>
              <Select value={formData.portfolio_change_frequency} onValueChange={(value) => handleInputChange('portfolio_change_frequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj frekvens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Aldrig - Köp och håll</SelectItem>
                  <SelectItem value="rarely">Sällan - Några gånger per år</SelectItem>
                  <SelectItem value="sometimes">Ibland - Månadsvis</SelectItem>
                  <SelectItem value="often">Ofta - Veckovis</SelectItem>
                  <SelectItem value="daily">Dagligen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Investeringsstil</Label>
              <Select value={formData.investment_style_preference} onValueChange={(value) => handleInputChange('investment_style_preference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj stil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Värde - Köper undervärderade tillgångar</SelectItem>
                  <SelectItem value="growth">Tillväxt - Fokuserar på växande företag</SelectItem>
                  <SelectItem value="dividend">Utdelning - Prioriterar utdelningsaktier</SelectItem>
                  <SelectItem value="index">Index - Följer marknadsindex</SelectItem>
                  <SelectItem value="mix">Blandning av olika stilar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="current_portfolio">Nuvarande portföljvärde (SEK)</Label>
              <Input
                id="current_portfolio"
                type="number"
                placeholder="Värdet på dina nuvarande investeringar"
                value={formData.current_portfolio_value}
                onChange={(e) => handleInputChange('current_portfolio_value', e.target.value)}
              />
            </div>

            <div>
              <Label>Är du överexponerad mot något?</Label>
              <Select value={formData.overexposure_awareness} onValueChange={(value) => handleInputChange('overexposure_awareness', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj exponering" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_exposure">Nej, bra spridning</SelectItem>
                  <SelectItem value="sweden">Ja, mot Sverige</SelectItem>
                  <SelectItem value="tech">Ja, mot teknik</SelectItem>
                  <SelectItem value="single_stock">Ja, mot enskilda aktier</SelectItem>
                  <SelectItem value="currency">Ja, mot valuta (USD/EUR)</SelectItem>
                  <SelectItem value="other">Ja, mot annat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sektorintressen (Välj alla som intresserar dig)</Label>
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {steps[currentStep].icon}
            <CardTitle>Förbättrad Riskbedömning</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSavedData}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="w-4 h-4" />
            Rensa formulär
          </Button>
        </div>
        <CardDescription>
          {steps[currentStep].description} (Steg {currentStep + 1} av {steps.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-6 gap-2 mb-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`text-center p-2 rounded-lg transition-colors ${
                index <= currentStep 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <div className="flex justify-center mb-1">
                {step.icon}
              </div>
              <div className="text-xs font-medium">{step.title}</div>
            </div>
          ))}
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
            Föregående
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={Object.keys(validationErrors).length > 0}
            >
              Nästa
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(validationErrors).length > 0 || loading}
            >
              Skapa Portfölj
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedRiskAssessmentForm;
