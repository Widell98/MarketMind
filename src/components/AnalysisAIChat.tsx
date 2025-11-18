
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Loader2, Bot, User, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AnalysisAIChatProps {
  analysis: {
    id: string;
    title: string;
    content: string;
    analysis_type: string;
    tags?: string[];
  };
}

const AnalysisAIChat: React.FC<AnalysisAIChatProps> = ({ analysis }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const suggestedQuestions = [
    "Vad är de största riskerna med denna analys?",
    "Finns det alternativa perspektiv att överväga?",
    "Hur kan jag implementera dessa insikter?",
    "Vilka marknadsförändringar kan påverka detta?"
  ];

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage;
    if (!messageToSend.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-market-insights', {
        body: {
          type: 'analysis_discussion',
          context: {
            analysis,
            userQuestion: messageToSend,
            chatHistory: messages.slice(-5)
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
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Diskutera med AI
              <Badge variant="secondary">Beta</Badge>
            </div>
            <Button variant="ghost" size="sm">
              {isExpanded ? 'Minimera' : 'Expandera'}
            </Button>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <p className="text-center text-gray-600 py-4">
              Logga in för att diskutera denna analys med AI
            </p>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Diskutera med AI
            <Badge variant="secondary">Beta</Badge>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? 'Minimera' : 'Expandera'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Lightbulb className="w-4 h-4" />
              Föreslagna frågor:
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left h-auto p-2 text-xs justify-start"
                  onClick={() => handleSendMessage(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-8 h-8 mx-auto mb-2" />
              <p>Ställ frågor om analysen</p>
              <p className="text-xs">AI kan hjälpa dig förstå och implementera insikterna</p>
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
                      <Loader2 className="w-4 h-4" />
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
            placeholder="Ställ en fråga om analysen..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

          <div className="text-xs text-gray-500 text-center">
            AI-assistenten kan hjälpa dig förstå och tillämpa analysens insikter
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AnalysisAIChat;
