
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

  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const currentSession = sessions.find(s => s.id === currentSessionId);
      console.log('Current active session:', currentSession?.session_name);
    }
  }, [currentSessionId, sessions]);

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

  // Function to format AI response with better styling
  const formatAIResponse = (content: string) => {
    // Split by common patterns and add styling
    const sections = content.split(/###|\*\*/).filter(section => section.trim());
    
    return (
      <div className="space-y-3">
        {sections.map((section, index) => {
          const trimmedSection = section.trim();
          
          // Skip empty sections
          if (!trimmedSection) return null;
          
          // Check if it's a heading (contains numbers like "1.", "2." etc)
          if (/^\d+\./.test(trimmedSection)) {
            const [title, ...contentParts] = trimmedSection.split('\n');
            return (
              <div key={index} className="mb-4">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                    {title.match(/^\d+/)?.[0]}
                  </span>
                  {title.replace(/^\d+\.\s*/, '')}
                </h4>
                <div className="text-sm text-gray-700 leading-relaxed pl-8">
                  {contentParts.join('\n').trim()}
                </div>
              </div>
            );
          }
          
          // Check if it's a bullet point list
          if (trimmedSection.includes('- ')) {
            const lines = trimmedSection.split('\n');
            return (
              <div key={index} className="space-y-2">
                {lines.map((line, lineIndex) => {
                  if (line.trim().startsWith('- ')) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-2 text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{line.trim().substring(2)}</span>
                      </div>
                    );
                  }
                  return line.trim() ? (
                    <p key={lineIndex} className="text-sm text-gray-700 leading-relaxed">
                      {line.trim()}
                    </p>
                  ) : null;
                })}
              </div>
            );
          }
          
          // Regular paragraph
          return (
            <p key={index} className="text-sm text-gray-700 leading-relaxed">
              {trimmedSection}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full max-w-full">
      <Card className="h-[600px] sm:h-[700px] flex flex-col w-full">
        <CardHeader className="flex-shrink-0 p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
            <span className="truncate">AI Portfolio Assistent</span>
            {!isPremium && (
              <Badge variant="outline" className="text-xs ml-auto">
                {remainingMessages === Infinity ? '∞' : remainingMessages} kvar
              </Badge>
            )}
            {currentSessionId && (
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                Aktiv chat
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {isPremium ? 
              'Obegränsad AI-analys med djupgående portföljinsikter' :
              'Begränsad till 5 AI-meddelanden och analyser per dag'
            }
          </CardDescription>
          
          {!isPremium && (remainingMessages <= 2 || remainingAnalyses <= 2) && (
            <Alert className="border-orange-200 bg-orange-50">
              <Crown className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm">Du har få AI-användningar kvar idag</span>
                  <Button 
                    size="sm" 
                    className="text-xs"
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
              <AlertDescription className="text-orange-800 text-xs sm:text-sm">
                <strong>OpenAI API-kvot överskriden:</strong> Du har nått din dagliga gräns för AI-användning. 
                Kontrollera din OpenAI-fakturering eller försök igen senare.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="w-full">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
                <TabsTrigger 
                  value="analysis" 
                  disabled={quotaExceeded || (remainingAnalyses <= 0 && !isPremium)}
                  className="text-xs sm:text-sm"
                >
                  Analys {!isPremium && `(${remainingAnalyses})`}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="mt-3 sm:mt-4">
                <div className="flex gap-1 sm:gap-2 flex-wrap">
                  {quickQuestions.map((q, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={q.action}
                      disabled={isLoading || quotaExceeded}
                      className="text-xs px-2 py-1 sm:px-3 sm:py-2 flex-1 min-w-0"
                    >
                      <span className="truncate">{q.text}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-3 sm:mt-4">
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
                        className={`flex flex-col h-12 sm:h-16 p-2 ${selectedAnalysis === analysis.type ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${analysis.color}`} />
                        <span className="text-xs font-medium truncate">{analysis.title}</span>
                      </Button>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 p-3 sm:p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 sm:py-8">
                <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <h3 className="text-base sm:text-lg font-medium mb-2">Välkommen!</h3>
                <p className="text-xs sm:text-sm mb-3 sm:mb-4 px-2">
                  {isPremium ? 
                    'Nu med obegränsad AI-analys och djupare insikter.' :
                    `Du har ${remainingMessages} AI-meddelanden kvar idag.`
                  }
                </p>
                <div className="text-xs text-muted-foreground px-2">
                  {quotaExceeded ? 
                    'AI-funktioner är tillfälligt otillgängliga på grund av API-kvotgräns.' :
                    'Använd snabbknapparna ovan eller ställ dina egna frågor nedan.'
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 sm:p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 text-foreground shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.role === 'assistant' ? 
                          formatAIResponse(message.content) : 
                          <span className="text-xs sm:text-sm">{message.content}</span>
                        }
                      </div>
                      <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 border-t border-opacity-20">
                        <div className={`text-xs opacity-70 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex gap-1">
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
                  </div>
                ))}
                {(isLoading || isAnalyzing) && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 p-3 sm:p-4 rounded-lg flex items-center gap-3 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-xs sm:text-sm text-gray-700">
                        {isAnalyzing ? 'Analyserar portfölj...' : 'AI-assistenten tänker...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="border-t p-3 sm:p-4 flex-shrink-0">
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
                className="flex-1 text-xs sm:text-sm"
              />
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading || isAnalyzing || quotaExceeded || (remainingMessages <= 0 && !isPremium)}
                size="icon"
                className="flex-shrink-0"
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
    </div>
  );
};

export default AIChat;
