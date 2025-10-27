
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';

interface AnalysisStockCaseSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const AnalysisStockCaseSelect = ({ value, onValueChange, disabled }: AnalysisStockCaseSelectProps) => {
  const { user } = useAuth();

  const { data: stockCases, isLoading } = useQuery({
    queryKey: ['user-stock-cases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('stock_cases')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((stockCase) => ({
        ...stockCase,
        title: normalizeStockCaseTitle(stockCase.title, stockCase.company_name),
      }));
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div>
        <Label htmlFor="stockCase">Koppla till aktiecase (valfritt)</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Logga in för att se dina aktiecases" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="stockCase">Koppla till aktiecase (valfritt)</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Laddar dina aktiecases..." : "Välj ett av dina aktiecases att koppla till"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-case">Ingen koppling</SelectItem>
          {stockCases?.map((stockCase) => (
            <SelectItem key={stockCase.id} value={stockCase.id}>
              {stockCase.title} - {stockCase.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {stockCases && stockCases.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">
          Du har inga aktiecases än. Skapa ett aktiecase först för att kunna koppla analyser till det.
        </p>
      )}
    </div>
  );
};

export default AnalysisStockCaseSelect;
