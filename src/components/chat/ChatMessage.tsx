
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

  // Function to format AI response content
  const formatAIContent = (content: string) => {
    // Remove excessive markdown formatting and clean up the text
    let formatted = content
      // Remove ### headers and make them bold instead
      .replace(/### (.+)/g, '<strong class="block text-base font-semibold mb-3 text-foreground">$1</strong>')
      // Convert ** bold ** to proper formatting
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-foreground">$1</strong>')
      // Handle bullet points more elegantly
      .replace(/^- (.+)/gm, '<div class="flex items-start gap-2 mb-2"><span class="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span><span class="text-sm leading-relaxed">$1</span></div>')
      // Handle sub-bullets with company examples
      .replace(/  - (.+?) – (.+)/gm, '<div class="ml-4 flex items-start gap-2 mb-1.5"><span class="w-1 h-1 rounded-full bg-muted-foreground mt-2.5 flex-shrink-0"></span><span class="text-sm"><strong class="font-medium text-foreground">$1</strong> <span class="text-muted-foreground">– $2</span></span></div>')
      // Clean up extra whitespace and line breaks
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return formatted;
  };

  return (
    <div className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} group mb-4 sm:mb-6`}>
      <div className={`flex gap-3 max-w-xs sm:max-w-xl lg:max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
          isUser 
            ? 'bg-primary' 
            : 'bg-muted'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          ) : (
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          )}
        </div>
        
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border shadow-sm ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground'
          }`}>
            {isUser ? (
              <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>
            ) : (
              <div 
                className="text-sm sm:text-base leading-relaxed ai-response"
                dangerouslySetInnerHTML={{ 
                  __html: formatAIContent(message.content) 
                }}
              />
            )}
            
            {message.context?.isExchangeRequest && !isUser && (
              <div className="mt-3 p-3 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 font-medium mb-1.5 text-amber-700 dark:text-amber-300 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  Portföljförändring föreslås
                </div>
                <p className="text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
                  Detta förslag kan påverka din portföljs sammansättning. Överväg riskerna innan du genomför ändringar.
                </p>
              </div>
            )}
          </div>
          
          <div className={`text-xs flex items-center gap-1.5 ${isUser ? 'justify-end' : 'justify-start'} text-muted-foreground`}>
            <Clock className="w-3 h-3" />
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
