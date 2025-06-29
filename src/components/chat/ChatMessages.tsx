
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2 } from 'lucide-react';
import ChatMessage from './ChatMessage';

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

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingSession: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, isLoading, isLoadingSession, messagesEndRef }: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6 xl:p-8 space-y-8 max-w-6xl mx-auto">
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-4" style={{ color: '#98A1BC' }}>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-lg">Laddar chat...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
                <Bot className="w-12 h-12 text-[#F4EBD3]" />
              </div>
              <h3 className="text-3xl font-bold mb-4" style={{ color: '#555879' }}>
                Hej! Vad kan jag hjälpa dig med idag?
              </h3>
              <p className="text-lg max-w-2xl" style={{ color: '#98A1BC' }}>
                Ställ frågor om din portfölj, be om analyser eller få personliga investeringsråd. 
                Jag är här för att hjälpa dig att fatta smarta investeringsbeslut!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-6 justify-start">
                  <div className="flex gap-4 max-w-4xl">
                    <div className="w-12 h-12 rounded-3xl flex items-center justify-center shadow-lg transform -rotate-3" style={{ background: 'linear-gradient(135deg, #98A1BC, #DED3C4)' }}>
                      <Bot className="w-6 h-6" style={{ color: '#555879' }} />
                    </div>
                    <div className="backdrop-blur-sm border px-6 py-4 rounded-2xl shadow-lg" style={{ backgroundColor: 'rgba(244, 235, 211, 0.95)', borderColor: '#DED3C4' }}>
                      <div className="flex items-center gap-3" style={{ color: '#98A1BC' }}>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-base">AI analyserar din förfrågan...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatMessages;
