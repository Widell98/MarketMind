import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const { usage, subscription } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentUsage = usage?.ai_messages_count || 0;
  const isPremium = subscription?.subscribed;
  const dailyLimit = 5;

  const quickActions = [
    'Analysera min portfölj',
    'Vad händer på marknaden?',
    'Föreslå investeringar',
    'Visa min risk'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !user || isLoading) return;

    // Check usage limits for free users
    if (!isPremium && currentUsage >= dailyLimit) {
      toast({
        title: "Daglig gräns nådd",
        description: "Du har nått din dagliga gräns för AI-meddelanden. Uppgradera till Premium för obegränsad användning.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a very focused prompt for the floating widget - SHORT ANSWERS ONLY
      const systemPrompt = `Du är en snabb AI-assistent för investeringar. 

KRITISKA REGLER:
- Svara ENDAST med 2-3 korta meningar (max 70 ord)
- Ge snabba, direkta svar utan långa förklaringar
- Ingen djup analys eller långa texter

Användarens riskprofil: ${riskProfile ? `${riskProfile.risk_tolerance} risk` : 'Okänd'}

Ge ett kortfattat, snabbt svar på investeringsfrågan.`;

      console.log('Calling quick-ai-assistant function...');

      const { data, error } = await supabase.functions.invoke('quick-ai-assistant', {
        body: {
          message: input.trim(),
          userId: user.id,
          systemPrompt,
          model: 'gpt-4o-mini',
          maxTokens: 50,
          temperature: 0.3
        }
      });

      if (error) {
        console.error('Quick AI Assistant Error:', error);
        throw new Error(error.message || 'Fel vid AI-anrop');
      }

      console.log('Quick AI Assistant response:', data);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Kunde inte generera svar. → Gå till AI-chatten för mer info',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('AI error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Något gick fel. → Gå till AI-chatten för mer hjälp',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "AI-fel",
        description: "Kunde inte få svar från AI-assistenten. Försök igen eller gå till AI-chat sidan.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, user, isLoading, riskProfile, isPremium, currentUsage, dailyLimit, toast]);

  const handleQuickAction = (action: string) => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    // Redirect to AI chat page with the action as a message parameter
    const encodedMessage = encodeURIComponent(action);
    window.location.href = `/ai-chat?message=${encodedMessage}`;
  };

  const toggleVoice = () => setIsListening(prev => !prev);

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-6 md:bottom-6 md:right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:scale-105 shadow-lg"
        >
          <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </Button>
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-2 h-2 md:w-3 md:h-3 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
      <Card className={cn('shadow-2xl border-2 border-primary/20 transition-all duration-300', isMinimized ? 'w-72 md:w-80 h-14 md:h-16' : 'w-80 md:w-96 h-[450px] md:h-[500px]')}>
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-2 md:p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="w-3 h-3 md:w-4 md:h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs md:text-sm">Snabb AI-Assistent</h3>
              {!isMinimized && <p className="text-xs opacity-80 hidden md:block">{user ? `Hej ${user.email?.split('@')[0]}!` : 'Logga in för personlig hjälp'}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button onClick={() => setIsMinimized(!isMinimized)} variant="ghost" size="sm" className="w-6 h-6 md:w-8 md:h-8 p-0 text-white hover:bg-white/20">
              {isMinimized ? <Maximize2 className="w-3 h-3 md:w-4 md:h-4" /> : <Minimize2 className="w-3 h-3 md:w-4 md:h-4" />}
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="w-6 h-6 md:w-8 md:h-8 p-0 text-white hover:bg-white/20">
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 h-64 md:h-80">
              {messages.length === 0 ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Snabba investeringsråd!</h4>
                    <p className="text-xs text-muted-foreground mb-3">Ställ enkla investeringsfrågor här. För djupare analyser:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickActions.map((action, i) => (
                        <Button key={i} onClick={() => handleQuickAction(action)} variant="outline" size="sm" className="text-xs h-8 justify-start">
                          <MessageSquare className="w-3 h-3 mr-2" />{action}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[85%] rounded-lg px-3 py-2 text-sm', msg.role === 'user' ? 'bg-primary text-white' : 'bg-muted')}>{msg.content}</div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-2 md:p-3 border-t bg-background">
              {!user ? (
                <Button onClick={() => window.location.href = '/auth'} className="w-full bg-gradient-to-r from-primary to-blue-600 text-white" size="sm">
                  Logga in för att chatta
                </Button>
              ) : !isPremium && currentUsage >= dailyLimit ? (
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Daglig gräns nådd ({currentUsage}/{dailyLimit})</p>
                  <Button onClick={() => window.location.href = '/profile'} className="w-full" size="sm" variant="outline">
                    Uppgradera till Premium
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ställ en snabb investeringsfråga..."
                      className="resize-none h-10 pr-12 text-sm"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={toggleVoice} variant="ghost" size="sm" className="absolute right-1 top-1 w-8 h-8 p-0">
                      {isListening ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading} size="sm" className="w-10 h-10 p-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {user && !isPremium && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {currentUsage}/{dailyLimit} meddelanden idag
                </p>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIFloatingWidget;
