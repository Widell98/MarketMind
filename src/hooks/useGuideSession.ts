import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GuideSession {
  id: string;
  isActive: boolean;
  hasSeenWelcome: boolean;
  completedGuides: string[];
  lastInteraction: Date;
}

export const useGuideSession = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guideSession, setGuideSession] = useState<GuideSession | null>(null);

  // Initialize guide session for authenticated users
  useEffect(() => {
    if (user && !guideSession) {
      const storedSession = localStorage.getItem(`guide-session-${user.id}`);
      
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          setGuideSession({
            ...parsed,
            lastInteraction: new Date(parsed.lastInteraction)
          });
        } catch {
          // Create new session if stored one is invalid
          createNewGuideSession();
        }
      } else {
        createNewGuideSession();
      }
    }
  }, [user]);

  const createNewGuideSession = useCallback(() => {
    if (!user) return;

    const newSession: GuideSession = {
      id: `guide-${user.id}-${Date.now()}`,
      isActive: true,
      hasSeenWelcome: false,
      completedGuides: [],
      lastInteraction: new Date()
    };

    setGuideSession(newSession);
    localStorage.setItem(`guide-session-${user.id}`, JSON.stringify(newSession));
  }, [user]);

  const updateGuideSession = useCallback((updates: Partial<GuideSession>) => {
    if (!user || !guideSession) return;

    const updatedSession = {
      ...guideSession,
      ...updates,
      lastInteraction: new Date()
    };

    setGuideSession(updatedSession);
    localStorage.setItem(`guide-session-${user.id}`, JSON.stringify(updatedSession));
  }, [user, guideSession]);

  const markGuideCompleted = useCallback((guideId: string) => {
    if (!guideSession) return;

    const completedGuides = [...guideSession.completedGuides];
    if (!completedGuides.includes(guideId)) {
      completedGuides.push(guideId);
    }

    updateGuideSession({ completedGuides });
  }, [guideSession, updateGuideSession]);

  const resetGuideSession = useCallback(() => {
    if (!user) return;

    localStorage.removeItem(`guide-session-${user.id}`);
    createNewGuideSession();
  }, [user, createNewGuideSession]);

  const handlePromptExample = useCallback((prompt: string) => {
    // Dispatch event to send prompt to AI chat
    const event = new CustomEvent('sendExamplePrompt', {
      detail: { message: prompt }
    });
    window.dispatchEvent(event);

    // Mark interaction
    updateGuideSession({ hasSeenWelcome: true });
  }, [updateGuideSession]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    
    // Mark interaction
    updateGuideSession({ hasSeenWelcome: true });
  }, [navigate, updateGuideSession]);

  const handleShowDemo = useCallback((demoType: string) => {
    // Track demo interactions
    markGuideCompleted(`demo-${demoType}`);

    // Mark interaction
    updateGuideSession({ hasSeenWelcome: true });
  }, [markGuideCompleted, updateGuideSession]);

  // Show guide for new users or when explicitly requested
  const shouldShowGuide = useCallback(() => {
    if (!user || !guideSession) return false;
    
    // Always show for new users
    if (!guideSession.hasSeenWelcome) return true;
    
    // Show if user manually opens help
    return guideSession.isActive;
  }, [user, guideSession]);

  return {
    guideSession,
    shouldShowGuide: shouldShowGuide(),
    handlePromptExample,
    handleNavigate,
    handleShowDemo,
    markGuideCompleted,
    resetGuideSession,
    updateGuideSession
  };
};