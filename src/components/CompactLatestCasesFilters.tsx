
import React from 'react';
import { Button } from '@/components/ui/button';

interface CompactLatestCasesFiltersProps {
  viewMode: 'all' | 'trending' | 'followed';
  onViewModeChange: (mode: 'all' | 'trending' | 'followed') => void;
  user: any;
}

const CompactLatestCasesFilters = ({ viewMode, onViewModeChange, user }: CompactLatestCasesFiltersProps) => {
  if (!user) return null;

  return (
    <div className="flex items-center gap-1 mt-3">
      <Button
        variant={viewMode === 'all' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('all')}
        size="sm"
        className="text-xs px-3 py-1 h-8"
      >
        Alla
      </Button>
      <Button
        variant={viewMode === 'trending' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('trending')}
        size="sm"
        className="text-xs px-3 py-1 h-8"
      >
        Trending
      </Button>
      <Button
        variant={viewMode === 'followed' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('followed')}
        size="sm"
        className="text-xs px-3 py-1 h-8"
      >
        Följda
      </Button>
    </div>
  );
};

export default CompactLatestCasesFilters;
