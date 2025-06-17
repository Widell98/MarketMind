
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface StockCasesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  performanceFilter: string;
  onPerformanceFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  categories: Array<{ id: string; name: string; color: string }>;
}

const StockCasesFilters: React.FC<StockCasesFiltersProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="space-y-3 mb-3 sm:mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search companies, titles, or categories..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm rounded-md sm:pl-10 sm:py-2"
        />
      </div>
    </div>
  );
};

export default StockCasesFilters;
