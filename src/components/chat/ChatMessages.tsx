
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ModernChatBubble from './ModernChatBubble';
import ModernTypingIndicator from './ModernTypingIndicator';

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
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-gray-900/30 dark:to-gray-800/30">
        <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 items-start max-w-full animate-pulse">
              <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-3/4 max-w-md rounded-lg" />
                <Skeleton className="h-4 w-1/2 max-w-xs rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-gray-900/30 dark:to-gray-800/30">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-6xl mx-auto w-full">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <div className="w-8 h-8 text-white">🤖</div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Ställ en fråga för att börja diskutera din portfölj med AI-assistenten
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <ModernChatBubble key={message.id} message={message} />
        ))}
        
        {isLoading && <ModernTypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
