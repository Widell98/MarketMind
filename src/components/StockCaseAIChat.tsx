
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Loader2, Bot, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface StockCaseAIChatProps {
  stockCase: {
    id: string;
    title: string;
    company_name: string;
    sector?: string;
    current_price?: number;
    target_price?: number;
    description?: string;
  };
}

const StockCaseAIChat: React.FC<StockCaseAIChatProps> = ({ stockCase }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: {
          type: 'stock_case_analysis',
          context: {
            stockCase,
            userQuestion: inputMessage,
            chatHistory: messages.slice(-5) // Send last 5 messages for context
          }
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response || 'Jag kunde inte generera ett svar just nu.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: "Fel",
        description: "Kunde inte få svar från AI-assistenten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI-assistent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 py-4">
            Logga in för att chatta med AI om detta stock case
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI-assistent
            <Badge variant="secondary">Beta</Badge>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? 'Minimera' : 'Expandera'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-8 h-8 mx-auto mb-2" />
                  <p>Ställ frågor om {stockCase.company_name}</p>
                  <p className="text-xs">AI kan hjälpa med analys, risker och möjligheter</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="flex-shrink-0">
                          {message.type === 'user' ? (
                            <User className="w-6 h-6 p-1 bg-blue-100 text-blue-600 rounded-full" />
                          ) : (
                            <Bot className="w-6 h-6 p-1 bg-purple-100 text-purple-600 rounded-full" />
                          )}
                        </div>
                        <div
                          className={`rounded-lg p-3 text-sm ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="flex gap-2">
                        <Bot className="w-6 h-6 p-1 bg-purple-100 text-purple-600 rounded-full" />
                        <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Fråga AI om detta stock case..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              AI-assistenten använder information om {stockCase.company_name} för att svara på dina frågor
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default StockCaseAIChat;
