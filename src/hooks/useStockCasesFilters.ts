
import { useState, useMemo } from 'react';
import { StockCase } from '@/hooks/useStockCases';

interface UseStockCasesFiltersProps {
  stockCases: StockCase[];
}

export const useStockCasesFilters = ({ stockCases }: UseStockCasesFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredAndSortedCases = useMemo(() => {
    let filtered = [...stockCases];

    // Search filter - now includes category search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (stockCase) =>
          stockCase.company_name.toLowerCase().includes(search) ||
          stockCase.title.toLowerCase().includes(search) ||
          (stockCase.description && stockCase.description.toLowerCase().includes(search)) ||
          (stockCase.case_categories && stockCase.case_categories.name.toLowerCase().includes(search))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((stockCase) => stockCase.category_id === selectedCategory);
    }

    // Performance filter
    if (performanceFilter !== 'all') {
      filtered = filtered.filter((stockCase) => {
        const perf = stockCase.performance_percentage;
        switch (performanceFilter) {
          case 'positive':
            return perf !== null && perf > 0;
          case 'negative':
            return perf !== null && perf < 0;
          case 'neutral':
            return perf === null;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'performance_percentage':
          aValue = a.performance_percentage ?? -Infinity;
          bValue = b.performance_percentage ?? -Infinity;
          break;
        case 'company_name':
          aValue = a.company_name.toLowerCase();
          bValue = b.company_name.toLowerCase();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockCases, searchTerm, selectedCategory, performanceFilter, sortBy, sortOrder]);

  const categories = useMemo(() => {
    const categoryMap = new Map();
    stockCases.forEach((stockCase) => {
      if (stockCase.case_categories && stockCase.category_id) {
        categoryMap.set(stockCase.category_id, {
          id: stockCase.category_id,
          name: stockCase.case_categories.name,
          color: stockCase.case_categories.color,
        });
      }
    });
    return Array.from(categoryMap.values());
  }, [stockCases]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    performanceFilter,
    setPerformanceFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    filteredAndSortedCases,
    categories,
  };
};
