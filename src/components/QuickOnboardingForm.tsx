import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import {
  investmentExperienceOptions,
  investmentGoalExperiencedOptions,
  riskToleranceExperiencedOptions,
  timeHorizonExperiencedOptions,
  type QuestionOption
} from '@/components/ChatPortfolioAdvisor';

export interface QuickOnboardingAnswers {
  investmentExperienceLevel: string;
  investmentGoal: string;
  timeHorizon: string;
  riskTolerance: string;
}

const defaultAnswers: QuickOnboardingAnswers = {
  investmentExperienceLevel: '',
  investmentGoal: '',
  timeHorizon: '',
  riskTolerance: ''
};

const findOptionLabel = (options: QuestionOption[], value: string) =>
  options.find(option => option.value === value)?.label ?? value;

export const formatOnboardingSummary = (answers: QuickOnboardingAnswers) => {
  const parts = [
    answers.investmentGoal && `Mål: ${findOptionLabel(investmentGoalExperiencedOptions, answers.investmentGoal)}`,
    answers.timeHorizon && `Tidshorisont: ${findOptionLabel(timeHorizonExperiencedOptions, answers.timeHorizon)}`,
    answers.riskTolerance && `Risknivå: ${findOptionLabel(riskToleranceExperiencedOptions, answers.riskTolerance)}`,
    answers.investmentExperienceLevel &&
      `Erfarenhet: ${findOptionLabel(investmentExperienceOptions, answers.investmentExperienceLevel)}`
  ].filter(Boolean);

  return parts.join(' | ');
};

interface QuickOnboardingFormProps {
  onSubmit: (answers: QuickOnboardingAnswers) => void;
  initialAnswers?: Partial<QuickOnboardingAnswers>;
}

const QuickOnboardingForm = ({ onSubmit, initialAnswers }: QuickOnboardingFormProps) => {
  const [answers, setAnswers] = useState<QuickOnboardingAnswers>({
    ...defaultAnswers,
    ...initialAnswers
  });

  const isValid = useMemo(
    () => Object.values(answers).every(value => typeof value === 'string' && value.trim().length > 0),
    [answers]
  );

  const handleChange = (key: keyof QuickOnboardingAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit(answers);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Snabb investeringsstart</CardTitle>
              <p className="text-sm text-muted-foreground">
                Svara på några frågor så skickar vi dig direkt till AI-assistenten för vidare diskussion.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Vad vill du uppnå?</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={answers.investmentGoal}
                  onChange={event => handleChange('investmentGoal', event.target.value)}
                  required
                >
                  <option value="">Välj mål</option>
                  {investmentGoalExperiencedOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tidshorisont</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={answers.timeHorizon}
                  onChange={event => handleChange('timeHorizon', event.target.value)}
                  required
                >
                  <option value="">Välj alternativ</option>
                  {timeHorizonExperiencedOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Risknivå</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={answers.riskTolerance}
                  onChange={event => handleChange('riskTolerance', event.target.value)}
                  required
                >
                  <option value="">Välj nivå</option>
                  {riskToleranceExperiencedOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Investeringsvana</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={answers.investmentExperienceLevel}
                  onChange={event => handleChange('investmentExperienceLevel', event.target.value)}
                  required
                >
                  <option value="">Välj nivå</option>
                  {investmentExperienceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Vad händer nu?</span>
              <span>
                Vi använder dina svar för att starta en konversation med AI-assistenten i nästa steg. Du kan alltid justera och
                fördjupa svaren i chatten.
              </span>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={!isValid}>
              Hoppa in i AI-chatten
              <Brain className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickOnboardingForm;
