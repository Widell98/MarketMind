
import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const ChatInput = memo(({
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
      <div className="flex-shrink-0 border-t border-border/60 bg-background/95 p-3 sm:p-4 lg:p-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-[calc(1.5rem+env(safe-area-inset-bottom))] backdrop-blur">
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

        <form onSubmit={handleSubmit} className="flex w-full max-w-4xl mx-auto gap-2 sm:gap-3 items-end">
          <div className="flex-1 relative min-w-0">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder={isAtLimit ? "Uppgradera till Unlimited Chatt för fler meddelanden" : "Skriv ditt meddelande här... (kostar 1 credit)"}
              disabled={isLoading || quotaExceeded}
              className="min-h-[44px] max-h-[140px] bg-background/95 border border-border/60 shadow-sm rounded-xl text-sm sm:text-base px-3 sm:px-4 pr-10 transition-all duration-200 focus:shadow-md resize-none w-full"
              style={{ fontSize: '16px' }}
              rows={1}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || quotaExceeded}
            size="default"
            className="h-10 sm:h-11 lg:h-12 px-3 sm:px-4 lg:px-4 bg-primary hover:bg-primary/90 shadow-sm rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md text-primary-foreground flex-shrink-0 self-end"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* Badge for Unlimited Chatt users */}
        {isPremium && (
          <div className="flex justify-center mt-3">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1">
              <Crown className="w-3 h-3 mr-1" />
              Unlimited Chatt - Obegränsade meddelanden
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
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
