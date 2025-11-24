import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { RiskProfile, useRiskProfile } from '@/hooks/useRiskProfile';
import { parsePortfolioHoldingsFromCSV } from '@/utils/portfolioCsvImport';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Brain, Target, RotateCcw, Upload, Plus, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedRiskAssessmentFormProps {
  onComplete: (riskProfileId: string) => void;
  initialProfile?: RiskProfile | null;
}

const STORAGE_KEY = 'enhanced_risk_assessment_form_data';
const STORAGE_STEP_KEY = 'enhanced_risk_assessment_current_step';

const DEFAULT_HOLDING = {
  id: 'holding-1',
  name: '',
  symbol: '',
  quantity: 0,
  purchasePrice: 0,
  currency: 'SEK',
  currencyManuallyEdited: false,
  nameManuallyEdited: false,
  priceManuallyEdited: false,
};

const getDefaultHoldings = () => [{ ...DEFAULT_HOLDING }];

const mapProfileToFormData = (profile: RiskProfile) => ({
  investment_purpose: profile.investment_purpose || [],
  investment_horizon: profile.investment_horizon || '',
  investment_goal: profile.investment_goal || '',
  preferred_stock_count: profile.preferred_stock_count?.toString() || '',
  investment_style_preference: profile.investment_style_preference || '',
  investment_experience: profile.investment_experience || '',
  portfolio_help_focus: profile.portfolio_help_focus || '',

  activity_preference: profile.activity_preference || '',
  optimization_preference: profile.optimization_preference || '',

  risk_tolerance: profile.risk_tolerance || '',
  risk_comfort_level: [profile.risk_comfort_level ?? 3],
  panic_selling_history: profile.panic_selling_history ?? false,
  control_importance: [profile.control_importance ?? 3],
  market_crash_reaction: profile.market_crash_reaction || '',
  overexposure_awareness: profile.overexposure_awareness || '',
  sector_interests: profile.sector_interests || [],
  holdings:
    profile.current_holdings?.length
      ? profile.current_holdings.map((holding, index) => ({
          id: `holding-${index + 1}`,
          name: holding?.name || '',
          symbol: holding?.symbol || '',
          quantity: Number(holding?.quantity) || 0,
          purchasePrice: Number(holding?.purchase_price) || 0,
          currency: holding?.currency || 'SEK',
          currencyManuallyEdited: !!holding?.currency,
          nameManuallyEdited: !!holding?.name,
          priceManuallyEdited: !!holding?.purchase_price,
        }))
      : getDefaultHoldings(),
});

