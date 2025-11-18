import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, ClipboardList, Layers3, LineChart } from 'lucide-react';

interface EnhancedRiskAssessmentFormProps {
  onComplete: (riskProfileId: string) => void;
}

const analysisFocusOptions = [
  { value: 'macro', title: 'Makro', description: 'Fokus på konjunktur, räntor och geopolitik.' },
  { value: 'fundamental', title: 'Fundamental', description: 'Djupdyk i bolag, kassaflöden och värderingar.' },
  { value: 'technical', title: 'Teknisk', description: 'Prisformationer, momentum och volatilitet.' },
  { value: 'mixed', title: 'Hybrid', description: 'Kombination av flera analysstilar.' }
];

const analysisDepthOptions = [
  { value: 'light', title: 'Snabb översikt', description: 'Hög nivå med de viktigaste datapunkterna.' },
  { value: 'normal', title: 'Standard', description: 'Balans mellan resonemang och datapunkter.' },
  { value: 'deep', title: 'Djupdykning', description: 'Detaljerad research med multipla vinklar.' }
];

const analysisTimeframeOptions = [
  { value: 'short', title: 'Kort sikt (0–3 mån)', description: 'Handlingsinriktade lägen just nu.' },
  { value: 'medium', title: 'Medellång (3–12 mån)', description: 'Trend- och temafokus.' },
  { value: 'long', title: 'Lång sikt (12+ mån)', description: 'Strukturella möjligheter och scenarier.' }
];

const outputFormatOptions = [
  { value: 'bullets', title: 'Punktlistor', description: 'Snabbt att skumma, perfekt för bevakning.' },
  { value: 'paragraphs', title: 'Berättande', description: 'Flytande text med tydliga resonemang.' },
  { value: 'equity_report', title: 'Analysrapport', description: 'Rapportstil med rubriker och datapunkter.' },
  { value: 'highlights', title: 'Highlights', description: 'Kortfattade slutsatser och “key takeaways”.' }
];

const sectorOptions = ['Teknik', 'Hälsovård', 'Industri', 'Energi', 'Finans', 'Fastigheter', 'Konsument', 'Råvaror'];
const assetOptions = ['Aktier', 'Investmentbolag', 'Råvaror', 'Krypto', 'Räntor', 'ETF:er'];
const modelPortfolioStyleOptions = [
  { value: 'defensive', title: 'Defensiv', description: 'Fokus på stabila, lågvolatila scenarier.' },
  { value: 'balanced', title: 'Balanserad', description: 'Mix av stabilitet och tillväxt.' },
  { value: 'growth', title: 'Tillväxt', description: 'Scenarier som prioriterar offensiv potential.' },
  { value: 'thematic', title: 'Tematisk', description: 'Case kopplade till tydliga teman eller megatrender.' },
  { value: 'broad', title: 'Breddad', description: 'Visa hur en bred marknadsexponering kan se ut.' },
];
const experienceOptions = [
  { value: 'beginner', label: 'Nybörjare' },
  { value: 'intermediate', label: 'Erfaren' },
  { value: 'advanced', label: 'Avancerad' },
];

