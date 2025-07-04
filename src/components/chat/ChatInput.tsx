
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  MessageSquare, 
  AlertCircle,
  Loader2,
  Crown
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumUpgradeModal from './PremiumUpgradeModal';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  quotaExceeded: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ChatInput = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  quotaExceeded,
  inputRef
}: ChatInputProps) => {
  const { usage, subscription } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const dailyLimit = 5;
  const currentUsage = usage?.ai_messages_count || 0;
  const isPremium = subscription?.subscribed;
  const isAtLimit = !isPremium && currentUsage >= dailyLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has reached limit
    if (isAtLimit && !isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    
    onSubmit(e);
  };

  return (
    <>
      <div className="border-t bg-background p-3 sm:p-4 lg:p-6">
        {/* Usage Display for Free Users */}
        {!isPremium && (
          <div className="mb-3 sm:mb-4 p-3 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Meddelanden idag: {currentUsage}/{dailyLimit}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
                className="text-xs flex items-center gap-1.5 hover:bg-primary/10"
              >
                <Crown className="w-3 h-3" />
                Uppgradera
              </Button>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((currentUsage / dailyLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {quotaExceeded && (
          <div className="mb-3 sm:mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
            <div className="flex items-center gap-2 font-medium mb-1 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              API-kvot överskriden
            </div>
            <p className="text-destructive/80 text-sm leading-relaxed">
              Du har nått din dagliga gräns för AI-användning. Försök igen senare eller uppgradera ditt konto.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative min-w-0">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAtLimit ? "Uppgradera för att fortsätta chatta..." : "Skriv din fråga här..."}
              disabled={isLoading || quotaExceeded}
              className="h-10 sm:h-11 lg:h-12 bg-background border shadow-sm rounded-xl text-sm sm:text-base px-3 sm:px-4 pr-10 transition-all duration-200 focus:shadow-md resize-none"
              style={{ fontSize: '16px' }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || quotaExceeded}
            size="default"
            className="h-10 sm:h-11 lg:h-12 px-3 sm:px-4 lg:px-6 bg-primary hover:bg-primary/90 shadow-sm rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md text-primary-foreground flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* Premium Badge for Premium Users */}
        {isPremium && (
          <div className="flex justify-center mt-3">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1">
              <Crown className="w-3 h-3 mr-1" />
              Premium - Obegränsade meddelanden
            </Badge>
          </div>
        )}
      </div>

      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUsage={currentUsage}
        dailyLimit={dailyLimit}
      />
    </>
  );
};

export default ChatInput;
