
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
        <div className="p-4 space-y-4 max-w-6xl mx-auto">
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Laddar chat...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-slate-700">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900">
                Hej! Vad kan jag hjälpa dig med idag?
              </h3>
              <p className="text-slate-600 max-w-md">
                Ställ frågor om din portfölj eller få personliga investeringsråd.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-4xl">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-700">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
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
