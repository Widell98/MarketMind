
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
        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 max-w-5xl mx-auto">
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="text-sm">Laddar chat...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 text-center px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 bg-primary shadow-lg">
                <Bot className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-foreground">
                Hej! Vad kan jag hjälpa dig med idag?
              </h3>
              <p className="text-sm sm:text-base max-w-md sm:max-w-2xl text-muted-foreground leading-relaxed">
                Ställ frågor om din portfölj, be om analyser eller få personliga investeringsråd. 
                Jag är här för att hjälpa dig att fatta smarta investeringsbeslut!
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-2 sm:gap-3 justify-start">
                  <div className="flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-3xl">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-muted shadow-sm">
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                    <div className="bg-card border px-3 py-2 sm:py-2.5 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        <span className="text-sm">AI analyserar din förfrågan...</span>
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
