
import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        title: !user 
          ? 'Logga in för att följa andra användare'
          : 'Inga aktiefall från följda användare',
        description: !user 
          ? 'Logga in för att följa andra användare och se deras aktiefall'
          : 'Du följer inga användare ännu, eller så har de du följer inte publicerat några aktiefall',
        showSpecialButton: true,
        icon: Users
      };
    }
    
    return {
      title: 'Bli först att skapa ett case!',
      description: !user 
        ? 'Skapa ett konto för att börja dela dina investeringsinsikter och följa andra.'
        : 'Dela dina investeringsanalyser och få feedback från communityn.',
      icon: TrendingUp
    };
  };

  const { title, description, showSpecialButton, icon: IconComponent = TrendingUp } = getEmptyStateContent();

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <IconComponent className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      
      {viewMode === 'followed' && showSpecialButton ? (
        !user ? (
          <Button asChild>
            <Link to="/auth">
              Logga in
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/stock-cases">
              Upptäck användare att följa
            </Link>
          </Button>
        )
      ) : (
        <Button onClick={onCreateCase} className="gap-2">
          <Plus className="w-4 h-4" />
          {!user ? 'Kom igång' : 'Skapa ditt första case'}
        </Button>
      )}
    </div>
  );
};

export default CompactLatestCasesEmpty;
