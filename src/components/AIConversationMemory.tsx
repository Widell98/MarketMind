
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationMemory {
  userId: string;
  preferences: {
    investmentStyle: string[];
    riskTolerance: string;
    sectors: string[];
    communicationStyle: 'formal' | 'casual' | 'technical';
    language: string;
  };
  conversationHistory: {
    topics: string[];
    commonQuestions: string[];
    lastInteraction: Date;
    sessionCount: number;
  };
  context: {
    currentGoals: string[];
    portfolioFocus: string[];
    recentActions: string[];
  };
}

interface ConversationMemoryContextType {
  memory: ConversationMemory | null;
  updateMemory: (updates: Partial<ConversationMemory>) => void;
  getContextualPrompt: () => string;
  recordInteraction: (topic: string, action: string) => void;
}

const ConversationMemoryContext = createContext<ConversationMemoryContextType | null>(null);

export const useConversationMemory = () => {
  const context = useContext(ConversationMemoryContext);
  if (!context) {
    throw new Error('useConversationMemory must be used within ConversationMemoryProvider');
  }
  return context;
};

export const ConversationMemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [memory, setMemory] = useState<ConversationMemory | null>(null);

  const loadMemory = () => {
    if (!user) return;
    
    const stored = localStorage.getItem(`ai-memory-${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMemory({
          ...parsed,
          conversationHistory: {
            ...parsed.conversationHistory,
            lastInteraction: new Date(parsed.conversationHistory.lastInteraction)
          }
        });
      } catch (error) {
        console.error('Failed to parse conversation memory:', error);
        initializeMemory();
      }
    } else {
      initializeMemory();
    }
  };

  const initializeMemory = () => {
    if (!user) return;
    
    const newMemory: ConversationMemory = {
      userId: user.id,
      preferences: {
        investmentStyle: [],
        riskTolerance: 'moderate',
        sectors: [],
        communicationStyle: 'casual',
        language: 'sv'
      },
      conversationHistory: {
        topics: [],
        commonQuestions: [],
        lastInteraction: new Date(),
        sessionCount: 0
      },
      context: {
        currentGoals: [],
        portfolioFocus: [],
        recentActions: []
      }
    };
    
    setMemory(newMemory);
    saveMemory(newMemory);
  };

  const saveMemory = (memoryToSave: ConversationMemory) => {
    if (!user) return;
    localStorage.setItem(`ai-memory-${user.id}`, JSON.stringify(memoryToSave));
  };

  const updateMemory = (updates: Partial<ConversationMemory>) => {
    if (!memory) return;
    
    const updatedMemory = {
      ...memory,
      ...updates,
      conversationHistory: {
        ...memory.conversationHistory,
        ...updates.conversationHistory,
        lastInteraction: new Date()
      }
    };
    
    setMemory(updatedMemory);
    saveMemory(updatedMemory);
  };

  const recordInteraction = (topic: string, action: string) => {
    if (!memory) return;
    
    const updatedHistory = {
      ...memory.conversationHistory,
      topics: [...new Set([topic, ...memory.conversationHistory.topics])].slice(0, 20),
      sessionCount: memory.conversationHistory.sessionCount + 1,
      lastInteraction: new Date()
    };
    
    const updatedContext = {
      ...memory.context,
      recentActions: [action, ...memory.context.recentActions].slice(0, 10)
    };
    
    updateMemory({
      conversationHistory: updatedHistory,
      context: updatedContext
    });
  };

  const getContextualPrompt = (): string => {
    if (!memory) return '';
    
    const { preferences, conversationHistory, context } = memory;
    
    let prompt = `Användarkontext för AI-assistenten:
    
Kommunikationsstil: ${preferences.communicationStyle}
Språk: ${preferences.language}
Risktolerans: ${preferences.riskTolerance}`;

    if (preferences.investmentStyle.length > 0) {
      prompt += `\nInvesteringsstil: ${preferences.investmentStyle.join(', ')}`;
    }

    if (preferences.sectors.length > 0) {
      prompt += `\nIntressesektorer: ${preferences.sectors.join(', ')}`;
    }

    if (conversationHistory.topics.length > 0) {
      prompt += `\nSenaste samtalsämnen: ${conversationHistory.topics.slice(0, 5).join(', ')}`;
    }

    if (context.currentGoals.length > 0) {
      prompt += `\nAktuella mål: ${context.currentGoals.join(', ')}`;
    }

    if (context.portfolioFocus.length > 0) {
      prompt += `\nPortföljfokus: ${context.portfolioFocus.join(', ')}`;
    }

    prompt += `\nAntal tidigare sessioner: ${conversationHistory.sessionCount}`;
    
    return prompt;
  };

  useEffect(() => {
    loadMemory();
  }, [user]);

  const contextValue: ConversationMemoryContextType = {
    memory,
    updateMemory,
    getContextualPrompt,
    recordInteraction
  };

  return (
    <ConversationMemoryContext.Provider value={contextValue}>
      {children}
    </ConversationMemoryContext.Provider>
  );
};

export default ConversationMemoryProvider;
