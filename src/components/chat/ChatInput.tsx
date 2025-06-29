
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
    <div className="bg-background/50 backdrop-blur-sm border-t p-4 sm:p-6 lg:p-8">
      {quotaExceeded && (
        <div className="mb-4 sm:mb-6 p-4 bg-destructive/10 backdrop-blur-sm border border-destructive/20 rounded-xl">
          <div className="flex items-center gap-3 font-medium mb-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            API-kvot överskriden
          </div>
          <p className="text-destructive/80">
            Du har nått din dagliga gräns för AI-användning. Försök igen senare eller uppgradera ditt konto.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-3 sm:gap-4 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv din fråga här... (t.ex. 'Analysera min portfölj' eller 'Vilka aktier bör jag köpa?')"
            disabled={isLoading || quotaExceeded}
            className="h-12 sm:h-14 bg-background/80 backdrop-blur-sm border shadow-lg rounded-2xl text-sm sm:text-base px-4 sm:px-6 pr-12 sm:pr-14 transition-all duration-200 focus:shadow-xl"
          />
          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || isLoading || quotaExceeded}
          size="lg"
          className="h-12 sm:h-14 px-6 sm:px-8 bg-primary hover:bg-primary/90 shadow-lg rounded-2xl text-sm sm:text-base font-medium transition-all duration-200 hover:shadow-xl text-primary-foreground transform hover:scale-105 disabled:transform-none"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
