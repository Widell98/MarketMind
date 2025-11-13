
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Wallet, BarChart3, Sparkles } from 'lucide-react';

interface PortfolioValueCardsProps {
  totalPortfolioValue: number;
  totalInvestedValue: number;
  totalCashValue: number;
  cashRatio?: number;
  diversificationScore?: number;
  loading?: boolean;
}

const PortfolioValueCards: React.FC<PortfolioValueCardsProps> = ({
  totalPortfolioValue,
  totalInvestedValue,
  totalCashValue,
  cashRatio,
  diversificationScore,
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

  const liquidityCaption = typeof cashRatio === 'number'
    ? `Likviditet ${cashRatio.toFixed(1)}% av portföljen`
    : 'Tillgänglig likviditet';
  const diversificationValue = typeof diversificationScore === 'number' ? diversificationScore : 0;
  const cards = [
    {
      title: "Total Portfölj",
      value: totalPortfolioValue,
      icon: BarChart3,
      textColor: "text-primary",
      iconColor: "text-primary",
      accent: "from-primary/20 via-primary/5",
      caption: "Hela portföljvärdet inklusive kassa",
      format: 'currency' as const
    },
    {
      title: "Investerat Värde",
      value: totalInvestedValue,
      icon: TrendingUp,
      textColor: "text-blue-700 dark:text-blue-300",
      iconColor: "text-blue-600 dark:text-blue-300",
      accent: "from-sky-400/30 via-sky-400/10",
      caption: "Kapital i arbete just nu",
      format: 'currency' as const
    },
    {
      title: "Kassa",
      value: totalCashValue,
      icon: Wallet,
      textColor: "text-emerald-700 dark:text-emerald-300",
      iconColor: "text-emerald-600 dark:text-emerald-300",
      accent: "from-emerald-400/30 via-emerald-400/10",
      caption: liquidityCaption,
      format: 'currency' as const
    },
    {
      title: "Diversifiering",
      value: diversificationValue,
      icon: Sparkles,
      textColor: "text-purple-600 dark:text-purple-300",
      iconColor: "text-purple-500 dark:text-purple-300",
      accent: "from-purple-400/30 via-purple-400/10",
      caption: "Breddning över sektorer",
      format: 'percentage' as const
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards.length }).map((_, index) => (
          <Card key={index} className="min-h-[168px] motion-reduce:transition-none">
            <CardContent className="flex h-full flex-col justify-between gap-6 p-6 sm:p-7">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-24 rounded-full bg-muted"></div>
                  <div className="h-8 w-32 rounded-full bg-muted"></div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="min-h-[168px] border-border/50 bg-white/60 shadow-glass dark:bg-slate-950/40 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-glass-strong"
        >
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px overflow-hidden">
            <div className="h-full w-full origin-left scale-x-150 bg-border/50">
              <div className="h-full w-full bg-divider-shimmer motion-safe:animate-shimmer motion-reduce:animate-none"></div>
            </div>
          </div>
          <CardContent className="flex h-full flex-col justify-between gap-6 p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                  {card.title}
                </p>
                <p className={`text-3xl font-semibold tracking-tight ${card.textColor}`}>
                  {card.format === 'percentage' ? `${Math.round(card.value)}%` : formatCurrency(card.value)}
                </p>
              </div>
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} to-transparent shadow-inner shadow-white/10 dark:shadow-black/30`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-primary/60 via-primary/30 to-transparent"></span>
                {card.caption}
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
                Aktiv
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PortfolioValueCards;
