import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OPEN_CHAT_DOCUMENT_UPLOAD_EVENT } from '@/constants/chatDocuments';
import { Send, AlertCircle, Loader2, X, Paperclip } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumUpgradeModal from './PremiumUpgradeModal';
import { useToast } from '@/hooks/use-toast';

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
  isDocumentLimitReached?: boolean;
  onDocumentLimitClick?: () => void;
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
  isDocumentLimitReached = false,
  onDocumentLimitClick,
}: ChatInputProps) => {
  const { isSubscribed } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachClick = () => {
    if (isDocumentLimitReached) {
      if (onDocumentLimitClick) onDocumentLimitClick();
      return;
    }
    
    const event = new CustomEvent(OPEN_CHAT_DOCUMENT_UPLOAD_EVENT);
    window.dispatchEvent(event);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (quotaExceeded && !isSubscribed) {
      setShowUpgradeModal(true);
      return;
    }

    onSubmit(e);
  };

  return (
    <div className="w-full border-t border-ai-border/40 bg-white/50 backdrop-blur-md dark:bg-ai-surface/50 p-3 pb-4">
      
      {/* Denna container styr bredden på både dokument och input */}
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        
        {/* Uppladdade dokument - Nu inuti wrappern så den följer bredden */}
        {attachedDocuments && attachedDocuments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 px-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
            {attachedDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-medium shadow-sm transition-all ${
                  doc.status === 'failed' 
                    ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                    : 'bg-white border-ai-border/60 text-foreground dark:bg-ai-surface-muted'
                }`}
              >
                {doc.status === 'processing' ? (
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                ) : (
                  <Paperclip className="h-3 w-3 opacity-70" />
                )}
                
                <span className="max-w-[150px] truncate">{doc.name}</span>
                
                {onRemoveDocument && (
                  <button
                    onClick={() => onRemoveDocument(doc.id)}
                    className="ml-1 rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                    type="button"
                  >
                    <X className="h-3 w-3 opacity-60" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative flex w-full items-end gap-2 rounded-2xl border border-ai-border/60 bg-white p-2 shadow-sm transition-all focus-within:border-primary/40 focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20 dark:bg-ai-surface dark:shadow-none"
        >
          {/* Bifoga-knapp */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl text-ai-text-muted transition-colors hover:bg-ai-surface-muted hover:text-foreground"
            onClick={handleAttachClick}
            disabled={isLoading || isAttachDisabled}
            title="Bifoga dokument"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Textfält */}
          <Textarea
            ref={inputRef}
            tabIndex={0}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Assistenten tänker..." : "Ställ en fråga om din portfölj..."}
            className="min-h-[40px] max-h-[200px] w-full resize-none border-0 bg-transparent py-2.5 text-sm placeholder:text-ai-text-muted focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
            disabled={isLoading}
          />

          {/* Skicka-knapp */}
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className={`h-9 w-9 rounded-xl transition-all duration-300 ${
              input.trim() && !isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-md'
                : 'bg-ai-surface-muted text-ai-text-muted hover:bg-ai-surface-muted/80'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Footer-info */}
        <div className="mt-1.5 px-2 text-center text-[11px] text-ai-text-muted flex justify-center items-center gap-2 opacity-80">
          {quotaExceeded && !isSubscribed ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium">
              <AlertCircle className="h-3 w-3" />
              Gräns nådd. Uppgradera för obegränsat.
            </span>
          ) : (
            <span>
              AI kan göra misstag. Kontrollera viktig information.
            </span>
          )}
        </div>
      </div>

      <PremiumUpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
