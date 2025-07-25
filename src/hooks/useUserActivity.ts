import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface UserActivityData {
  visitedPages: string[];
  timeSpentOnPages: Record<string, number>;
  lastVisitTimes: Record<string, number>;
  sessionStartTime: number;
  totalSessions: number;
  hasPortfolio: boolean;
  hasCompletedRiskProfile: boolean;
  hasUsedAIChat: boolean;
  portfolioPerformance?: {
    isNegative: boolean;
    significantLoss: boolean;
  };
  recentActions: Array<{
    action: string;
    page: string;
    timestamp: number;
  }>;
}

export const useUserActivity = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activity, setActivity] = useState<UserActivityData>({
    visitedPages: [],
    timeSpentOnPages: {},
    lastVisitTimes: {},
    sessionStartTime: Date.now(),
    totalSessions: 0,
    hasPortfolio: false,
    hasCompletedRiskProfile: false,
    hasUsedAIChat: false,
    recentActions: []
  });

  const [pageStartTime, setPageStartTime] = useState(Date.now());

  // Track page visits and time spent
  useEffect(() => {
    if (!user) return;

    const currentPage = location.pathname;
    const now = Date.now();
    
    // Record time spent on previous page
    if (pageStartTime) {
      const timeSpent = now - pageStartTime;
      setActivity(prev => ({
        ...prev,
        timeSpentOnPages: {
          ...prev.timeSpentOnPages,
          [currentPage]: (prev.timeSpentOnPages[currentPage] || 0) + timeSpent
        }
      }));
    }

    // Track new page visit
    setActivity(prev => {
      const newVisitedPages = prev.visitedPages.includes(currentPage) 
        ? prev.visitedPages 
        : [...prev.visitedPages, currentPage];

      return {
        ...prev,
        visitedPages: newVisitedPages,
        lastVisitTimes: {
          ...prev.lastVisitTimes,
          [currentPage]: now
        }
      };
    });

    setPageStartTime(now);

    // Save to localStorage for persistence
    const storageKey = `user-activity-${user.id}`;
    const updatedActivity = {
      ...activity,
      visitedPages: activity.visitedPages.includes(currentPage) 
        ? activity.visitedPages 
        : [...activity.visitedPages, currentPage],
      lastVisitTimes: {
        ...activity.lastVisitTimes,
        [currentPage]: now
      }
    };
    localStorage.setItem(storageKey, JSON.stringify(updatedActivity));

  }, [location.pathname, user]);

  // Load activity from localStorage on mount
  useEffect(() => {
    if (!user) return;

    const storageKey = `user-activity-${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsedActivity = JSON.parse(saved);
        setActivity(prev => ({
          ...prev,
          ...parsedActivity,
          sessionStartTime: Date.now() // Reset session start time
        }));
      } catch (error) {
        console.error('Failed to parse user activity:', error);
      }
    }
  }, [user]);

  const trackAction = (action: string) => {
    if (!user) return;

    const newAction = {
      action,
      page: location.pathname,
      timestamp: Date.now()
    };

    setActivity(prev => ({
      ...prev,
      recentActions: [newAction, ...prev.recentActions.slice(0, 9)] // Keep last 10 actions
    }));
  };

  const updateUserFlags = (flags: Partial<Pick<UserActivityData, 'hasPortfolio' | 'hasCompletedRiskProfile' | 'hasUsedAIChat' | 'portfolioPerformance'>>) => {
    setActivity(prev => ({
      ...prev,
      ...flags
    }));
  };

  const getTimeSpentOnPage = (page: string): number => {
    return activity.timeSpentOnPages[page] || 0;
  };

  const getLastVisitTime = (page: string): number => {
    return activity.lastVisitTimes[page] || 0;
  };

  const isNewUser = (): boolean => {
    return activity.visitedPages.length <= 2 && activity.totalSessions <= 1;
  };

  const isReturningUser = (): boolean => {
    const now = Date.now();
    const sessionTime = now - activity.sessionStartTime;
    return sessionTime > 5 * 60 * 1000; // More than 5 minutes in session
  };

  const hasVisitedPage = (page: string): boolean => {
    return activity.visitedPages.includes(page);
  };

  const getRecentActions = () => {
    return activity.recentActions;
  };

  return {
    activity,
    trackAction,
    updateUserFlags,
    getTimeSpentOnPage,
    getLastVisitTime,
    isNewUser,
    isReturningUser,
    hasVisitedPage,
    getRecentActions
  };
};