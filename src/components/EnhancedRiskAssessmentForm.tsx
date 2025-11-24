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
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Shield, Target, Brain, RotateCcw } from 'lucide-react';
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
    // Analys- och caseinriktning
    investment_purpose: [] as string[],
    investment_horizon: '',
    investment_goal: '',
    preferred_stock_count: '',
    investment_style_preference: '',
    investment_experience: '',
    portfolio_help_focus: '',

    // Arbetssätt
    activity_preference: '',
    portfolio_change_frequency: '',
    optimization_preference: '',

    // Risk och bevakning
    risk_tolerance: '',
    risk_comfort_level: [3],
    panic_selling_history: false,
    control_importance: [3],
    market_crash_reaction: '',
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

        toast({
          title: "Formulärdata återställt",
          description: "Din tidigare ifyllda information har återställts",
        });
      }

      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
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
        investment_purpose: [] as string[],
        investment_horizon: '',
        investment_goal: '',
        preferred_stock_count: '',
        investment_style_preference: '',
        investment_experience: '',
        portfolio_help_focus: '',
        activity_preference: '',
        portfolio_change_frequency: '',
        optimization_preference: '',
        risk_tolerance: '',
        risk_comfort_level: [3],
        panic_selling_history: false,
        control_importance: [3],
        market_crash_reaction: '',
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
    'Djup fundamental bolagsanalys',
    'Teknisk setup och prisnivåer',
    'Momentum- och flödesinsikter',
    'Kassaflöde och värderingskänslighet',
    'Makro- och sektortrender',
    'Risker och bevakningspunkter'
  ];

  const sectors = [
    'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods',
    'Real Estate', 'Utilities', 'Industrials', 'Materials', 'Telecommunications'
  ];

  const steps = [
    {
      title: 'Analysinriktning',
      description: 'Vilka typer av case och insikter vill du ha?',
      icon: <Brain className="w-5 h-5" />
    },
    {
      title: 'Arbetssätt',
      description: 'Hur vill du jobba med analys och uppföljning?',
      icon: <Target className="w-5 h-5" />
    },
    {
      title: 'Risk & Bevakning',
      description: 'Hur vill du hantera volatilitet och exponering?',
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
        if (formData.investment_purpose.length === 0) errors.investment_purpose = 'Välj minst en analysinriktning';
        if (!formData.investment_style_preference) errors.investment_style_preference = 'Välj analysstil';
        if (!formData.investment_experience) errors.investment_experience = 'Välj erfarenhetsnivå';
        if (!formData.portfolio_help_focus.trim()) errors.portfolio_help_focus = 'Beskriv vilken analys du vill ha';
        break;
      case 1:
        if (!formData.activity_preference) errors.activity_preference = 'Aktivitetsnivå krävs';
        if (!formData.portfolio_change_frequency) errors.portfolio_change_frequency = 'Beslutsfrekvens krävs';
        if (!formData.investment_horizon) errors.investment_horizon = 'Tidshorisont krävs';
        if (!formData.preferred_stock_count) errors.preferred_stock_count = 'Antal bevakade case krävs';
        if (!formData.optimization_preference) errors.optimization_preference = 'Ange analysdjup';
        break;
      case 2:
        if (!formData.risk_tolerance) errors.risk_tolerance = 'Risktolerans krävs';
        if (!formData.market_crash_reaction) errors.market_crash_reaction = 'Kraschreaktion krävs';
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
        // Grundläggande (inte efterfrågade i analystflödet)
        age: null,
        annual_income: null,
        housing_situation: null,
        has_loans: null,
        loan_details: null,
        has_children: null,
        liquid_capital: null,
        emergency_buffer_months: null,

        // Sparmål & inriktning
        investment_purpose: formData.investment_purpose,
        target_amount: null,
        target_date: null,
        investment_horizon: formData.investment_horizon as any,
        investment_goal: formData.investment_goal as any,
        monthly_investment_amount: null,

        // Portföljpreferenser
        preferred_stock_count: formData.preferred_stock_count ? parseInt(formData.preferred_stock_count) : null,
        preferred_assets: null,

        // Risk
        risk_tolerance: formData.risk_tolerance as any,
        risk_comfort_level: formData.risk_comfort_level[0],
        panic_selling_history: formData.panic_selling_history,
        control_importance: formData.control_importance[0],
        market_crash_reaction: formData.market_crash_reaction,

        // Analys- och optimeringspreferenser
        portfolio_help_focus: formData.portfolio_help_focus || null,
        current_portfolio_strategy: null,
        optimization_goals: [],
        optimization_risk_focus: null,
        optimization_diversification_focus: [],
        optimization_preference: formData.optimization_preference || null,
        optimization_timeline: null,

        // Stil
        portfolio_change_frequency: formData.portfolio_change_frequency,
        activity_preference: formData.activity_preference,
        investment_style_preference: formData.investment_style_preference,
        investment_experience: formData.investment_experience as any,

        // Innehav
        current_portfolio_value: null,
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
            <div>
              <Label>Vilka typer av analyser vill du ha? *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
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
                <Label>Analysstil *</Label>
                <Select value={formData.investment_style_preference} onValueChange={(value) => handleInputChange('investment_style_preference', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj analysstil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundamental_deep">Fundamental: balansräkning, kassaflöde, värdering</SelectItem>
                    <SelectItem value="technical_momentum">Teknisk: prisnivåer, momentum, volym</SelectItem>
                    <SelectItem value="quant_screening">Kvantitativ screening med nyckeltal</SelectItem>
                    <SelectItem value="thematic_quality">Teman/kvalitet: moat, ledning, marknadsposition</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.investment_style_preference && (
                  <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.investment_style_preference}
                  </div>
                )}
              </div>

              <div>
                <Label>Erfarenhetsnivå *</Label>
                <Select value={formData.investment_experience} onValueChange={(value) => handleInputChange('investment_experience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj erfarenhetsnivå" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Nybörjare – vill ha guidning steg för steg</SelectItem>
                    <SelectItem value="intermediate">Mellan – kan grunderna, vill fördjupa</SelectItem>
                    <SelectItem value="advanced">Avancerad – vill ha sparring och datapunkter</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.investment_experience && (
                  <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.investment_experience}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Vad ska AI fokusera på i sina analyser? *</Label>
              <Textarea
                id="portfolio_help_focus"
                placeholder="Ex: scenarion för kassaflöde, tekniska nivåer jag bör bevaka, risker som kan slå mot caset"
                value={formData.portfolio_help_focus}
                onChange={(e) => handleInputChange('portfolio_help_focus', e.target.value)}
              />
              {validationErrors.portfolio_help_focus && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.portfolio_help_focus}
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label>Hur ofta vill du få nya analyser/uppdateringar? *</Label>
              <Select value={formData.activity_preference} onValueChange={(value) => handleInputChange('activity_preference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj frekvens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news_driven">Vid nyheter, rapporter eller stora rörelser</SelectItem>
                  <SelectItem value="weekly">Veckovis samlad uppdatering</SelectItem>
                  <SelectItem value="monthly">Månadsvis sammanfattning</SelectItem>
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
              <Label>Hur ofta omvärderar du dina case? *</Label>
              <Select value={formData.portfolio_change_frequency} onValueChange={(value) => handleInputChange('portfolio_change_frequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj frekvens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thesis_driven">Endast när tesen förändras</SelectItem>
                  <SelectItem value="quarterly">Vid kvartalsrapporter</SelectItem>
                  <SelectItem value="monthly">Månadsvis uppföljning</SelectItem>
                  <SelectItem value="weekly">Veckovis justering</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.portfolio_change_frequency && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.portfolio_change_frequency}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Typisk ägarhorisont *</Label>
                <Select value={formData.investment_horizon} onValueChange={(value) => handleInputChange('investment_horizon', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj horisont" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Kort (swing/0–2 år)</SelectItem>
                    <SelectItem value="medium">Medellång (3–5 år)</SelectItem>
                    <SelectItem value="long">Långsiktig (5+ år)</SelectItem>
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
                <Label>Hur många case vill du följa aktivt? *</Label>
                <Select value={formData.preferred_stock_count} onValueChange={(value) => handleInputChange('preferred_stock_count', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj antal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3–5 case (koncentrerat)</SelectItem>
                    <SelectItem value="8">6–10 case (balanserat)</SelectItem>
                    <SelectItem value="15">11–20 case (diversifierat)</SelectItem>
                    <SelectItem value="25">20+ case (bred bevakning)</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.preferred_stock_count && (
                  <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.preferred_stock_count}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Analysdjup *</Label>
              <Select value={formData.optimization_preference} onValueChange={(value) => handleInputChange('optimization_preference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj nivå" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Kort beslutsunderlag (1–2 starkaste datapunkter)</SelectItem>
                  <SelectItem value="balanced">Balanserat: huvudtes + risker + viktiga nyckeltal</SelectItem>
                  <SelectItem value="deep_dive">Djupdyk: känslighetsanalys, scenarion, multipelspänning</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.optimization_preference && (
                <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.optimization_preference}
                </div>
              )}
            </div>

            <div>
              <Label>Vilket huvudfokus har du i dina case?</Label>
              <Select value={formData.investment_goal} onValueChange={(value) => handleInputChange('investment_goal', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj fokus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Tillväxtcase</SelectItem>
                  <SelectItem value="income">Utdelnings-/kassaflödescase</SelectItem>
                  <SelectItem value="preservation">Kapitalbevarande/låg volatilitet</SelectItem>
                  <SelectItem value="balanced">Blandning av ovan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Hur reagerar du på stora nedgångar? *</Label>
              <Select value={formData.market_crash_reaction} onValueChange={(value) => handleInputChange('market_crash_reaction', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj din reaktion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="panic_sell">Säljer snabbt och minskar exponeringen</SelectItem>
                  <SelectItem value="worried_hold">Behåller men följer noga</SelectItem>
                  <SelectItem value="calm_hold">Lugn – följer planen</SelectItem>
                  <SelectItem value="buy_more">Ökar om caset håller</SelectItem>
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
                  <SelectItem value="conservative">Försiktig – vill minimera drawdowns</SelectItem>
                  <SelectItem value="moderate">Balans mellan risk och avkastning</SelectItem>
                  <SelectItem value="aggressive">Aggressiv – accepterar hög volatilitet</SelectItem>
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
              <Label>Riskkomfort (1–5): {formData.risk_comfort_level[0]}</Label>
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
              <Label>Kontrollbehov (1–5): {formData.control_importance[0]}</Label>
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
              <Label htmlFor="panic_selling">Jag har tidigare sålt i panik</Label>
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
              <Label>Sektorintressen (för att prioritera bevakning)</Label>
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

        <div className="grid grid-cols-5 gap-2 mb-6">
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
