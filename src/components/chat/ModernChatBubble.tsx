
import React from 'react';
import { cn } from '@/lib/utils';

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

interface ModernChatBubbleProps {
  message: Message;
  isLoading?: boolean;
}

const ModernChatBubble = ({ message, isLoading = false }: ModernChatBubbleProps) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "flex gap-3 items-start max-w-full animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      {/* AI Avatar */}
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <div className="w-4 h-4 border-2 border-white rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "relative max-w-[75%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm border transition-all duration-300",
        isUser 
          ? "bg-gradient-to-br from-primary to-blue-600 text-white border-primary/20 rounded-br-lg shadow-primary/25" 
          : "bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-700/50 rounded-tl-lg hover:shadow-xl"
      )}>
        {/* Message Text */}
        <div className={cn(
          "text-sm leading-relaxed break-words whitespace-pre-wrap",
          isUser ? "text-white" : "text-gray-900 dark:text-gray-100"
        )}>
          {message.content}
        </div>

        {/* Timestamp */}
        <div className={cn(
          "text-xs mt-2 opacity-70",
          isUser ? "text-white/80" : "text-gray-500 dark:text-gray-400"
        )}>
          {message.timestamp.toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

        {/* Context indicators */}
        {message.context?.confidence && (
          <div className="flex items-center gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs opacity-70">
              {Math.round(message.context.confidence * 100)}% säker
            </span>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <div className="w-4 h-4 text-gray-600 dark:text-gray-300">👤</div>
        </div>
      )}
    </div>
  );
};

export default ModernChatBubble;
