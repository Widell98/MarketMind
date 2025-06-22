
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Send, Loader2, MessageSquare, BarChart3, Shield, TrendingUp, Zap, AlertCircle, Crown } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { useSubscription } from '@/hooks/useSubscription';

interface AIChatProps {
  portfolioId?: string;
}

const AIChat: React.FC<AIChatProps> = ({ portfolioId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const { 
    messages, 
    sessions, 
    currentSessionId,
    isLoading, 
    isAnalyzing,
    quotaExceeded,
    sendMessage, 
    analyzePortfolio,
    createNewSession,
    loadSession,
    clearMessages,
    getQuickAnalysis
  } = useAIChat(portfolioId);

  const { subscription, usage, getRemainingUsage, createCheckout } = useSubscription();
  
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
    if (!inputMessage.trim() || isLoading || quotaExceeded) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleQuickAnalysis = async (type: 'risk' | 'diversification' | 'performance' | 'optimization') => {
    if (quotaExceeded) return;
    setSelectedAnalysis(type);
    await analyzePortfolio(type);
    setSelectedAnalysis(null);
  };

  const isPremium = subscription?.subscribed;
  const remainingMessages = getRemainingUsage('ai_message');
  const remainingAnalyses = getRemainingUsage('analysis');

  const quickQuestions = [
    { text: "Hur mår min portfölj just nu?", action: () => getQuickAnalysis("Ge mig en snabb översikt över hur min portfölj mår just nu") },
    { text: "Vilka risker finns i mina innehav?", action: () => getQuickAnalysis("Identifiera de största riskerna i min nuvarande portfölj") },
    { text: "Borde jag rebalansera?", action: () => getQuickAnalysis("Analysera om jag borde rebalansera min portfölj och varför") },
    { text: "Vad händer på marknaden?", action: () => getQuickAnalysis("Ge mig en uppdatering om vad som händer på finansmarknaderna som kan påverka mig") }
  ];

  const analysisTypes = [
    { 
      type: 'risk' as const, 
      icon: Shield, 
      title: 'Riskanalys', 
      description: 'Djup analys av portföljrisker',
      color: 'text-red-600' 
    },
    { 
      type: 'diversification' as const, 
      icon: BarChart3, 
      title: 'Diversifiering', 
      description: 'Utvärdera spridning',
      color: 'text-blue-600' 
    },
    { 
      type: 'performance' as const, 
      icon: TrendingUp, 
      title: 'Prestanda', 
      description: 'Analysera avkastning',
      color: 'text-green-600' 
    },
    { 
      type: 'optimization' as const, 
      icon: Zap, 
      title: 'Optimering', 
      description: 'Förbättringsförslag',
      color: 'text-purple-600' 
    }
  ];

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Portfolio Assistent
          {!isPremium && (
            <Badge variant="outline" className="text-xs">
              {remainingMessages === Infinity ? '∞' : remainingMessages} meddelanden kvar
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isPremium ? 
            'Obegränsad AI-analys med djupgående portföljinsikter' :
            'Begränsad till 5 AI-meddelanden och analyser per dag'
          }
        </CardDescription>
        
        {!isPremium && (remainingMessages <= 2 || remainingAnalyses <= 2) && (
          <Alert className="border-orange-200 bg-orange-50">
            <Crown className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <span>Du har få AI-användningar kvar idag</span>
                <Button 
                  size="sm" 
                  className="ml-2"
                  onClick={() => createCheckout('premium')}
                >
                  Uppgradera nu
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {quotaExceeded && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>OpenAI API-kvot överskriden:</strong> Du har nått din dagliga gräns för AI-användning. 
              Kontrollera din OpenAI-fakturering eller försök igen senare.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="analysis" disabled={quotaExceeded || (remainingAnalyses <= 0 && !isPremium)}>
              Analys {!isPremium && `(${remainingAnalyses})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="mt-4">
            <div className="flex gap-2 flex-wrap">
              {quickQuestions.map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={q.action}
                  disabled={isLoading || quotaExceeded}
                  className="text-xs"
                >
                  {q.text}
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {analysisTypes.map((analysis) => {
                const Icon = analysis.icon;
                return (
                  <Button
                    key={analysis.type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAnalysis(analysis.type)}
                    disabled={isAnalyzing || quotaExceeded}
                    className={`flex flex-col h-16 ${selectedAnalysis === analysis.type ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${analysis.color}`} />
                    <span className="text-xs font-medium">{analysis.title}</span>
                  </Button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Välkommen!</h3>
              <p className="text-sm mb-4">
                {isPremium ? 
                  'Nu med obegränsad AI-analys och djupare insikter.' :
                  `Du har ${remainingMessages} AI-meddelanden kvar idag.`
                }
              </p>
              <div className="text-xs text-muted-foreground">
                {quotaExceeded ? 
                  'AI-funktioner är tillfälligt otillgängliga på grund av API-kvotgräns.' :
                  'Använd snabbknapparna ovan eller ställ dina egna frågor nedan.'
                }
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
                    className={`max-w-[85%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className={`text-xs opacity-70`}>
                        {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {message.context?.analysisType && (
                        <Badge variant="secondary" className="text-xs">
                          {message.context.analysisType}
                        </Badge>
                      )}
                      {message.context?.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(message.context.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(isLoading || isAnalyzing) && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      {isAnalyzing ? 'Analyserar portfölj...' : 'AI-assistenten tänker...'}
                    </span>
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
              placeholder={
                quotaExceeded ? "AI-funktioner är tillfälligt otillgängliga..." :
                remainingMessages <= 0 && !isPremium ? "Daglig gräns nådd. Uppgradera för obegränsad användning." :
                "Ställ en avancerad fråga om din portfölj..."
              }
              disabled={isLoading || isAnalyzing || quotaExceeded || (remainingMessages <= 0 && !isPremium)}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!inputMessage.trim() || isLoading || isAnalyzing || quotaExceeded || (remainingMessages <= 0 && !isPremium)}
              size="icon"
            >
              {(isLoading || isAnalyzing) ? (
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
