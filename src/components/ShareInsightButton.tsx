
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Sparkles } from 'lucide-react';
import PortfolioAnalysisDialog from './PortfolioAnalysisDialog';

interface ShareInsightButtonProps {
  insight: {
    title: string;
    description: string;
    insight_type: string;
    related_holdings?: any[];
  };
  size?: 'sm' | 'lg' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
}

const ShareInsightButton = ({ insight, size = 'sm', variant = 'outline' }: ShareInsightButtonProps) => {
  const insightData = {
    title: `AI-insikt: ${insight.title}`,
    description: insight.description,
    type: insight.insight_type,
    relatedHoldings: insight.related_holdings || []
  };

  return (
    <PortfolioAnalysisDialog insightData={insightData} />
  );
};

export default ShareInsightButton;
