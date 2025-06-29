
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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-base sm:text-lg">Laddar chat...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mb-6 bg-gradient-to-br from-violet-600 to-purple-600 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-slate-800 dark:text-slate-100">
                Hej! Vad kan jag hjälpa dig med idag?
              </h3>
              <p className="text-base sm:text-lg max-w-2xl text-slate-600 dark:text-slate-300">
                Ställ frågor om din portfölj, be om analyser eller få personliga investeringsråd. 
                Jag är här för att hjälpa dig att fatta smarta investeringsbeslut!
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-4 sm:gap-6 justify-start">
                  <div className="flex gap-3 sm:gap-4 max-w-4xl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl sm:rounded-3xl flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-400 shadow-lg transform -rotate-3">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-lg">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
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
    </div>
  );
};

export default ChatMessages;
