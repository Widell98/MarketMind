
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Bot, TrendingUp, Info } from 'lucide-react';

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

  // Function to format AI responses for better readability
  const formatAIResponse = (content: string) => {
    if (isUser) return content;

    // Remove markdown headers and make content more concise
    let formatted = content
      .replace(/#{1,3}\s*/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/- \*\*(.*?)\*\*/g, '• $1') // Convert bullet points
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .trim();

    // Split into sections and make more concise
    const sections = formatted.split('\n').filter(line => line.trim());
    
    if (sections.length > 8) {
      // If response is too long, summarize it
      const summary = sections.slice(0, 3).join('\n');
      const keyPoints = sections
        .filter(line => line.includes('•') || line.includes('-'))
        .slice(0, 4)
        .join('\n');
      
      return `${summary}\n\n${keyPoints}\n\n💡 Sammanfattning: Detta är utbildningssyfte, inte investeringsråd. Konsultera alltid en licensierad rådgivare.`;
    }

    return formatted;
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group mb-4`}>
      <div className={`flex gap-3 max-w-[85%] lg:max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? 'bg-blue-600' 
            : 'bg-slate-700'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
        
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl border max-w-full ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-900 border-slate-200'
          }`}>
            <div className="whitespace-pre-wrap break-words leading-relaxed text-sm overflow-hidden">
              {formatAIResponse(message.content)}
            </div>
            
            {message.context?.isExchangeRequest && !isUser && (
              <div className="mt-3 p-3 rounded-xl border bg-amber-50 border-amber-200">
                <div className="flex items-center gap-2 font-medium mb-1 text-amber-700 text-sm">
                  <Info className="w-4 h-4" />
                  Portföljförändring föreslås
                </div>
                <p className="text-amber-600 text-xs">
                  Överväg riskerna innan du genomför ändringar.
                </p>
              </div>
            )}
          </div>
          
          <div className={`text-xs flex items-center gap-1 ${isUser ? 'justify-end' : 'justify-start'} text-slate-500`}>
            <Clock className="w-3 h-3" />
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
