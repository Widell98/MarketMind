
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Bot, TrendingUp } from 'lucide-react';

interface MessageContext {
  analysisType?: string;
  confidence?: number;
  isExchangeRequest?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: MessageContext;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  return (
    <div className={`flex gap-4 sm:gap-6 ${isUser ? 'justify-end' : 'justify-start'} group mb-6 sm:mb-8`}>
      <div className={`flex gap-3 sm:gap-4 max-w-xs sm:max-w-2xl lg:max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl sm:rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg transform transition-transform duration-300 ${
          isUser 
            ? 'rotate-3 hover:rotate-0 bg-primary' 
            : '-rotate-3 hover:rotate-0 bg-secondary'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          ) : (
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-foreground" />
          )}
        </div>
        
        <div className={`flex flex-col gap-2 sm:gap-3 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-lg border backdrop-blur-sm ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground'
          }`}>
            <div className="whitespace-pre-wrap break-words leading-relaxed text-sm sm:text-base">
              {message.content}
            </div>
            
            {message.context?.isExchangeRequest && !isUser && (
              <div className="mt-4 p-3 sm:p-4 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 font-medium mb-2 text-amber-700 dark:text-amber-300">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  Portföljförändring föreslås
                </div>
                <p className="text-amber-600 dark:text-amber-400 text-sm">
                  Detta förslag kan påverka din portföljs sammansättning. Överväg riskerna innan du genomför ändringar.
                </p>
              </div>
            )}
          </div>
          
          <div className={`text-xs sm:text-sm flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'} text-muted-foreground`}>
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
