
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
  
  const dailyLimit = 10;
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
      <div className="flex-shrink-0 border-t border-transparent bg-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-md transition-colors sm:px-6 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pt-6 lg:px-10 lg:pb-[calc(1.75rem+env(safe-area-inset-bottom))] lg:pt-8">
        {quotaExceeded && (
          <div className="mx-auto mb-4 w-full max-w-4xl rounded-3xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-[0_16px_45px_rgba(239,68,68,0.18)] sm:px-5">
            <div className="mb-1.5 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              API-kvot överskriden
            </div>
            <p className="text-destructive/80">
              Du har nått din dagliga gräns för AI-användning. Försök igen senare eller uppgradera ditt konto.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-4xl"
        >
          <div className="rounded-[28px] border border-[#144272]/15 bg-white/85 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors sm:p-4 dark:border-ai-border/60 dark:bg-ai-surface/90 dark:shadow-none">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="relative flex-1">
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
                  placeholder={isAtLimit ? "Uppgradera till Premium för fler meddelanden" : "Skriv ditt meddelande här... (kostar 1 credit)"}
                  disabled={isLoading || quotaExceeded}
                  className="min-h-[54px] max-h-[160px] w-full resize-none rounded-[20px] border-none bg-transparent px-4 pr-12 text-sm text-foreground placeholder:text-ai-text-muted focus-visible:border-none focus-visible:outline-none focus-visible:ring-0 sm:text-base dark:text-foreground"
                  style={{ fontSize: '16px' }}
                  rows={1}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors dark:text-ai-text-muted">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading || quotaExceeded}
                size="icon"
                className="h-11 w-11 rounded-full bg-gradient-to-r from-[#2563eb] to-primary text-primary-foreground shadow-[0_18px_40px_rgba(37,99,235,0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(37,99,235,0.45)] disabled:translate-y-0 disabled:opacity-60 sm:h-12 sm:w-12 dark:from-primary dark:to-primary dark:hover:from-primary/90 dark:hover:to-primary/90 dark:shadow-none"
                aria-label="Skicka meddelande"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Premium Badge for Premium Users */}
        {isPremium && (
          <div className="mx-auto mt-4 flex w-full max-w-4xl justify-center">
            <Badge className="rounded-full border border-amber-500/30 bg-amber-400/15 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-amber-600 shadow-sm backdrop-blur-sm dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
              <Crown className="mr-2 h-3 w-3" />
              Premium-användare
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
