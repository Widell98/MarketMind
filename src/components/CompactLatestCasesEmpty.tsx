
import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus } from 'lucide-react';

interface CompactLatestCasesEmptyProps {
  viewMode: 'all' | 'trending' | 'followed';
  user: any;
  onCreateCase: () => void;
}

const CompactLatestCasesEmpty = ({ viewMode, user, onCreateCase }: CompactLatestCasesEmptyProps) => {
  const getEmptyStateContent = () => {
    if (viewMode === 'trending') {
      return {
        title: 'Inga trending cases ännu',
        description: !user 
          ? 'Skapa ett konto för att börja dela dina investeringsinsikter och följa andra.'
          : 'Dela dina investeringsanalyser och få feedback från communityn.'
      };
    }
    
    if (viewMode === 'followed') {
      return {
        title: 'Du följer inga cases ännu',
        description: 'Dela dina investeringsanalyser och få feedback från communityn.'
      };
    }
    
    return {
      title: 'Bli först att skapa ett case!',
      description: !user 
        ? 'Skapa ett konto för att börja dela dina investeringsinsikter och följa andra.'
        : 'Dela dina investeringsanalyser och få feedback från communityn.'
    };
  };

  const { title, description } = getEmptyStateContent();

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <TrendingUp className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      <Button onClick={onCreateCase} className="gap-2">
        <Plus className="w-4 h-4" />
        {!user ? 'Kom igång' : 'Skapa ditt första case'}
      </Button>
    </div>
  );
};

export default CompactLatestCasesEmpty;
