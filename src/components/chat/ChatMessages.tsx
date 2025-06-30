
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    analysisType?: string;
    confidence?: number;
    isExchangeRequest?: boolean;
  };
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingSession: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, isLoading, isLoadingSession, messagesEndRef }: ChatMessagesProps) => {
  if (isLoadingSession) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 items-start">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Ställ en fråga för att börja diskutera din portfölj med AI-assistenten
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-4 border shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>AI-assistenten tänker...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
