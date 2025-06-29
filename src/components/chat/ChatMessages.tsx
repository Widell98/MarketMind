
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
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm sm:text-base">Laddar chat...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-6 bg-primary shadow-lg">
                <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">
                Hej! Vad kan jag hjälpa dig med idag?
              </h3>
              <p className="text-sm sm:text-base max-w-2xl text-muted-foreground leading-relaxed">
                Ställ frågor om din portfölj, be om analyser eller få personliga investeringsråd. 
                Jag är här för att hjälpa dig att fatta smarta investeringsbeslut!
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-3 sm:gap-4 justify-start">
                  <div className="flex gap-3 max-w-3xl">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-muted shadow-sm">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                    <div className="bg-card border px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm sm:text-base">AI analyserar din förfrågan...</span>
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
      
      <style jsx>{`
        .ai-response strong {
          font-weight: 600;
        }
        .ai-response div {
          margin-bottom: 0.5rem;
        }
        .ai-response div:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export default ChatMessages;
