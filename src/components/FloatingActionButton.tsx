
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  TrendingUp,
  Wallet,
  Search,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  action: string;
  color: string;
}

const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'add_holding',
      label: 'Lägg till innehav',
      icon: Plus,
      action: 'add_holding',
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      id: 'add_cash',
      label: 'Lägg till kassa',
      icon: Wallet,
      action: 'add_cash',
      color: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      id: 'ai_chat',
      label: 'AI-analys',
      icon: MessageSquare,
      action: 'ai_chat',
      color: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    {
      id: 'analyze',
      label: 'Portfolio-analys',
      icon: BarChart3,
      action: 'analyze',
      color: 'bg-orange-600 hover:bg-orange-700 text-white'
    },
    {
      id: 'market_pulse',
      label: 'Marknadspuls',
      icon: TrendingUp,
      action: 'market_pulse',
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
    }
  ];

  const handleActionClick = (actionId: string) => {
    setIsOpen(false);
    
    switch (actionId) {
      case 'add_holding':
        navigate('/ai-chatt', { 
          state: { 
            createNewSession: true, 
            sessionName: 'Lägg till innehav',
            initialMessage: 'Jag vill lägga till ett nytt innehav i min portfölj. Kan du hjälpa mig?' 
          }
        });
        break;
      case 'add_cash':
        // Trigger add cash dialog
        document.dispatchEvent(new CustomEvent('openAddCashDialog'));
        break;
      case 'ai_chat':
        navigate('/ai-chatt');
        break;
      case 'analyze':
        navigate('/portfolio-implementation');
        break;
      case 'market_pulse':
        navigate('/');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {/* Action Menu */}
        {isOpen && (
          <Card className="mb-4 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
            <CardContent className="p-2">
              <div className="space-y-2 w-48">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-12 transition-all duration-200",
                        "hover:scale-105 hover:shadow-md"
                      )}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.3s ease-out forwards'
                      }}
                      onClick={() => handleActionClick(action.id)}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        action.color
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main FAB */}
        <Button
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl transition-all duration-300",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "hover:scale-110 active:scale-95",
            isOpen && "rotate-45"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Zap className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default FloatingActionButton;
