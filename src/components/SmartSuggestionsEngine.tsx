import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserActivity } from '@/hooks/useUserActivity';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { 
  Brain, 
  TrendingUp, 
  PieChart, 
  Lightbulb, 
  AlertTriangle,
  Target,
  BookOpen,
  BarChart3,
  Calendar,
  Shield,
  Zap,
  Star,
  DollarSign
} from 'lucide-react';

export interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: any;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'portfolio' | 'learning' | 'market' | 'risk' | 'opportunity' | 'performance';
  timestamp: number;
  relevanceScore: number;
  aiInsight?: string;
  actionData?: any;
}

export const useSmartSuggestionsEngine = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { activity, isNewUser, isReturningUser, hasVisitedPage, getTimeSpentOnPage } = useUserActivity();
  const { performance } = usePortfolioPerformance();
  const { actualHoldings } = useUserHoldings();
  const { riskProfile } = useRiskProfile();
  const { latestCases: stockCases } = useLatestStockCases();

  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generatePersonalizedSuggestions = (): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];
    const currentPath = location.pathname;
    const now = Date.now();

    // 1. New User Onboarding
    if (isNewUser() && !riskProfile) {
      suggestions.push({
        id: 'onboarding-risk-profile',
        title: 'Skapa din investeringsprofil',
        description: 'Låt AI:n analysera din risktolerans och skapa en skräddarsydd strategi för dig',
        action: 'Starta riskprofil',
        icon: Shield,
        priority: 'high',
        category: 'portfolio',
        timestamp: now,
        relevanceScore: 95,
        aiInsight: 'Som ny användare är det viktigt att först förstå din risktolerans'
      });
    }

    // 2. Portfolio Creation for Users Without Holdings
    if (riskProfile && (!actualHoldings || actualHoldings.length === 0)) {
      suggestions.push({
        id: 'create-first-portfolio',
        title: 'Skapa din första portfölj',
        description: 'Baserat på din riskprofil kan AI:n föreslå de bästa investeringarna för dig',
        action: 'Generera portfölj',
        icon: PieChart,
        priority: 'high',
        category: 'portfolio',
        timestamp: now,
        relevanceScore: 90,
        aiInsight: 'Med din riskprofil klar kan vi nu skapa en optimal portfölj'
      });
    }

    // 3. Critical Portfolio Performance Issues
    if (performance && actualHoldings && actualHoldings.length > 0) {
      const totalReturn = performance.totalReturn || 0;
      const dayChange = performance.dayChangePercentage || 0;
      
      if (totalReturn < -15 || dayChange < -10) {
        suggestions.push({
          id: 'urgent-portfolio-review',
          title: 'Kritisk portföljgranskning behövs',
          description: `Din portfölj har tappat ${Math.abs(totalReturn).toFixed(1)}%. AI:n kan hjälpa dig stabilisera situationen`,
          action: 'Akut portföljanalys',
          icon: AlertTriangle,
          priority: 'urgent',
          category: 'performance',
          timestamp: now,
          relevanceScore: 100,
          aiInsight: 'Betydande förluster kräver omedelbar uppmärksamhet och potentiell ombalansering'
        });
      } else if (totalReturn < -5 || dayChange < -5) {
        suggestions.push({
          id: 'portfolio-optimization',
          title: 'Optimera din portfölj',
          description: 'AI:n har identifierat förbättringsmöjligheter i dina innehav',
          action: 'Visa optimeringar',
          icon: TrendingUp,
          priority: 'medium',
          category: 'portfolio',
          timestamp: now,
          relevanceScore: 75
        });
      }
    }

    // 4. Learning Opportunities Based on Behavior
    if (currentPath === '/stock-cases' && getTimeSpentOnPage('/stock-cases') > 60000) { // 1 minute
      suggestions.push({
        id: 'deep-analysis-learning',
        title: 'Fördjupa din analys',
        description: 'Du verkar intresserad av aktieanalys. Lär dig avancerade analystekniker med AI:n',
        action: 'Lär dig avancerad analys',
        icon: BookOpen,
        priority: 'medium',
        category: 'learning',
        timestamp: now,
        relevanceScore: 70
      });
    }

    // 5. Market Opportunities Based on Recent Cases
    if (stockCases && stockCases.length > 0 && hasVisitedPage('/stock-cases')) {
      const recentHighPerformers = stockCases.filter(stockCase => 
        stockCase.title.toLowerCase().includes('bull') || 
        stockCase.title.toLowerCase().includes('uppgång') ||
        stockCase.title.toLowerCase().includes('köp')
      );

      if (recentHighPerformers.length > 0) {
        suggestions.push({
          id: 'market-opportunities',
          title: 'Heta marknadsaktioner upptäckta',
          description: `${recentHighPerformers.length} lovande investeringsmöjligheter baserat på nyligen publicerade analyser`,
          action: 'Utforska möjligheter',
          icon: Star,
          priority: 'medium',
          category: 'opportunity',
          timestamp: now,
          relevanceScore: 65
        });
      }
    }

    // 6. Portfolio Diversification Analysis
    if (actualHoldings && actualHoldings.length > 0 && actualHoldings.length < 5) {
      suggestions.push({
        id: 'diversification-advice',
        title: 'Förbättra diversifiering',
        description: `Med ${actualHoldings.length} innehav kan din portfölj behöva bättre spridning för att minska risk`,
        action: 'Analysera diversifiering',
        icon: BarChart3,
        priority: 'medium',
        category: 'risk',
        timestamp: now,
        relevanceScore: 60
      });
    }

    // 7. Returning User Engagement
    const hasVisitedAIChat = hasVisitedPage('/ai-chatt') || hasVisitedPage('/ai-chat');

    if (isReturningUser() && currentPath === '/' && !hasVisitedAIChat) {
      suggestions.push({
        id: 'try-ai-assistant',
        title: 'Prova AI-assistenten',
        description: 'Få personliga råd och svar på dina investeringsfrågor med vår AI-assistent',
        action: 'Chatta med AI',
        icon: Brain,
        priority: 'low',
        category: 'learning',
        timestamp: now,
        relevanceScore: 50
      });
    }

    // 8. Weekly Portfolio Review Reminder
    const lastPortfolioVisit = activity.lastVisitTimes['/portfolio-implementation'] || 0;
    const daysSinceLastVisit = (now - lastPortfolioVisit) / (1000 * 60 * 60 * 24);
    
    if (actualHoldings && actualHoldings.length > 0 && daysSinceLastVisit > 7) {
      suggestions.push({
        id: 'weekly-portfolio-check',
        title: 'Veckans portföljkoll',
        description: 'Det har gått en vecka sedan du kollade din portfölj. Se hur dina investeringar presterat',
        action: 'Granska portfölj',
        icon: Calendar,
        priority: 'low',
        category: 'portfolio',
        timestamp: now,
        relevanceScore: 45
      });
    }

    // 9. Advanced Features Discovery
    if (actualHoldings && actualHoldings.length > 3 && !hasVisitedPage('/advanced-features')) {
      suggestions.push({
        id: 'discover-advanced-features',
        title: 'Upptäck avancerade funktioner',
        description: 'Med din portföljstorlek kan du dra nytta av våra avancerade analysverktyg',
        action: 'Utforska avancerat',
        icon: Zap,
        priority: 'low',
        category: 'learning',
        timestamp: now,
        relevanceScore: 40
      });
    }

    // Sort by relevance score and priority
    return suggestions
      .sort((a, b) => {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, 3); // Show max 3 suggestions
  };

  const shouldShowSuggestions = (): boolean => {
    if (!user) return false;

    // Don't show if user explicitly dismissed
    const dismissed = localStorage.getItem('smart-suggestions-dismissed');
    if (dismissed === 'true') return false;

    // Timing controls
    const lastShown = localStorage.getItem('smart-suggestions-last-shown');
    const now = Date.now();
    if (lastShown) {
      const timeSinceLastShown = now - parseInt(lastShown);
      const minInterval = 30 * 60 * 1000; // 30 minutes minimum
      if (timeSinceLastShown < minInterval) return false;
    }

    // Show conditions
    const currentPath = location.pathname;
    
    // Always show for new users on home page
    if (isNewUser() && currentPath === '/') return true;
    
    // Show for critical portfolio issues
    if (performance && (performance.totalReturn || 0) < -10) return true;
    
    // Show for users without portfolio who have risk profile
    if (riskProfile && (!actualHoldings || actualHoldings.length === 0)) return true;
    
    // Show for returning users with engagement opportunities
    if (isReturningUser() && activity.visitedPages.length > 3) return true;

    return false;
  };

  const analyzeSuggestions = () => {
    if (!shouldShowSuggestions()) {
      setSuggestions([]);
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      const newSuggestions = generatePersonalizedSuggestions();
      setSuggestions(newSuggestions);
      setIsAnalyzing(false);
      
      if (newSuggestions.length > 0) {
        localStorage.setItem('smart-suggestions-last-shown', Date.now().toString());
      }
    }, 800);
  };

  useEffect(() => {
    analyzeSuggestions();
  }, [location.pathname, performance, actualHoldings, riskProfile, activity]);

  const dismissSuggestions = (permanent = false) => {
    setSuggestions([]);
    if (permanent) {
      localStorage.setItem('smart-suggestions-dismissed', 'true');
    } else {
      localStorage.setItem('smart-suggestions-last-shown', Date.now().toString());
    }
  };

  const resetSuggestions = () => {
    localStorage.removeItem('smart-suggestions-dismissed');
    localStorage.removeItem('smart-suggestions-last-shown');
    analyzeSuggestions();
  };

  return {
    suggestions,
    isAnalyzing,
    shouldShow: shouldShowSuggestions(),
    dismissSuggestions,
    resetSuggestions,
    analyzeSuggestions
  };
};