
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Wallet, DollarSign, BarChart3 } from 'lucide-react';

interface PortfolioValueCardsProps {
  totalPortfolioValue: number;
  totalInvestedValue: number;
  totalCashValue: number;
  loading?: boolean;
}

const PortfolioValueCards: React.FC<PortfolioValueCardsProps> = ({
  totalPortfolioValue,
  totalInvestedValue,
  totalCashValue,
  loading = false
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Portfölj",
      value: totalPortfolioValue,
      icon: BarChart3,
      bgColor: "bg-primary/10",
      textColor: "text-primary",
      iconColor: "text-primary"
    },
    {
      title: "Investerat Värde",
      value: totalInvestedValue,
      icon: TrendingUp,
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      textColor: "text-blue-700 dark:text-blue-400",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Kassa",
      value: totalCashValue,
      icon: Wallet,
      bgColor: "bg-green-50 dark:bg-green-950/20",
      textColor: "text-green-700 dark:text-green-400",
      iconColor: "text-green-600 dark:text-green-400"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse rounded-lg sm:rounded-xl">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="h-3 sm:h-4 bg-muted rounded w-16 sm:w-20"></div>
                  <div className="h-6 sm:h-7 md:h-8 bg-muted rounded w-24 sm:w-32"></div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex-shrink-0 ml-2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow duration-200 rounded-lg sm:rounded-xl">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  {card.title}
                </p>
                <p className={`text-lg sm:text-xl md:text-2xl font-bold ${card.textColor} break-words`}>
                  {formatCurrency(card.value)}
                </p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0 ml-2`}>
                <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PortfolioValueCards;
