
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useConversationMemory } from './AIConversationMemory';

interface RouteRule {
  condition: () => boolean;
  destination: string;
  reason: string;
  priority: number;
}

const IntelligentRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { riskProfile } = useRiskProfile();
  const { memory, recordInteraction } = useConversationMemory();

  const routeRules: RouteRule[] = [
    {
      condition: () => !user && location.pathname.includes('/portfolio'),
      destination: '/auth',
      reason: 'Authentication required for portfolio features',
      priority: 10
    },
    {
      condition: () => user && !riskProfile && location.pathname === '/portfolio-implementation',
      destination: '/portfolio-advisor',
      reason: 'Risk profile needed before portfolio implementation',
      priority: 9
    },
    {
      condition: () => {
        const isNewUser = memory?.conversationHistory.sessionCount === 0;
        const isOnHomePage = location.pathname === '/';
        return user && isNewUser && isOnHomePage;
      },
      destination: '/ai-chat?welcome=true',
      reason: 'New user onboarding through AI chat',
      priority: 5
    }
  ];

  const evaluateRouting = () => {
    // Sort rules by priority (highest first)
    const applicableRules = routeRules
      .filter(rule => rule.condition())
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length > 0) {
      const rule = applicableRules[0];
      console.log(`Intelligent routing: ${rule.reason}`);
      
      // Record the routing decision
      recordInteraction('intelligent-routing', rule.reason);
      
      // Small delay to prevent immediate navigation conflicts
      setTimeout(() => {
        navigate(rule.destination);
      }, 100);
    }
  };

  useEffect(() => {
    // Only evaluate routing after initial load and when dependencies change
    const timer = setTimeout(evaluateRouting, 500);
    return () => clearTimeout(timer);
  }, [user, riskProfile, location.pathname, memory?.conversationHistory.sessionCount]);

  // This component doesn't render anything visible
  return null;
};

export default IntelligentRouting;
