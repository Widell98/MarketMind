
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  MessageSquare, 
  AlertCircle,
  Loader2
} from 'lucide-react';

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
  return (
    <div className="border-t bg-background p-4 sm:p-6">
      {quotaExceeded && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
          <div className="flex items-center gap-2 font-medium mb-1 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            API-kvot överskriden
          </div>
          <p className="text-destructive/80 text-sm leading-relaxed">
            Du har nått din dagliga gräns för AI-användning. Försök igen senare eller uppgradera ditt konto.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv din fråga här... (t.ex. 'Analysera min portfölj' eller 'Vilka aktier bör jag köpa?')"
            disabled={isLoading || quotaExceeded}
            className="h-10 sm:h-12 bg-background border shadow-sm rounded-xl text-sm sm:text-base px-3 sm:px-4 pr-10 transition-all duration-200 focus:shadow-md"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || isLoading || quotaExceeded}
          size="default"
          className="h-10 sm:h-12 px-4 sm:px-6 bg-primary hover:bg-primary/90 shadow-sm rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:shadow-md text-primary-foreground"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
