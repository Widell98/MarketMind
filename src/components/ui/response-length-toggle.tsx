import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, BookOpen } from 'lucide-react';

type ResponseLength = 'concise' | 'standard' | 'detailed';

interface ResponseLengthToggleProps {
  value: ResponseLength;
  onChange: (value: ResponseLength) => void;
  className?: string;
}

const responseLengthOptions = [
  {
    value: 'concise' as ResponseLength,
    label: 'Koncis',
    description: 'Korta, snabba svar',
    icon: MessageSquare,
    badge: '< 100 ord'
  },
  {
    value: 'standard' as ResponseLength,
    label: 'Standard',
    description: 'Balanserad detaljeringsgrad',
    icon: FileText,
    badge: '100-300 ord'
  },
  {
    value: 'detailed' as ResponseLength,
    label: 'Detaljerad',
    description: 'Djup analys och förklaringar',
    icon: BookOpen,
    badge: '> 300 ord'
  }
];

export const ResponseLengthToggle: React.FC<ResponseLengthToggleProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="text-sm font-medium text-foreground">
        Svarslängd
      </div>
      <div className="flex flex-wrap gap-2">
        {responseLengthOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          
          return (
            <Button
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-2 ${
                isSelected 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'hover:bg-accent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{option.label}</span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  isSelected 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {option.badge}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ResponseLengthToggle;