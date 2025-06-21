
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Loader2, MessageSquare } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';

interface AIChatProps {
  portfolioId?: string;
}

const AIChat: React.FC<AIChatProps> = ({ portfolioId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat(portfolioId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const suggestedQuestions = [
    "Hur är min portfölj diversifierad?",
    "Vilka risker ser du i mina innehav?",
    "Vad tycker du om min tillgångsfördelning?",
    "Borde jag ändra något i min portfölj?"
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Portfolio Assistent
        </CardTitle>
        <CardDescription>
          Ställ frågor om din portfölj och få personlig rådgivning
        </CardDescription>
        {messages.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearMessages}
            className="w-fit"
          >
            Rensa chat
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Välkommen till AI-assistenten!</h3>
              <p className="text-sm mb-4">
                Jag kan hjälpa dig analysera din portfölj och svara på investeringsfrågor.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium">Förslag på frågor:</p>
                <div className="space-y-1">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto p-2 text-left justify-start w-full"
                      onClick={() => setInputMessage(question)}
                    >
                      "{question}"
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 opacity-70`}>
                      {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI-assistenten tänker...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Skriv din fråga här..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;
