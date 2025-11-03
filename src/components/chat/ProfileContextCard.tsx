import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Edit2, 
  Save, 
  X, 
  User, 
  Target, 
  Calendar,
  DollarSign,
  TrendingUp,
  Shield
} from 'lucide-react';

interface ProfileContextCardProps {
  onUpdate?: () => void;
}

const ProfileContextCard = ({ onUpdate }: ProfileContextCardProps) => {
  const { user } = useAuth();
  const { riskProfile, refetch } = useRiskProfile();
  const { toast } = useToast();
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = (field: string, currentValue: any) => {
    setEditField(field);
    setEditValue(String(currentValue || ''));
  };

  const handleSave = async () => {
    if (!user || !editField || !riskProfile) return;

    setIsUpdating(true);
    try {
      let value: any = editValue;
      
      // Convert to appropriate type based on field
      if (['monthly_investment_amount', 'annual_income', 'liquid_capital', 'age', 'risk_comfort_level'].includes(editField)) {
        value = parseInt(editValue) || 0;
      }

      const { error } = await supabase
        .from('user_risk_profiles')
        .update({ [editField]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      await refetch();
      setEditField(null);
      setEditValue('');
      onUpdate?.();
      
      toast({
        title: "Profil uppdaterad",
        description: "Dina profilinställningar har sparats",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera profilen",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditField(null);
    setEditValue('');
  };

  if (!riskProfile) return null;

  const fields = [
    {
      key: 'monthly_investment_amount',
      label: 'Månatlig sparbudget',
      value: riskProfile.monthly_investment_amount ? `${riskProfile.monthly_investment_amount.toLocaleString()} SEK` : 'Ej angiven',
      icon: DollarSign,
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      key: 'risk_tolerance',
      label: 'Risktolerans',
      value: riskProfile.risk_tolerance === 'conservative' ? 'Konservativ' : 
             riskProfile.risk_tolerance === 'moderate' ? 'Måttlig' : 'Aggressiv',
      icon: Shield,
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      key: 'investment_horizon',
      label: 'Tidshorisont',
      value: riskProfile.investment_horizon === 'short' ? 'Kort (0–2 år)' :
             riskProfile.investment_horizon === 'medium' ? 'Medel (3–5 år)' : 'Lång (5+ år)',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      key: 'age',
      label: 'Ålder',
      value: riskProfile.age ? `${riskProfile.age} år` : 'Ej angiven',
      icon: User,
      color: 'bg-gray-50 text-gray-700 border-gray-200'
    }
  ];

  return (
    <Card className="p-4 mb-4 border-l-4 border-l-primary">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm">Investeringsprofil</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          Snabbredigering
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {fields.map((field) => {
          const IconComponent = field.icon;
          const isEditing = editField === field.key;
          
          return (
            <div key={field.key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 flex-1">
                <IconComponent className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground min-w-[80px]">
                  {field.label}:
                </span>
                
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-xs"
                      placeholder={field.label}
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="h-7 w-7 p-0"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${field.color}`}
                    >
                      {field.value}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(field.key, riskProfile[field.key as keyof typeof riskProfile])}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {riskProfile.sector_interests && riskProfile.sector_interests.length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sektorintressen:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {riskProfile.sector_interests.map((sector) => (
              <Badge key={sector} variant="secondary" className="text-xs">
                {sector}
              </Badge>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default ProfileContextCard;