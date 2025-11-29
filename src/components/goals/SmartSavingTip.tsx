import React from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb, ArrowRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SmartSavingTipProps {
  type: 'fee' | 'allocation' | 'increase';
  potentialSaving: number;
  message: string;
  actionLabel: string;
  actionUrl?: string;
}

export const SmartSavingTip = ({ type, potentialSaving, message, actionLabel, actionUrl }: SmartSavingTipProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30 p-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-full shrink-0">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">Smart Sparande</h4>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
              Spara {potentialSaving} kr/mån
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed">
            {message}
          </p>
          <Button 
            variant="link" 
            className="text-amber-700 dark:text-amber-300 p-0 h-auto text-xs font-medium hover:text-amber-900 dark:hover:text-amber-100 mt-2 flex items-center gap-1"
            onClick={() => actionUrl && navigate(actionUrl)}
          >
            {actionLabel} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};


