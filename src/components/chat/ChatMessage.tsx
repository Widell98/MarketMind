
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

  // Improved function to format AI response content for mobile
  const formatAIContent = (content: string) => {
    let formatted = content
      // Convert headers to mobile-friendly format
      .replace(/### (.+)/g, '<div class="font-semibold text-sm sm:text-base mb-2 mt-4 first:mt-0 text-foreground border-l-2 border-primary pl-3">$1</div>')
      // Convert bold text
      .replace(/\*\*(.+?)\*\*/g, '<span class="font-medium text-foreground">$1</span>')
      // Handle main bullet points with better mobile spacing
      .replace(/^- (.+)/gm, '<div class="flex items-start gap-2 mb-2 text-sm leading-relaxed"><span class="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span><span class="flex-1 break-words">$1</span></div>')
      // Handle sub-bullets with company examples - better mobile formatting
      .replace(/  - (.+?) – (.+)/gm, '<div class="ml-4 flex items-start gap-2 mb-1.5 text-xs sm:text-sm"><span class="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></span><div class="flex-1 break-words"><span class="font-medium text-foreground">$1</span><span class="text-muted-foreground block sm:inline"> – $2</span></div></div>')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return formatted;
  };

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'} group mb-3 sm:mb-4`}>
      <div className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[75%] lg:max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
          isUser 
            ? 'bg-primary' 
            : 'bg-muted'
        }`}>
          {isUser ? (
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
          ) : (
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          )}
        </div>
        
        <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-3 py-2 sm:px-3 sm:py-2.5 rounded-2xl border shadow-sm max-w-full ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground'
          }`}>
            {isUser ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>
            ) : (
              <div 
                className="text-sm leading-relaxed ai-response break-words overflow-hidden"
                dangerouslySetInnerHTML={{ 
                  __html: formatAIContent(message.content) 
                }}
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              />
            )}
            
            {message.context?.isExchangeRequest && !isUser && (
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 font-medium mb-1 text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Portföljförändring föreslås
                </div>
                <p className="text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
                  Detta förslag kan påverka din portföljs sammansättning. Överväg riskerna innan du genomför ändringar.
                </p>
              </div>
            )}
          </div>
          
          <div className={`text-xs flex items-center gap-1 ${isUser ? 'justify-end' : 'justify-start'} text-muted-foreground px-1`}>
            <Clock className="w-3 h-3" />
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
