
import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { OPEN_CHAT_DOCUMENT_UPLOAD_EVENT } from '@/constants/chatDocuments';
import {
  Send,
  MessageSquare,
  AlertCircle,
  Loader2,
  Crown,
  Sparkles,
  X,
  Paperclip,
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
  attachedDocuments?: Array<{ id: string; name: string; status?: 'processing' | 'processed' | 'failed' }>;
  onRemoveDocument?: (documentId: string) => void;
  isAttachDisabled?: boolean;
}

const ChatInput = memo(({
  input,
  setInput,
  onSubmit,
  isLoading,
  quotaExceeded,
  inputRef,
  attachedDocuments = [],
  onRemoveDocument,
  isAttachDisabled = false,
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

    if (isLoading || quotaExceeded) {
      return;
    }

    onSubmit(e);
  };

  const handleAttachClick = () => {
    if (isAttachDisabled) {
      return;
    }

    const event = new Event(OPEN_CHAT_DOCUMENT_UPLOAD_EVENT);
    window.dispatchEvent(event);
  };

  return (
    <>
      <div className="flex-shrink-0 border-t border-[#144272]/20 bg-white/95 px-4 py-4 shadow-[0_-20px_60px_rgba(15,23,42,0.07)] backdrop-blur-sm transition-colors sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8 xl:py-8 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-[calc(1.25rem+env(safe-area-inset-bottom))] xl:pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:border-ai-border/60 dark:bg-ai-surface dark:shadow-none">
        {quotaExceeded && (
          <div className="mb-3 sm:mb-4 rounded-[18px] border border-destructive/20 bg-destructive/10 p-3 shadow-[0_16px_40px_rgba(239,68,68,0.18)]">
            <div className="flex items-center gap-2 font-medium mb-1 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              API-kvot överskriden
            </div>
            <p className="text-destructive/80 text-sm leading-relaxed">
              Du har nått din dagliga gräns för AI-användning. Försök igen senare eller uppgradera ditt konto.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-4xl items-end gap-2 sm:gap-3 xl:gap-4"
        >
          <div className="flex-1 relative min-w-0">
            {attachedDocuments.length > 0 && (
              <div className="mb-2 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI:n använder dessa dokument som källor</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachedDocuments.map((doc) => (
                    <span
                      key={doc.id}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      <span className="max-w-[160px] truncate" title={doc.name}>
                        {doc.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveDocument?.(doc.id)}
                        className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary/30"
                        aria-label={`Ta bort ${doc.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading && !quotaExceeded) {
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }
              }}
              placeholder={isAtLimit ? "Uppgradera till Premium för fler meddelanden" : "Skriv ditt meddelande här... (kostar 1 credit)"}
              disabled={quotaExceeded}
              readOnly={isLoading && !quotaExceeded}
              aria-disabled={isLoading || quotaExceeded}
              aria-busy={isLoading}
              className="min-h-[48px] max-h-[160px] w-full resize-none rounded-[18px] border border-[#205295]/22 bg-white/90 px-4 pr-12 text-sm shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-200 focus:border-primary/60 focus:shadow-[0_20px_55px_rgba(15,23,42,0.08)] focus:ring-2 focus:ring-primary/20 sm:px-5 sm:text-base dark:rounded-ai-md dark:border-ai-border/60 dark:bg-ai-surface dark:shadow-sm dark:focus:border-ai-border/80 dark:focus:ring-0"
              style={{ fontSize: '16px' }}
              rows={1}
            />
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary/50 transition-colors dark:text-ai-text-muted">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAttachClick}
              disabled={isAttachDisabled}
              className="h-10 w-10 rounded-full border border-transparent text-primary transition-colors hover:border-primary/30 hover:bg-primary/10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 dark:text-ai-text-muted dark:hover:text-primary"
              aria-label="Bifoga dokument"
            >
              <span className="relative flex h-4 w-4 items-center justify-center">
                <Paperclip className="h-4 w-4" />
                {attachedDocuments.length > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-[3px] text-[10px] font-semibold text-primary-foreground">
                    {attachedDocuments.length}
                  </span>
                )}
              </span>
            </Button>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || quotaExceeded}
              size="default"
              className="h-10 sm:h-11 lg:h-12 px-5 sm:px-6 bg-gradient-to-r from-blue-500 to-primary hover:from-blue-500/90 hover:to-primary/90 shadow-[0_24px_55px_rgba(15,23,42,0.18)] rounded-full text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(15,23,42,0.22)] text-primary-foreground flex-shrink-0 self-end dark:from-primary dark:to-primary dark:hover:from-primary/90 dark:hover:to-primary/90 dark:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
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
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
