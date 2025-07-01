
import { UserHolding } from '@/hooks/useUserHoldings';

export const calculatePortfolioMetrics = (holdings: UserHolding[]) => {
  const totalInvested = holdings.reduce((sum, holding) => {
    if (holding.quantity && holding.purchase_price) {
      return sum + (holding.quantity * holding.purchase_price);
    }
    return sum;
  }, 0);

  const currentValue = holdings.reduce((sum, holding) => {
    if (holding.current_value) {
      return sum + holding.current_value;
    } else if (holding.quantity && holding.purchase_price) {
      // Fallback to purchase value if no current value
      return sum + (holding.quantity * holding.purchase_price);
    }
    return sum;
  }, 0);

  const totalReturn = currentValue - totalInvested;
  const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    totalReturn,
    totalReturnPercentage
  };
};