const EnhancedRiskAssessmentForm: React.FC<EnhancedRiskAssessmentFormProps> = ({ onComplete, initialProfile }) => {
  const { saveRiskProfile, loading } = useRiskProfile();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const tickerDatalistId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    optimization_preference: '',

    // Risk och bevakning
    risk_tolerance: '',
    risk_comfort_level: [3],
    panic_selling_history: false,
    control_importance: [3],
    market_crash_reaction: '',
    overexposure_awareness: '',
    sector_interests: [] as string[],
    holdings: getDefaultHoldings() as {
      id: string;
      name: string;
      symbol: string;
      quantity: number;
      purchasePrice: number;
      currency: string;
      currencyManuallyEdited: boolean;
      nameManuallyEdited: boolean;
      priceManuallyEdited: boolean;
    }[],
  });

  const storageKey = initialProfile?.id
    ? `${STORAGE_KEY}_${initialProfile.id}`
    : STORAGE_KEY;
  const storageStepKey = initialProfile?.id
    ? `${STORAGE_STEP_KEY}_${initialProfile.id}`
    : STORAGE_STEP_KEY;

  // Load saved data on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      const savedStep = localStorage.getItem(storageStepKey);

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData({
          ...parsedData,
          holdings:
            parsedData.holdings && Array.isArray(parsedData.holdings) && parsedData.holdings.length > 0
              ? parsedData.holdings
              : getDefaultHoldings(),
        });

        toast({
          title: "Formulärdata återställt",
          description: "Din tidigare ifyllda information har återställts",
        });
      } else if (initialProfile) {
        setFormData(mapProfileToFormData(initialProfile));
      }

      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  }, [initialProfile, storageKey, storageStepKey, toast]);

  // Save data to localStorage whenever formData or currentStep changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      localStorage.setItem(storageStepKey, currentStep.toString());
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
    }
  }, [formData, currentStep, storageKey, storageStepKey]);

  // Clear saved data function
  const clearSavedData = useCallback((showToast = true) => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(storageStepKey);

      // Reset form to initial state
      setFormData(initialProfile ? mapProfileToFormData(initialProfile) : {
        investment_purpose: [] as string[],
        investment_horizon: '',
        investment_goal: '',
        preferred_stock_count: '',
        investment_style_preference: '',
        investment_experience: '',
        portfolio_help_focus: '',
        activity_preference: '',
        optimization_preference: '',
        risk_tolerance: '',
        risk_comfort_level: [3],
        panic_selling_history: false,
        control_importance: [3],
        market_crash_reaction: '',
        overexposure_awareness: '',
        sector_interests: [] as string[],
        holdings: getDefaultHoldings(),
      });

      setCurrentStep(0);
      setValidationErrors({});

      if (showToast) {
        toast({
          title: "Formulär återställt",
          description: "All ifylld data har raderats",
        });
      }
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  }, [initialProfile, storageKey, storageStepKey, toast]);

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
      title: 'Kom igång',
      description: 'Obligatoriska svar för att starta chatten',
      icon: <Brain className="w-5 h-5" />
    },
    {
      title: 'Fördjupa (valfritt)',
      description: 'Ge fler signaler för mer träffsäkra analyser',
      icon: <Target className="w-5 h-5" />
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
        if (!formData.risk_tolerance) errors.risk_tolerance = 'Välj din risktolerans';
        if (!formData.market_crash_reaction) errors.market_crash_reaction = 'Hur agerar du vid kraftiga fall?';
        break;
      default:
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
      const validHoldings = formData.holdings
        .filter(h => h.name.trim() && h.quantity > 0 && h.purchasePrice > 0)
        .map(h => ({
          name: h.name.trim(),
          symbol: h.symbol?.trim() || null,
          quantity: h.quantity,
          purchase_price: h.purchasePrice,
          currency: h.currency || 'SEK',
        }));

      const baseProfileData = initialProfile
        ? (({ id, user_id, created_at, updated_at, ...rest }: RiskProfile) => ({ ...rest }))(initialProfile)
        : {
            age: null,
            annual_income: null,
            housing_situation: null,
            has_loans: null,
            loan_details: null,
            has_children: null,
            liquid_capital: null,
            emergency_buffer_months: null,
            investment_purpose: [],
            target_amount: null,
            target_date: null,
            investment_horizon: null,
            investment_goal: null,
            monthly_investment_amount: null,
            preferred_stock_count: null,
            preferred_assets: null,
            risk_tolerance: null,
            risk_comfort_level: null,
            panic_selling_history: null,
            control_importance: null,
            market_crash_reaction: null,
            portfolio_help_focus: null,
            current_portfolio_strategy: null,
            optimization_goals: [],
            optimization_risk_focus: null,
            optimization_diversification_focus: [],
            optimization_preference: null,
            optimization_timeline: null,
            portfolio_change_frequency: null,
            activity_preference: null,
            investment_style_preference: null,
            investment_experience: null,
            current_portfolio_value: null,
            overexposure_awareness: null,
            sector_interests: [],
            current_holdings: null,
            current_allocation: {},
          } as Omit<RiskProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

      const profileData = {
        ...baseProfileData,
        // Sparmål & inriktning
        investment_purpose: formData.investment_purpose,
        investment_horizon: (formData.investment_horizon as RiskProfile['investment_horizon'])
          || baseProfileData.investment_horizon
          || null,
        investment_goal: (formData.investment_goal as RiskProfile['investment_goal'])
          || baseProfileData.investment_goal
          || null,

        // Portföljpreferenser
        preferred_stock_count: formData.preferred_stock_count
          ? parseInt(formData.preferred_stock_count)
          : baseProfileData.preferred_stock_count ?? null,

        // Risk
        risk_tolerance: formData.risk_tolerance as any,
        risk_comfort_level: formData.risk_comfort_level[0],
        panic_selling_history: formData.panic_selling_history,
        control_importance: formData.control_importance[0],
        market_crash_reaction: formData.market_crash_reaction,

        // Analys- och optimeringspreferenser
        portfolio_help_focus: formData.portfolio_help_focus || null,
        optimization_preference: formData.optimization_preference || null,

        // Stil
        activity_preference: formData.activity_preference || baseProfileData.activity_preference || null,
        investment_style_preference: formData.investment_style_preference,
        investment_experience: formData.investment_experience as any,

        // Innehav
        current_portfolio_value:
          validHoldings.length > 0
            ? validHoldings.reduce((total, holding) => total + holding.quantity * holding.purchase_price, 0)
            : baseProfileData.current_portfolio_value || null,
        overexposure_awareness: formData.overexposure_awareness || baseProfileData.overexposure_awareness || null,
        sector_interests: formData.sector_interests,
        current_holdings: validHoldings.length > 0 ? validHoldings : baseProfileData.current_holdings || null,
        current_allocation: baseProfileData.current_allocation || {}
      };

      const result = await saveRiskProfile(profileData);
      if (result) {
        // Clear saved data on successful submission
        clearSavedData(false);
        setFormData(mapProfileToFormData(result));
        setCurrentStep(0);
        onComplete(result.id);
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
                    <SelectItem value="beginner">Nybörjare</SelectItem>
                    <SelectItem value="intermediate">Erfaren hobbyinvesterare</SelectItem>
                    <SelectItem value="advanced">Mycket erfaren / professionell</SelectItem>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div>
              <Label>Vad vill du att chatten ska fokusera på först?</Label>
              <Select value={formData.portfolio_help_focus} onValueChange={(value) => handleInputChange('portfolio_help_focus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Valfritt: välj fokus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="find_ideas">Hitta case/idéer</SelectItem>
                  <SelectItem value="thesis_testing">Testa mina case/teser</SelectItem>
                  <SelectItem value="portfolio_review">Genomgång av min portfölj</SelectItem>
                  <SelectItem value="risk_checks">Riskkoll och bevakningslistor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Card className="bg-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-700">Valfria svar för bättre analyser</CardTitle>
                <CardDescription className="text-xs text-slate-600">Hoppa över om du vill börja chatta direkt.</CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Arbetssätt</Label>
                <Select value={formData.activity_preference} onValueChange={(value) => handleInputChange('activity_preference', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hur vill du jobba?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deep_dive">Djupdyk i färre case</SelectItem>
                    <SelectItem value="broad_scan">Bred scanning av många case</SelectItem>
                    <SelectItem value="signals_only">Snabba signaler och checklistor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Typisk ägarhorisont</Label>
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
              </div>

              <div>
                <Label>Hur många case vill du följa aktivt?</Label>
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
              </div>
            </div>

            <div>
              <Label>Analysdjup</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Registrera din portfölj (valfritt)</Label>
                  <p className="text-xs text-muted-foreground">
                    Lägg till dina nuvarande innehav för att få mer träffsäkra analyser. Uppgifterna sparas i din profil.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = (e) => {
                        try {
                          const text = e.target?.result as string;
                          const parsed = parsePortfolioHoldingsFromCSV(text).map((holding, index) => ({
                            id: `holding-${Date.now()}-${index}`,
                            name: holding.name || '',
                            symbol: holding.symbol || '',
                            quantity: holding.quantity || 0,
                            purchasePrice: holding.purchasePrice || 0,
                            currency: holding.currency || 'SEK',
                            currencyManuallyEdited: Boolean(holding.currency),
                            nameManuallyEdited: Boolean(holding.name),
                            priceManuallyEdited: Boolean(holding.purchasePrice),
                          }));

                          if (parsed.length === 0) {
                            throw new Error('Inga innehav kunde tolkas från CSV-filen');
                          }

                          setFormData(prev => ({
                            ...prev,
                            holdings: parsed,
                          }));

                          toast({
                            title: 'Innehav importerade',
                            description: `${parsed.length} innehav har lagts till från CSV-filen.`,
                          });
                        } catch (error) {
                          console.error('Failed to parse holdings CSV:', error);
                          toast({
                            title: 'Kunde inte läsa CSV',
                            description: error instanceof Error ? error.message : 'Kontrollera formatet och försök igen.',
                            variant: 'destructive',
                          });
                        } finally {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }
                      };

                      reader.readAsText(file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Importera CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        holdings: [
                          ...prev.holdings,
                          {
                            id: `holding-${Date.now()}`,
                            name: '',
                            symbol: '',
                            quantity: 0,
                            purchasePrice: 0,
                            currency: 'SEK',
                            currencyManuallyEdited: false,
                            nameManuallyEdited: false,
                            priceManuallyEdited: false,
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="w-4 h-4" />
                    Lägg till rad
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {formData.holdings.map((holding, index) => (
                  <div key={holding.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded-lg bg-muted/30">
                    <Input
                      placeholder="Företagsnamn *"
                      value={holding.name}
                      onChange={(e) =>
                        setFormData(prev => {
                          const nextHoldings = [...prev.holdings];
                          nextHoldings[index] = { ...holding, name: e.target.value, nameManuallyEdited: true };
                          return { ...prev, holdings: nextHoldings };
                        })
                      }
                      className="text-sm"
                    />
                    <Input
                      placeholder="Symbol (t.ex. AAPL)"
                      value={holding.symbol}
                      onChange={(e) =>
                        setFormData(prev => {
                          const nextHoldings = [...prev.holdings];
                          nextHoldings[index] = { ...holding, symbol: e.target.value };
                          return { ...prev, holdings: nextHoldings };
                        })
                      }
                      className="text-sm"
                      list={tickerDatalistId}
                    />
                    <Input
                      type="number"
                      placeholder="Antal *"
                      value={holding.quantity || ''}
                      onChange={(e) =>
                        setFormData(prev => {
                          const nextHoldings = [...prev.holdings];
                          nextHoldings[index] = { ...holding, quantity: Number(e.target.value) };
                          return { ...prev, holdings: nextHoldings };
                        })
                      }
                      min="0"
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder={`Köppris (${holding.currency || 'SEK'}) *`}
                      value={holding.purchasePrice || ''}
                      onChange={(e) =>
                        setFormData(prev => {
                          const nextHoldings = [...prev.holdings];
                          nextHoldings[index] = { ...holding, purchasePrice: Number(e.target.value), priceManuallyEdited: true };
                          return { ...prev, holdings: nextHoldings };
                        })
                      }
                      min="0"
                      step="0.01"
                      className="text-sm"
                    />
                    <Select
                      value={holding.currencyManuallyEdited ? holding.currency : 'SEK'}
                      onValueChange={(value) =>
                        setFormData(prev => {
                          const nextHoldings = [...prev.holdings];
                          nextHoldings[index] = { ...holding, currency: value === 'AUTO' ? 'SEK' : value, currencyManuallyEdited: true };
                          return { ...prev, holdings: nextHoldings };
                        })
                      }
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Valuta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">Auto (SEK)</SelectItem>
                        <SelectItem value="SEK">SEK</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="NOK">NOK</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={formData.holdings.length === 1}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          holdings: prev.holdings.filter(h => h.id !== holding.id),
                        }))
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <datalist id={tickerDatalistId} />

              {formData.holdings.some(h => h.name.trim() && h.quantity > 0 && h.purchasePrice > 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-2">Innehav att spara</p>
                  <div className="space-y-1 text-xs text-green-700">
                    {formData.holdings
                      .filter(h => h.name.trim() && h.quantity > 0 && h.purchasePrice > 0)
                      .map(h => (
                        <div key={`summary-${h.id}`} className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {h.name}
                          {h.symbol?.trim() ? ` (${h.symbol})` : ''}: {h.quantity} st à {h.purchasePrice} {h.currency || 'SEK'}
                        </div>
                      ))}
                  </div>
                </div>
              )}
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

        <div className="grid grid-cols-2 gap-2 mb-6">
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
