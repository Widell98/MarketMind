
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
        <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 items-start max-w-full">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-3/4 max-w-md" />
                <Skeleton className="h-4 w-1/2 max-w-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-6xl mx-auto w-full">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-base">
              Ställ en fråga för att börja diskutera din portfölj med AI-assistenten
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 items-start max-w-full">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-lg p-4 border shadow-sm flex-1 min-w-0 max-w-[75%]">
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
