import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User, CheckCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  profileUpdates?: ProfileUpdate[];
}

interface ProfileUpdate {
  field: string;
  oldValue: any;
  newValue: any;
  description: string;
}

const ProfileAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { riskProfile, saveRiskProfile, refetch } = useRiskProfile();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Parse user message for profile updates
  const parseProfileUpdates = (message: string): ProfileUpdate[] => {
    const updates: ProfileUpdate[] = [];
    const lowerMessage = message.toLowerCase();

    // Parse monthly savings changes
    const monthlySavingsPattern = /(öka|höja|minska|sänka|ändra).*månad.*sparande.*?(\d+[\s,]*\d*)\s*(kr|sek|kronor)/i;
    const monthlySavingsMatch = message.match(monthlySavingsPattern);
    
    if (monthlySavingsMatch) {
      const action = monthlySavingsMatch[1].toLowerCase();
      const amount = parseInt(monthlySavingsMatch[2].replace(/[\s,]/g, ''));
      const currentAmount = riskProfile?.monthly_investment_amount || 0;
      
      let newAmount = amount;
      if (action.includes('öka') || action.includes('höja')) {
        newAmount = currentAmount + amount;
      } else if (action.includes('minska') || action.includes('sänka')) {
        newAmount = Math.max(0, currentAmount - amount);
      }

      updates.push({
        field: 'monthly_investment_amount',
        oldValue: currentAmount,
        newValue: newAmount,
        description: `Månadssparande ändrat från ${currentAmount.toLocaleString()} SEK till ${newAmount.toLocaleString()} SEK`
      });
    }

    // Parse age updates
    const agePattern = /(?:är|age|ålder).*?(\d{2,3})\s*(?:år|years|old)/i;
    const ageMatch = message.match(agePattern);
    
    if (ageMatch) {
      const newAge = parseInt(ageMatch[1]);
      if (newAge >= 18 && newAge <= 100) {
        updates.push({
          field: 'age',
          oldValue: riskProfile?.age,
          newValue: newAge,
          description: `Ålder uppdaterad till ${newAge} år`
        });
      }
    }

    // Parse income updates
    const incomePattern = /(årsinkomst|lön|income).*?(\d+[\s,]*\d*)\s*(kr|sek|kronor)/i;
    const incomeMatch = message.match(incomePattern);
    
    if (incomeMatch) {
      const newIncome = parseInt(incomeMatch[2].replace(/[\s,]/g, ''));
      updates.push({
        field: 'annual_income',
        oldValue: riskProfile?.annual_income,
        newValue: newIncome,
        description: `Årsinkomst uppdaterad till ${newIncome.toLocaleString()} SEK`
      });
    }

    // Parse risk tolerance updates
    const riskPatterns = [
      { pattern: /(konservativ|låg risk|säker)/i, value: 'conservative', label: 'Konservativ' },
      { pattern: /(måttlig|medel|balanserad)/i, value: 'moderate', label: 'Måttlig' },
      { pattern: /(aggressiv|hög risk|riskabel)/i, value: 'aggressive', label: 'Aggressiv' }
    ];

    for (const riskPattern of riskPatterns) {
      if (lowerMessage.match(riskPattern.pattern) && lowerMessage.includes('risk')) {
        updates.push({
          field: 'risk_tolerance',
          oldValue: riskProfile?.risk_tolerance,
          newValue: riskPattern.value,
          description: `Risktolerans ändrad till ${riskPattern.label}`
        });
        break;
      }
    }

    // Parse investment horizon updates
    const horizonPatterns = [
      { pattern: /(kort|1-3|kortsiktig)/i, value: 'short', label: 'Kort (1-3 år)' },
      { pattern: /(medel|3-7|mellanlång)/i, value: 'medium', label: 'Medel (3-7 år)' },
      { pattern: /(lång|7\+|långsiktig|över 7)/i, value: 'long', label: 'Lång (7+ år)' }
    ];

    for (const horizonPattern of horizonPatterns) {
      if (lowerMessage.match(horizonPattern.pattern) && (lowerMessage.includes('horisont') || lowerMessage.includes('sikt'))) {
        updates.push({
          field: 'investment_horizon',
          oldValue: riskProfile?.investment_horizon,
          newValue: horizonPattern.value,
          description: `Investeringshorisont ändrad till ${horizonPattern.label}`
        });
        break;
      }
    }

    return updates;
  };

  // Apply profile updates to the database
  const applyProfileUpdates = async (updates: ProfileUpdate[]) => {
    if (!riskProfile || updates.length === 0) return;

    try {
      const updatedProfile = { ...riskProfile };
      
      updates.forEach(update => {
        (updatedProfile as any)[update.field] = update.newValue;
      });

      await saveRiskProfile(updatedProfile);
      await refetch();

      toast({
        title: "Profil uppdaterad automatiskt",
        description: `${updates.length} ${updates.length === 1 ? 'ändring' : 'ändringar'} har tillämpats på din investeringsprofil`,
      });
    } catch (error) {
      console.error('Error applying profile updates:', error);
      toast({
        title: "Fel vid uppdatering",
        description: "Kunde inte uppdatera profilen automatiskt",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    // Parse for profile updates
    const profileUpdates = parseProfileUpdates(input.trim());
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call AI assistant
      const { data, error } = await supabase.functions.invoke('quick-ai-assistant', {
        body: {
          message: input.trim(),
          userId: user.id,
          systemPrompt: `Du är en personlig finansiell rådgivare. Användaren diskuterar sin investeringsprofil. 
          
          Användarens nuvarande profil:
          - Månadssparande: ${riskProfile?.monthly_investment_amount || 'Ej angiven'} SEK
          - Risktolerans: ${riskProfile?.risk_tolerance || 'Ej angiven'}
          - Tidshorisont: ${riskProfile?.investment_horizon || 'Ej angiven'}
          - Ålder: ${riskProfile?.age || 'Ej angiven'} år
          - Årsinkomst: ${riskProfile?.annual_income || 'Ej angiven'} SEK
          
          Svara på svenska och ge personliga råd baserat på användarens profil. Om användaren nämner ändringar i sin ekonomiska situation, bekräfta ändringarna och ge relevant rådgivning.`,
          model: 'gpt-4o-mini',
          maxTokens: 500,
          temperature: 0.7
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'Tyvärr kunde jag inte generera ett svar just nu.',
        timestamp: new Date(),
        profileUpdates
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Apply profile updates if any were detected
      if (profileUpdates.length > 0) {
        await applyProfileUpdates(profileUpdates);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Tyvärr uppstod ett fel. Försök igen senare.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-br from-background via-background to-blue-50/30 dark:to-blue-950/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          AI Profilassistent
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            Smart Uppdatering
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Diskutera ändringar i din ekonomiska situation så uppdateras din profil automatiskt
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Messages */}
        <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-card rounded-xl border">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm">Börja en konversation om din investeringsprofil</p>
              <p className="text-xs mt-2">Exempel: "Jag vill öka mitt månadssparande med 5000 kr"</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'} rounded-2xl p-3`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Show profile updates */}
                {message.profileUpdates && message.profileUpdates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Profil automatiskt uppdaterad:
                    </p>
                    <div className="space-y-1">
                      {message.profileUpdates.map((update, index) => (
                        <div key={index} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-2 rounded">
                          {update.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted/50 rounded-2xl p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Berätta om ändringar i din ekonomiska situation..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileAIChat;