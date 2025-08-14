import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  PieChart,
  Search,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { useGuideSession } from '@/hooks/useGuideSession';
import { useNavigate } from 'react-router-dom';

interface HelpButtonProps {
  className?: string;
}

const HelpButton: React.FC<HelpButtonProps> = ({ className = "" }) => {
  const { resetGuideSession, handleNavigate } = useGuideSession();
  const navigate = useNavigate();

  const handleShowGuide = () => {
    resetGuideSession();
    navigate('/portfolio-advisor');
  };

  const handleQuickGuide = (type: string) => {
    switch (type) {
      case 'ai-chat':
        navigate('/portfolio-advisor');
        // Dispatch custom event to show AI chat guide
        window.dispatchEvent(new CustomEvent('showGuideDemo', { 
          detail: { type: 'ai-chat' } 
        }));
        break;
      case 'portfolio':
        handleNavigate('/portfolio-implementation');
        break;
      case 'stock-cases':
        handleNavigate('/stock-cases');
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`flex items-center gap-2 ${className}`}>
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Hjälp</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleShowGuide}>
          <BookOpen className="w-4 h-4 mr-2" />
          Visa guide från början
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleQuickGuide('ai-chat')}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Hur fungerar AI-chatten?
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleQuickGuide('portfolio')}>
          <PieChart className="w-4 h-4 mr-2" />
          Hantera min portfölj
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleQuickGuide('stock-cases')}>
          <Search className="w-4 h-4 mr-2" />
          Hitta investeringscase
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => window.open('https://docs.marketmind.se', '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Fullständig dokumentation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HelpButton;