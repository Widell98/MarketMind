
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
    <div className="backdrop-blur-sm border-t p-6 xl:p-8" style={{ backgroundColor: 'rgba(222, 211, 196, 0.5)', borderColor: '#DED3C4' }}>
      {quotaExceeded && (
        <div className="mb-6 p-4 backdrop-blur-sm border rounded-xl" style={{ backgroundColor: 'rgba(222, 211, 196, 0.9)', borderColor: '#DED3C4' }}>
          <div className="flex items-center gap-3 font-medium mb-2" style={{ color: '#555879' }}>
            <AlertCircle className="w-5 h-5" />
            API-kvot överskriden
          </div>
          <p style={{ color: '#98A1BC' }}>
            Du har nått din dagliga gräns för AI-användning. Försök igen senare eller uppgradera ditt konto.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-4 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv din fråga här... (t.ex. 'Analysera min portfölj' eller 'Vilka aktier bör jag köpa?')"
            disabled={isLoading || quotaExceeded}
            className="h-14 backdrop-blur-sm border shadow-lg rounded-2xl text-base px-6 pr-14 transition-all duration-200 focus:shadow-xl"
            style={{ 
              backgroundColor: 'rgba(244, 235, 211, 0.9)',
              borderColor: '#DED3C4',
              color: '#555879'
            }}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2" style={{ color: '#98A1BC' }}>
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || isLoading || quotaExceeded}
          size="lg"
          className="h-14 px-8 shadow-lg rounded-2xl text-base font-medium transition-all duration-200 hover:shadow-xl text-[#F4EBD3] transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
