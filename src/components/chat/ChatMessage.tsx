
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Bot, TrendingUp, Sparkles } from 'lucide-react';

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
    <div className={`flex gap-6 ${isUser ? 'justify-end' : 'justify-start'} group mb-8`}>
      <div className={`flex gap-4 max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-12 h-12 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg transform transition-transform duration-300 ${
          isUser 
            ? 'rotate-3 hover:rotate-0' 
            : '-rotate-3 hover:rotate-0'
        }`} style={{ 
          background: isUser 
            ? 'linear-gradient(135deg, #555879, #98A1BC)' 
            : 'linear-gradient(135deg, #98A1BC, #DED3C4)'
        }}>
          {isUser ? (
            <User className="w-6 h-6 text-[#F4EBD3]" />
          ) : (
            <Bot className="w-6 h-6" style={{ color: '#555879' }} />
          )}
        </div>
        
        <div className={`flex flex-col gap-3 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-6 py-4 rounded-2xl shadow-lg border max-w-3xl backdrop-blur-sm ${
            isUser
              ? 'text-[#F4EBD3]'
              : 'text-[#555879]'
          }`} style={{
            backgroundColor: isUser 
              ? 'rgba(85, 88, 121, 0.95)' 
              : 'rgba(244, 235, 211, 0.95)',
            borderColor: isUser ? '#98A1BC' : '#DED3C4'
          }}>
            <div className="whitespace-pre-wrap break-words leading-relaxed text-base">
              {message.content}
            </div>
            
            {message.context?.isExchangeRequest && !isUser && (
              <div className="mt-4 p-4 rounded-xl border backdrop-blur-sm" style={{ backgroundColor: 'rgba(222, 211, 196, 0.9)', borderColor: '#DED3C4' }}>
                <div className="flex items-center gap-3 font-medium mb-2" style={{ color: '#555879' }}>
                  <TrendingUp className="w-5 h-5" />
                  Portföljförändring föreslås
                </div>
                <p style={{ color: '#98A1BC' }}>
                  Detta förslag kan påverka din portföljs sammansättning. Överväg riskerna innan du genomför ändringar.
                </p>
              </div>
            )}

            {message.context?.confidence && (
              <div className="mt-3 flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="backdrop-blur-sm border"
                  style={{
                    backgroundColor: message.context.confidence > 0.8 
                      ? 'rgba(152, 161, 188, 0.2)' 
                      : message.context.confidence > 0.6
                      ? 'rgba(222, 211, 196, 0.3)'
                      : 'rgba(85, 88, 121, 0.2)',
                    borderColor: '#DED3C4',
                    color: '#555879'
                  }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {Math.round(message.context.confidence * 100)}% säkerhet
                </Badge>
              </div>
            )}
          </div>
          
          <div className={`text-sm flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`} style={{ color: '#98A1BC' }}>
            <Clock className="w-4 h-4" />
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
