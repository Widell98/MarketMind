import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from './usePortfolio';
import { usePortfolioPerformance } from './usePortfolioPerformance';
import { useCashHoldings } from './useCashHoldings';
import { useUserHoldings } from './useUserHoldings';

interface ProgressData {
  percentage: number;
  title: string;
  description: string;
  nextStep: string;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

export const useFinancialProgress = (): ProgressData => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();
  const { performance } = usePortfolioPerformance();
  const { totalCash } = useCashHoldings();
  const { actualHoldings } = useUserHoldings();

  return useMemo(() => {
    if (!user || !activePortfolio) {
      return {
        percentage: 0,
        title: 'Din investeringsresa',
        description: 'Skapa din första portfölj för att komma igång!',
        nextStep: 'Starta din portfölj',
        color: 'blue'
      };
    }

    if (!performance) {
      return {
        percentage: 0,
        title: 'Din investeringsresa',
        description: 'Laddar portföljdata...',
        nextStep: 'Hämtar portföljvärden',
        color: 'blue'
      };
    }

    const totalValue = performance.totalPortfolioValue;
    const investedValue = performance.totalValue + totalCash;
    const hasHoldings = actualHoldings && actualHoldings.length > 0;
    const hasInvested = investedValue > totalCash;
    const hasCash = totalCash > 0;
    const isWellDiversified = actualHoldings && actualHoldings.length >= 5;
    const hasGoodBalance = totalCash / totalValue < 0.3; // Less than 30% cash
    const isPositive = performance.totalReturnPercentage > 0;

    // Calculate progress based on investment milestones
    let progress = 0;
    let title = '';
    let description = '';
    let nextStep = '';
    let color: 'green' | 'blue' | 'orange' | 'purple' = 'blue';

    // Beginner stage (0-25%)
    if (!hasInvested && !hasCash) {
      progress = 5;
      title = 'Välkommen till din investeringsresa';
      description = 'Du har skapat ditt konto. Nästa steg är att göra din första investering!';
      nextStep = 'Lägg till kapital och gör din första investering';
      color = 'blue';
    }
    // Has cash but no investments (10-20%)
    else if (hasCash && !hasInvested) {
      progress = 15;
      title = 'Redo att investera';
      description = `Du har ${totalCash.toLocaleString('sv-SE')} kr redo för investering. Dags att sätta pengarna i arbete!`;
      nextStep = 'Gör din första aktieinvestering';
      color = 'orange';
    }
    // First investments (25-40%)
    else if (hasInvested && (!actualHoldings || actualHoldings.length <= 2)) {
      progress = 30;
      title = 'Första steget taget!';
      description = 'Grattis till dina första investeringar! Nu är det dags att bygga en mer diversifierad portfölj.';
      nextStep = 'Lägg till fler innehav för bättre riskspridning';
      color = 'blue';
    }
    // Building portfolio (40-60%)
    else if (hasInvested && actualHoldings && actualHoldings.length >= 3 && actualHoldings.length < 6) {
      progress = 50;
      title = 'Bygger din portfölj';
      description = `Du har ${actualHoldings.length} innehav och din portfölj växer. Fortsätt diversifiera för ännu bättre riskspridning.`;
      nextStep = 'Överväg att lägga till internationella fonder';
      color = 'purple';
    }
    // Well diversified (60-75%)
    else if (isWellDiversified && hasGoodBalance) {
      progress = 68;
      title = 'Välbalanserad portfölj';
      description = 'Din portfölj har god spridning och balans. Du är på rätt väg mot dina finansiella mål!';
      nextStep = 'Fortsätt med regelbundna månadssparande';
      color = 'green';
    }
    // Advanced investor (75-90%)
    else if (isWellDiversified && isPositive && totalValue > 100000) {
      progress = 80;
      title = 'Stark investerare';
      description = `Imponerande! Du har ${totalValue.toLocaleString('sv-SE')} kr och positiv avkastning. Du behärskar investeringskonsten.`;
      nextStep = 'Överväg att optimera din skatteeffektivitet';
      color = 'green';
    }
    // Wealth building (90-100%)
    else if (totalValue > 500000) {
      progress = 92;
      title = 'Bygger verklig förmögenhet';
      description = 'Du har nått en betydande förmögenhetsnivå. Fokusera på långsiktig wealth management.';
      nextStep = 'Utforska avancerade investeringsstrategier';
      color = 'green';
    }
    // Default case
    else {
      const baseProgress = Math.min(85, 40 + (totalValue / 10000) * 2); // 2% per 10k SEK
      progress = Math.round(baseProgress);
      
      if (isPositive) {
        title = 'På rätt spår';
        description = `Din portfölj utvecklas positivt med +${performance.totalReturnPercentage.toFixed(1)}% avkastning. Fortsätt så här!`;
        color = 'green';
      } else {
        title = 'Bygger för framtiden';
        description = 'Marknader fluktuerar, men du bygger för långsiktig tillväxt. Håll kvar din strategi.';
        color = 'blue';
      }
      nextStep = 'Fortsätt med ditt månadssparande';
    }

    return {
      percentage: Math.max(5, Math.min(95, progress)),
      title,
      description,
      nextStep,
      color
    };
  }, [user, activePortfolio, performance, totalCash, actualHoldings]);
};