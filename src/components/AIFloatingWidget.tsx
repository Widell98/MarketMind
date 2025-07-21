
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  X, 
  Minimize2, 
  Maximize2, 
  Brain,
  Sparkles,
  Send,
  Mic,
  MicOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIFloatingWidget = () => {
  const { user } = useAuth();
  const { riskProfile } = useRiskProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    "Analysera min portfölj",
    "Vad händer på marknaden?",
    "Föreslå investeringar",
    "Visa min risk"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Generate short, focused responses with single recommendations
    setTimeout(() => {
      let responseContent = "";
      const userInput = input.trim().toLowerCase();
      
      if (userInput.includes('portfölj') || userInput.includes('portfolio')) {
        responseContent = "Din portfölj skulle kunna förbättras genom diversifiering. En snabb rekommendation: överväg att lägga till en bred indexfond som XACT OMXS30.\n\nFör en fullständig portföljanalys med flera förslag, fortsätt i huvudchatten →";
      } else if (userInput.includes('marknad') || userInput.includes('market')) {
        responseContent = "Marknaden visar blandade signaler just nu. Kortfattat: teknologisektorn ser stark ut.\n\nFör djup marknadsanalys och fler insikter, låt oss fortsätta i huvudchatten →";
      } else if (userInput.includes('aktie') || userInput.includes('stock') || userInput.includes('köp')) {
        responseContent = "Baserat på din profil skulle jag föreslå Investor B - stabilt investmentbolag med god utdelning.\n\nFör fler aktieförslag och detaljerad analys, fortsätt diskussionen i huvudchatten →";
      } else if (userInput.includes('risk')) {
        responseContent = "Din riskprofil visar konservativ inställning. En snabb tips: håll max 20% i enskilda aktier.\n\nFör komplett riskanalys och strategier, gå till huvudchatten →";
      } else if (userInput.includes('utdelning') || userInput.includes('dividend')) {
        responseContent = "För utdelningsfokus rekommenderar jag Telia - stark direktavkastning på ca 4%.\n\nFler utdelningsaktier och strategier finns i huvudchatten →";
      } else {
        responseContent = `Kort svar: Det beror på din specifika situation och mål.\n\nFör en genomgående diskussion där jag kan ge dig detaljerade råd och flera alternativ, fortsätt i huvudchatten →`;
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1200);
  };

  const handleQuickAction = (action: string) => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    
    // Navigate to full AI chat with pre-filled message
    const event = new CustomEvent('prefillChatInput', {
      detail: { message: action }
    });
    window.dispatchEvent(event);
    window.location.href = '/ai-chat';
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Voice functionality would be implemented here
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Brain className="w-6 h-6 text-white" />
        </Button>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={cn(
        "shadow-2xl border-2 border-primary/20 transition-all duration-300 overflow-hidden",
        isMinimized ? "w-80 h-16" : "w-96 h-[500px]"
      )}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Snabb AI-Assistent</h3>
              {!isMinimized && (
                <p className="text-xs opacity-80">
                  {user ? `Hej ${user.email?.split('@')[0]}!` : 'Logga in för personlig hjälp'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 h-80">
              {messages.length === 0 ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Snabba svar & råd!</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Ställ enkla frågor här. För djupare analyser:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          onClick={() => handleQuickAction(action)}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 justify-start group hover:bg-primary hover:text-primary-foreground"
                        >
                          <MessageSquare className="w-3 h-3 mr-2 group-hover:animate-pulse" />
                          {action}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={() => window.location.href = '/ai-chat'}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-xs text-primary hover:bg-primary/10"
                    >
                      Öppna huvudchatt för djupare analys →
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}>
                        <div className="whitespace-pre-line">{message.content}</div>
                        {message.role === 'assistant' && (
                          <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                            <Button
                              onClick={() => window.location.href = '/ai-chat'}
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-primary hover:bg-primary/20 p-1"
                            >
                              Fortsätt i huvudchatt →
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-background">
              {!user ? (
                <Button
                  onClick={() => window.location.href = '/auth'}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 text-white"
                  size="sm"
                >
                  Logga in för att chatta
                </Button>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ställ en snabb fråga..."
                      className="resize-none h-10 pr-12 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={toggleVoice}
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 w-8 h-8 p-0"
                    >
                      {isListening ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="w-10 h-10 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIFloatingWidget;
