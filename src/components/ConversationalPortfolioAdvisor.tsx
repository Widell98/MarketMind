import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QuickOnboardingForm, {
  type QuickOnboardingAnswers,
  formatOnboardingSummary
} from '@/components/QuickOnboardingForm';

const ConversationalPortfolioAdvisor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = (answers: QuickOnboardingAnswers) => {
    const onboardingAnswers = {
      ...answers,
      source: searchParams.get('source') || 'portfolio-advisor',
    };

    const onboardingSummary = formatOnboardingSummary(answers);

    const initialMessage = onboardingSummary
      ? `Här är mina svar: ${onboardingSummary}. Kan du föreslå en investeringsplan utifrån detta?`
      : 'Kan du hjälpa mig att ta fram en investeringsplan?';

    navigate('/ai-chat', {
      state: {
        onboardingAnswers,
        createNewSession: true,
        sessionName: 'Snabb onboarding',
        initialMessage,
      },
    });
  };

  return <QuickOnboardingForm onSubmit={handleSubmit} />;
};

export default ConversationalPortfolioAdvisor;
