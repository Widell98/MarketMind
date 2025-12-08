import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PortfolioGeneratedNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  recommendationCount?: number;
}

const PortfolioGeneratedNotification: React.FC<PortfolioGeneratedNotificationProps> = ({
  isOpen,
  onClose,
  recommendationCount
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Auto-close after 10 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleViewRecommendations = () => {
    onClose();
    navigate('/portfolio-implementation');
    // Scroll to AI recommendations section after navigation
    setTimeout(() => {
      const element = document.querySelector('[data-ai-recommendations]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div
      className={cn(
        "fixed right-4 top-20 z-50 transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
      )}
      style={{ maxWidth: '400px' }}
    >
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-200/30 dark:border-purple-700/30">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  AI-rekommenderade innehav är uppdaterade
                </h3>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
                  aria-label="Stäng"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                {recommendationCount 
                  ? `Din portfölj har genererats med ${recommendationCount} AI-rekommendationer.`
                  : 'Din portfölj har genererats och AI-rekommendationer är nu tillgängliga.'
                }
              </p>
              
              <Button
                onClick={handleViewRecommendations}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Visa AI-förslag</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioGeneratedNotification;

