
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
    <div className="bg-white border-t border-slate-200 p-4">
      {quotaExceeded && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 font-medium mb-1 text-red-700">
            <AlertCircle className="w-4 h-4" />
            API-kvot överskriden
          </div>
          <p className="text-red-600 text-sm">
            Du har nått din dagliga gräns för AI-användning. Försök igen senare.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv din fråga här..."
            disabled={isLoading || quotaExceeded}
            className="h-12 bg-white border-slate-300 rounded-xl text-sm px-4 pr-12 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || isLoading || quotaExceeded}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium"
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