const EnhancedRiskAssessmentForm: React.FC<EnhancedRiskAssessmentFormProps> = ({ onComplete }) => {
  const { saveRiskProfile, loading } = useRiskProfile();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    analysis_focus: '',
    analysis_depth: '',
    analysis_timeframe: '',
    output_format: '',
    sector_interests: [] as string[],
    preferred_assets: [] as string[],
    has_current_portfolio: null as boolean | null,
    investment_experience: '',
    age: '',
    model_portfolio_style: '',
  });

  const steps = [
    { title: 'Analysinriktning', description: 'Hur vill du att MarketMind ska resonera?', icon: <LineChart className="w-5 h-5" /> },
    { title: 'Tonalitet & Format', description: 'Hur tekniskt och i vilket format?', icon: <Layers3 className="w-5 h-5" /> },
    { title: 'Fokusområden', description: 'Vad ska analyserna täcka?', icon: <ClipboardList className="w-5 h-5" /> },
  ];

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleListValue = (field: 'sector_interests' | 'preferred_assets', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const isStepValid = useMemo(() => {
    if (currentStep === 0) {
      return Boolean(formData.analysis_focus && formData.analysis_depth && formData.analysis_timeframe);
    }
    if (currentStep === 1) {
      return Boolean(formData.output_format && formData.investment_experience && formData.has_current_portfolio !== null);
    }
    if (currentStep === 2) {
      return formData.sector_interests.length > 0 && formData.preferred_assets.length > 0;
    }
    return true;
  }, [currentStep, formData]);

  const handleSubmit = async () => {
    try {
      const payload = {
        analysis_focus: formData.analysis_focus,
        analysis_depth: formData.analysis_depth,
        analysis_timeframe: formData.analysis_timeframe,
        output_format: formData.output_format,
        sector_interests: formData.sector_interests,
        preferred_assets: formData.preferred_assets,
        has_current_portfolio: formData.has_current_portfolio,
        investment_experience: formData.investment_experience as 'beginner' | 'intermediate' | 'advanced',
        model_portfolio_style: formData.model_portfolio_style || null,
        age: formData.age ? parseInt(formData.age, 10) : null,
      };

      const result = await saveRiskProfile(payload);
      if (result) {
        toast({ title: 'Analysprofil sparad', description: 'MarketMind använder nu dina analystekniska preferenser.' });
        onComplete(result.id || 'analysis-profile-created');
      }
    } catch (error) {
      console.error('Failed to save analysis profile', error);
      toast({
        title: 'Något gick fel',
        description: 'Kunde inte spara analysprofilen. Försök igen.',
        variant: 'destructive',
      });
    }
  };

  const renderOptionGrid = (
    options: { value: string; title: string; description: string }[],
    activeValue: string,
    onSelect: (value: string) => void
  ) => (
    <div className="grid gap-3 md:grid-cols-2">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`rounded-xl border p-4 text-left transition-colors ${
            activeValue === option.value
              ? 'border-finance-blue bg-finance-lightBlue/10'
              : 'hover:border-finance-blue/40'
          }`}
        >
          <div className="font-semibold text-finance-navy">{option.title}</div>
          <p className="text-sm text-finance-gray">{option.description}</p>
        </button>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-base font-semibold text-finance-navy">Vilken typ av analys vill du ha?</h3>
              {renderOptionGrid(analysisFocusOptions, formData.analysis_focus, value => updateField('analysis_focus', value))}
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-finance-navy">Hur detaljerad ska analysen vara?</h3>
              {renderOptionGrid(analysisDepthOptions, formData.analysis_depth, value => updateField('analysis_depth', value))}
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-finance-navy">Vilken tidsram ska prioriteras?</h3>
              {renderOptionGrid(
                analysisTimeframeOptions,
                formData.analysis_timeframe,
                value => updateField('analysis_timeframe', value)
              )}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-base font-semibold text-finance-navy">Hur vill du att svaren ska struktureras?</h3>
              {renderOptionGrid(outputFormatOptions, formData.output_format, value => updateField('output_format', value))}
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">Hur erfaren är du?</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {experienceOptions.map(option => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => updateField('investment_experience', option.value)}
                    className={`rounded-xl border p-3 text-center text-sm font-semibold transition-colors ${
                      formData.investment_experience === option.value
                        ? 'border-finance-blue bg-finance-lightBlue/10 text-finance-blue'
                        : 'hover:border-finance-blue/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block text-sm font-medium">Har du en portfölj idag?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: true, label: 'Ja, ta hänsyn till den' },
                    { value: false, label: 'Nej, börja från noll' },
                  ].map(option => (
                    <button
                      type="button"
                      key={String(option.value)}
                      onClick={() => updateField('has_current_portfolio', option.value)}
                      className={`rounded-xl border p-3 text-center text-sm font-semibold transition-colors ${
                        formData.has_current_portfolio === option.value
                          ? 'border-finance-blue bg-finance-lightBlue/10 text-finance-blue'
                          : 'hover:border-finance-blue/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="age" className="mb-2 block text-sm font-medium">Ålder (valfritt)</Label>
                <Input
                  id="age"
                  type="number"
                  min={18}
                  placeholder="Ex. 32"
                  value={formData.age}
                  onChange={event => updateField('age', event.target.value)}
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold text-finance-navy">Vilken stil ska modellportföljerna ha?</h3>
              {renderOptionGrid(
                modelPortfolioStyleOptions,
                formData.model_portfolio_style,
                value => updateField('model_portfolio_style', value)
              )}
              <p className="mt-2 text-sm text-finance-gray">Valfritt men hjälper MarketMind att välja rätt ton i sina exempel.</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-base font-semibold text-finance-navy">Vilka sektorer vill du att MarketMind fokuserar på?</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {sectorOptions.map(sector => (
                  <button
                    type="button"
                    key={sector}
                    onClick={() => toggleListValue('sector_interests', sector)}
                    className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                      formData.sector_interests.includes(sector)
                        ? 'border-finance-blue bg-finance-lightBlue/10 text-finance-blue'
                        : 'hover:border-finance-blue/40'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold text-finance-navy">Vilka tillgångstyper ska analyserna täcka?</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {assetOptions.map(asset => (
                  <button
                    type="button"
                    key={asset}
                    onClick={() => toggleListValue('preferred_assets', asset)}
                    className={`rounded-xl border p-3 text-center text-sm transition-colors ${
                      formData.preferred_assets.includes(asset)
                        ? 'border-finance-blue bg-finance-lightBlue/10 text-finance-blue'
                        : 'hover:border-finance-blue/40'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-finance-blue/40 bg-finance-lightBlue/5 p-4 text-sm text-finance-gray">
              <p>
                Dina val sparas som en analysprofil och används varje gång MarketMind genererar ett svar. Du kan alltid ändra
                preferenserna direkt i chatten senare.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-finance-navy">Bygg din analysprofil</CardTitle>
        <CardDescription>
          Vi fokuserar på dina analytiska preferenser istället för riskaptit. MarketMind använder dem för att låta som din
          egen researchpartner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`rounded-xl border p-4 ${
                index === currentStep ? 'border-finance-blue bg-finance-lightBlue/5' : 'border-gray-200'
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-finance-navy">
                {step.icon}
                <span className="font-semibold">{step.title}</span>
              </div>
              <p className="text-sm text-finance-gray">{step.description}</p>
            </div>
          ))}
        </div>

        {renderStep()}

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setCurrentStep(Math.max(currentStep - 1, 0))} disabled={currentStep === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Tillbaka
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1))} disabled={!isStepValid}>
              Nästa steg <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isStepValid || loading}>
              {loading ? 'Sparar...' : (
                <span className="flex items-center">
                  Slutför profil
                  <CheckCircle className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedRiskAssessmentForm;
