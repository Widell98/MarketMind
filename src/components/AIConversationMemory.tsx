import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AIMemoryRow = Database['public']['Tables']['user_ai_memory']['Row'];

type ConversationMemory = {
  userId: string;
  lastInteraction: string | null;
  favoriteTopics: string[];
  communicationStyle: 'formal' | 'casual' | 'technical';
  responseLength: 'brief' | 'detailed' | 'comprehensive';
  currentGoals: string[];
  recentQuestions: string[];
  portfolioFocus: string[];
  riskPreferences: string[];
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredAnalysisTypes: string[];
  frequentlyAskedTopics: string[];
};

interface ConversationMemoryContextType {
  memory: ConversationMemory | null;
  updateMemory: (updates: Partial<ConversationMemory>) => void;
  addRecentQuestion: (question: string) => void;
  addPreferredTopic: (topic: string) => void;
  getPersonalizedPrompt: () => string;
}

const ConversationMemoryContext = createContext<ConversationMemoryContextType | undefined>(undefined);

const parseStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const createDefaultMemory = (userId: string): ConversationMemory => ({
  userId,
  lastInteraction: new Date().toISOString(),
  favoriteTopics: [],
  communicationStyle: 'casual',
  responseLength: 'detailed',
  currentGoals: [],
  recentQuestions: [],
  portfolioFocus: [],
  riskPreferences: [],
  expertiseLevel: 'beginner',
  preferredAnalysisTypes: [],
  frequentlyAskedTopics: [],
});

const mapRowToMemory = (row: AIMemoryRow): ConversationMemory => {
  const riskMetadata =
    row.risk_comfort_patterns && typeof row.risk_comfort_patterns === 'object' && !Array.isArray(row.risk_comfort_patterns)
      ? (row.risk_comfort_patterns as Record<string, unknown>)
      : {};

  const recentQuestions = parseStringArray(riskMetadata.recent_questions);
  const riskPreferences = parseStringArray(riskMetadata.risk_preferences);

  return {
    userId: row.user_id,
    lastInteraction: row.last_interaction,
    favoriteTopics: parseStringArray(row.favorite_sectors),
    communicationStyle: (row.communication_style as ConversationMemory['communicationStyle']) ?? 'casual',
    responseLength: (row.preferred_response_length as ConversationMemory['responseLength']) ?? 'detailed',
    currentGoals: parseStringArray(row.current_goals),
    recentQuestions,
    portfolioFocus: parseStringArray(row.preferred_companies),
    riskPreferences,
    expertiseLevel: (row.expertise_level as ConversationMemory['expertiseLevel']) ?? 'beginner',
    preferredAnalysisTypes: parseStringArray(row.preferred_interaction_times),
    frequentlyAskedTopics: parseStringArray(row.frequently_asked_topics),
  };
};

const mapMemoryToPayload = (value: ConversationMemory) => ({
  user_id: value.userId,
  last_interaction: value.lastInteraction ?? new Date().toISOString(),
  favorite_sectors: value.favoriteTopics,
  communication_style: value.communicationStyle,
  preferred_response_length: value.responseLength,
  current_goals: value.currentGoals,
  preferred_companies: value.portfolioFocus,
  expertise_level: value.expertiseLevel,
  preferred_interaction_times: value.preferredAnalysisTypes,
  frequently_asked_topics: value.frequentlyAskedTopics,
  risk_comfort_patterns: {
    recent_questions: value.recentQuestions,
    risk_preferences: value.riskPreferences,
  },
});

export const ConversationMemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [memory, setMemory] = useState<ConversationMemory | null>(null);

  const persistMemory = useCallback(
    async (value: ConversationMemory) => {
      if (!user) return;

      try {
        await supabase
          .from('user_ai_memory')
          .upsert(mapMemoryToPayload(value), { onConflict: 'user_id' });
      } catch (error) {
        console.warn('Failed to persist AI conversation memory', { message: (error as Error).message });
      }
    },
    [user]
  );

  useEffect(() => {
    let isMounted = true;

    const loadMemory = async () => {
      if (!user) {
        if (isMounted) {
          setMemory(null);
        }
        return;
      }

      const { data, error } = await supabase
        .from('user_ai_memory')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.warn('Failed to load AI conversation memory', { message: error.message });
        const fallback = createDefaultMemory(user.id);
        setMemory(fallback);
        void persistMemory(fallback);
        return;
      }

      if (data) {
        setMemory(mapRowToMemory(data));
        return;
      }

      const initialMemory = createDefaultMemory(user.id);
      setMemory(initialMemory);
      void persistMemory(initialMemory);
    };

    loadMemory();

    return () => {
      isMounted = false;
    };
  }, [persistMemory, user]);

  const updateMemory = (updates: Partial<ConversationMemory>) => {
    if (!memory) {
      return;
    }

    const updatedMemory: ConversationMemory = {
      ...memory,
      ...updates,
      lastInteraction: new Date().toISOString(),
    };

    setMemory(updatedMemory);
    void persistMemory(updatedMemory);
  };

  const addRecentQuestion = (question: string) => {
    if (!memory) {
      return;
    }

    const updatedQuestions = [question, ...memory.recentQuestions.filter(item => item !== question)].slice(0, 10);
    updateMemory({
      recentQuestions: updatedQuestions,
    });
  };

  const addPreferredTopic = (topic: string) => {
    if (!memory) {
      return;
    }

    if (memory.frequentlyAskedTopics.includes(topic)) {
      return;
    }

    const updatedTopics = [topic, ...memory.frequentlyAskedTopics].slice(0, 5);
    updateMemory({
      frequentlyAskedTopics: updatedTopics,
    });
  };

  const getPersonalizedPrompt = (): string => {
    if (!memory) return '';

    let prompt = `Baserat på våra tidigare konversationer:\n`;

    if (memory.recentQuestions.length > 0) {
      prompt += `Användaren har nyligen frågat om: ${memory.recentQuestions.slice(0, 3).join(', ')}\n`;
    }

    if (memory.frequentlyAskedTopics.length > 0) {
      prompt += `Användaren är ofta intresserad av: ${memory.frequentlyAskedTopics.join(', ')}\n`;
    }

    if (memory.preferredAnalysisTypes.length > 0) {
      prompt += `Föredragna analysformat: ${memory.preferredAnalysisTypes.join(', ')}\n`;
    }

    prompt += `Kommunikationsstil: ${memory.communicationStyle}, Responslängd: ${memory.responseLength}\n`;
    prompt += `Expertis-nivå: ${memory.expertiseLevel}\n`;

    return prompt;
  };

  return (
    <ConversationMemoryContext.Provider value={{
      memory,
      updateMemory,
      addRecentQuestion,
      addPreferredTopic,
      getPersonalizedPrompt,
    }}>
      {children}
    </ConversationMemoryContext.Provider>
  );
};

export const useConversationMemory = () => {
  const context = useContext(ConversationMemoryContext);
  if (context === undefined) {
    throw new Error('useConversationMemory must be used within a ConversationMemoryProvider');
  }
  return context;
};
