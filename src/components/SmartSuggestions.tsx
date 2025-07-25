import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSmartSuggestionsEngine } from './SmartSuggestionsEngine';
import SmartSuggestionsCard from './SmartSuggestionsCard';

const SmartSuggestions = () => {
  const { user } = useAuth();
  const {
    suggestions,
    isAnalyzing,
    shouldShow,
    dismissSuggestions,
    resetSuggestions,
    analyzeSuggestions
  } = useSmartSuggestionsEngine();

  if (!user || !shouldShow) return null;

  return (
    <SmartSuggestionsCard
      suggestions={suggestions}
      isAnalyzing={isAnalyzing}
      onDismiss={dismissSuggestions}
      onRefresh={process.env.NODE_ENV === 'development' ? resetSuggestions : analyzeSuggestions}
    />
  );
};

export default SmartSuggestions;