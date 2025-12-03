import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart3, Plus, Newspaper, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePersistentDialogOpenState } from '@/hooks/usePersistentDialogOpenState';
import { ADD_HOLDING_DIALOG_STORAGE_KEY } from '@/constants/storageKeys';

const QuickActionsSection: React.FC = () => {
  const navigate = useNavigate();
  const {
    open: openAddHoldingDialog,
  } = usePersistentDialogOpenState(ADD_HOLDING_DIALOG_STORAGE_KEY, 'user-holdings');

  const handleAddHolding = () => {
    openAddHoldingDialog();
  };

  const quickActions = [
    {
      id: 'analyze',
      label: 'Analysera portfölj',
      description: 'Djup analys och AI-optimering',
      icon: BarChart3,
      onClick: () => navigate('/portfolio-implementation'),
      className: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    },
    {
      id: 'add_holding',
      label: 'Lägg till innehav',
      description: 'Lägg till nytt innehav',
      icon: Plus,
      onClick: handleAddHolding,
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      id: 'news',
      label: 'Se nyheter',
      description: 'Senaste marknadsnyheter',
      icon: Newspaper,
      onClick: () => navigate('/news'),
      className: 'bg-green-600 hover:bg-green-700 text-white',
    },
    {
      id: 'ai_chat',
      label: 'AI-chatt',
      description: 'Få AI-rådgivning',
      icon: Sparkles,
      onClick: () => navigate('/ai-chatt'),
      className: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  ];

  return (
    <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground sm:text-lg">Snabbåtgärder</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Vanliga åtgärder för att hantera din portfölj
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              className={`${action.className} h-auto flex-col items-center justify-center gap-2 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200`}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-center">
                <div className="text-xs sm:text-sm font-semibold">{action.label}</div>
                <div className="text-[10px] xs:text-xs opacity-90 mt-0.5 hidden sm:block">
                  {action.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActionsSection;


