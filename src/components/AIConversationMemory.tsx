
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationMemory {
  userId: string;
  lastInteraction: Date;
  preferences: {
    favoriteTopics: string[];
    communicationStyle: 'formal' | 'casual' | 'technical';
    responseLength: 'brief' | 'detailed' | 'comprehensive';
  };
  context: {
    currentGoals: string[];
    recentQuestions: string[];
    portfolioFocus: string[];
    riskPreferences: string[];
  };
  insights: {
    userExpertise: 'beginner' | 'intermediate' | 'advanced';
    preferredAnalysisTypes: string[];
    frequentlyAskedTopics: string[];
  };
}

interface ConversationMemoryContextType {
  memory: ConversationMemory | null;
  updateMemory: (updates: Partial<ConversationMemory>) => void;
  addRecentQuestion: (question: string) => void;
  addPreferredTopic: (topic: string) => void;
  getPersonalizedPrompt: () => string;
}

const ConversationMemoryContext = createContext<ConversationMemoryContextType | undefined>(undefined);

export const ConversationMemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [memory, setMemory] = useState<ConversationMemory | null>(null);

  useEffect(() => {
    if (user) {
      // Load memory from localStorage or initialize new memory
      const savedMemory = localStorage.getItem(`ai_memory_${user.id}`);
      if (savedMemory) {
        setMemory(JSON.parse(savedMemory));
      } else {
        const newMemory: ConversationMemory = {
          userId: user.id,
          lastInteraction: new Date(),
          preferences: {
            favoriteTopics: [],
            communicationStyle: 'casual',
            responseLength: 'detailed'
          },
          context: {
            currentGoals: [],
            recentQuestions: [],
            portfolioFocus: [],
            riskPreferences: []
          },
          insights: {
            userExpertise: 'beginner',
            preferredAnalysisTypes: [],
            frequentlyAskedTopics: []
          }
        };
        setMemory(newMemory);
      }
    }
  }, [user]);

  useEffect(() => {
    // Save memory to localStorage whenever it changes
    if (memory && user) {
      localStorage.setItem(`ai_memory_${user.id}`, JSON.stringify(memory));
    }
  }, [memory, user]);

  const updateMemory = (updates: Partial<ConversationMemory>) => {
    if (memory) {
      const updatedMemory = {
        ...memory,
        ...updates,
        lastInteraction: new Date()
      };
      setMemory(updatedMemory);
    }
  };

  const addRecentQuestion = (question: string) => {
    if (memory) {
      const updatedQuestions = [question, ...memory.context.recentQuestions].slice(0, 10);
      updateMemory({
        context: {
          ...memory.context,
          recentQuestions: updatedQuestions
        }
      });
    }
  };

  const addPreferredTopic = (topic: string) => {
    if (memory) {
      const currentTopics = memory.insights.frequentlyAskedTopics;
      const topicExists = currentTopics.find(t => t === topic);
      
      if (!topicExists) {
        const updatedTopics = [topic, ...currentTopics].slice(0, 5);
        updateMemory({
          insights: {
            ...memory.insights,
            frequentlyAskedTopics: updatedTopics
          }
        });
      }
    }
  };

  const getPersonalizedPrompt = (): string => {
    if (!memory) return '';

    const { preferences, context, insights } = memory;
    
    let prompt = `Baserat på våra tidigare konversationer:\n`;
    
    if (context.recentQuestions.length > 0) {
      prompt += `Användaren har nyligen frågat om: ${context.recentQuestions.slice(0, 3).join(', ')}\n`;
    }
    
    if (insights.frequentlyAskedTopics.length > 0) {
      prompt += `Användaren är ofta intresserad av: ${insights.frequentlyAskedTopics.join(', ')}\n`;
    }
    
    prompt += `Kommunikationsstil: ${preferences.communicationStyle}, Responslängd: ${preferences.responseLength}\n`;
    prompt += `Expertis-nivå: ${insights.userExpertise}\n`;
    
    return prompt;
  };

  return (
    <ConversationMemoryContext.Provider value={{
      memory,
      updateMemory,
      addRecentQuestion,
      addPreferredTopic,
      getPersonalizedPrompt
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
