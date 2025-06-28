
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Send, Loader2, MessageSquare, BarChart3, Shield, TrendingUp, Zap, AlertCircle, Crown, Lock, Plus, Clock } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { useSubscription } from '@/hooks/useSubscription';
import ChatHistory from './ChatHistory';

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
    isLoadingSession,
    quotaExceeded,
    sendMessage, 
    analyzePortfolio,
    createNewSession,
    loadSession,
    deleteSession,
    clearMessages,
    getQuickAnalysis
  } = useAIChat(portfolioId);

  const { subscription, usage, getRemainingUsage, createCheckout, fetchUsage } = useSubscription();
  
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
      console.log('Messages in current session:', messages.length);
    }
  }, [currentSessionId, sessions, messages]);

  useEffect(() => {
    fetchUsage();
  }, [messages.length, fetchUsage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || quotaExceeded) return;

    const remainingMessages = getRemainingUsage('ai_message');
    const isPremium = subscription?.subscribed;

    if (!isPremium && remainingMessages <= 0) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleQuickAnalysis = async (type: 'risk' | 'diversification' | 'performance' | 'optimization') => {
    if (quotaExceeded) return;
    
    const remainingAnalyses = getRemainingUsage('analysis');
    const isPremium = subscription?.subscribed;

    if (!isPremium && remainingAnalyses <= 0) {
      return;
    }

    setSelectedAnalysis(type);
    await analyzePortfolio(type);
    setSelectedAnalysis(null);
  };

  const handleQuickQuestion = async (prompt: string) => {
    const remainingMessages = getRemainingUsage('ai_message');
    const isPremium = subscription?.subscribed;

    if (!isPremium && remainingMessages <= 0) {
      return;
    }

    await getQuickAnalysis(prompt);
  };

  const handleLoadSession = async (sessionId: string) => {
    console.log('Loading session from ChatHistory:', sessionId);
    await loadSession(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    console.log('Deleting session from ChatHistory:', sessionId);
    await deleteSession(sessionId);
  };

  const handleCreateNewSession = async () => {
    console.log('Creating new session...');
    await createNewSession();
  };

  const isPremium = subscription?.subscribed;
  const remainingMessages = getRemainingUsage('ai_message');
  const remainingAnalyses = getRemainingUsage('analysis');

  const quickQuestions = [
    { text: "Hur mår min portfölj just nu?", action: () => handleQuickQuestion("Ge mig en snabb översikt över hur min portfölj mår just nu") },
    { text: "Vilka risker finns i mina innehav?", action: () => handleQuickQuestion("Identifiera de största riskerna i min nuvarande portfölj") },
    { text: "Borde jag rebalansera?", action: () => handleQuickQuestion("Analysera om jag borde rebalansera min portfölj och varför") },
    { text: "Vad händer på marknaden?", action: () => handleQuickQuestion("Ge mig en uppdatering om vad som händer på finansmarknaderna som kan påverka mig") }
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

  const formatAIResponse = (content: string) => {
    const sections = content.split(/###|\*\*/).filter(section => section.trim());
    
    return (
      <div className="space-y-3">
        {sections.map((section, index) => {
          const trimmedSection = section.trim();
          
          if (!trimmedSection) return null;
          
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
          
          return (
            <p key={index} className="text-sm text-gray-700 leading-relaxed">
              {trimmedSection}
            </p>
          );
        })}
      </div>
    );
  };

  const isAtMessageLimit = !isPremium && remainingMessages <= 0;
  const isAtAnalysisLimit = !isPremium && remainingAnalyses <= 0;

  const currentSessionName = currentSessionId && sessions.length > 0 
    ? sessions.find(s => s.id === currentSessionId)?.session_name 
    : null;

  return (
    <div className="w-full h-full max-w-full">
      <Card className="h-[600px] sm:h-[700px] flex flex-col w-full">
        <CardHeader className="flex-shrink-0 p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span className="truncate">AI Portfolio Assistent</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <ChatHistory 
                sessions={sessions}
                currentSessionId={currentSessionId}
                onLoadSession={handleLoadSession}
                onDeleteSession={handleDeleteSession}
                isLoadingSession={isLoadingSession}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateNewSession}
                className="flex items-center gap-1"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ny Chat</span>
              </Button>
            </div>
          </div>

          {/* Daily Usage Display */}
          <div className="mb-4">
            {isPremium ? (
              <Badge variant="default" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Premium - Obegränsad användning
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant={remainingMessages <= 2 ? "destructive" : "outline"} className="text-xs">
                  {remainingMessages}/5 meddelanden kvar idag
                </Badge>
                <Badge variant={remainingAnalyses <= 1 ? "destructive" : "outline"} className="text-xs">
                  {remainingAnalyses}/3 analyser kvar idag
                </Badge>
              </div>
            )}
          </div>
          
          <CardDescription className="text-xs sm:text-sm">
            {isPremium ? 
              'Obegränsad AI-analys med djupgående portföljinsikter' :
              'Gratis användare har 5 meddelanden och 3 analyser per dag'
            }
            {currentSessionName && (
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600 font-medium text-xs sm:text-sm">
                  {currentSessionName}
                </span>
                {isLoadingSession && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Laddar...</span>
                  </div>
                )}
              </div>
            )}
          </CardDescription>
          
          {/* Usage Limit Alerts */}
          {!isPremium && isAtMessageLimit && (
            <Alert className="border-red-200 bg-red-50 mt-3">
              <Lock className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm">
                    <strong>Daglig gräns nådd:</strong> Du har använt alla dina 5 gratis AI-meddelanden för idag.
                  </span>
                  <Button 
                    size="sm" 
                    className="text-xs bg-red-600 hover:bg-red-700"
                    onClick={() => createCheckout('premium')}
                  >
                    Uppgradera nu
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!isPremium && !isAtMessageLimit && remainingMessages <= 2 && (
            <Alert className="border-orange-200 bg-orange-50 mt-3">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm">
                    <strong>Få meddelanden kvar:</strong> Du har {remainingMessages} AI-meddelanden kvar idag.
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                    onClick={() => createCheckout('premium')}
                  >
                    Uppgradera
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {quotaExceeded && (
            <Alert className="border-red-200 bg-red-50 mt-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-xs sm:text-sm">
                <strong>OpenAI API-kvot överskriden:</strong> Du har nått din dagliga gräns för AI-användning. 
                Kontrollera din OpenAI-fakturering eller försök igen senare.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="w-full mt-4">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="text-xs sm:text-sm" disabled={isAtMessageLimit}>
                  Chat {!isPremium && `(${remainingMessages})`}
                  {isAtMessageLimit && <Lock className="w-3 h-3 ml-1" />}
                </TabsTrigger>
                <TabsTrigger 
                  value="analysis" 
                  disabled={quotaExceeded || isAtAnalysisLimit}
                  className="text-xs sm:text-sm"
                >
                  Analys {!isPremium && `(${remainingAnalyses})`}
                  {isAtAnalysisLimit && <Lock className="w-3 h-3 ml-1" />}
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
                      disabled={isLoading || quotaExceeded || isAtMessageLimit}
                      className="text-xs px-2 py-1 sm:px-3 sm:py-2 flex-1 min-w-0 relative"
                    >
                      {isAtMessageLimit && <Lock className="w-3 h-3 mr-1 text-gray-400" />}
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
                        disabled={isAnalyzing || quotaExceeded || isAtAnalysisLimit}
                        className={`flex flex-col h-12 sm:h-16 p-2 relative ${selectedAnalysis === analysis.type ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        {isAtAnalysisLimit && <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-400" />}
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
                <h3 className="text-base sm:text-lg font-medium mb-2">
                  {currentSessionName ? `${currentSessionName}` : 'Välkommen!'}
                </h3>
                <p className="text-xs sm:text-sm mb-3 sm:mb-4 px-2">
                  {isPremium ? 
                    'Nu med obegränsad AI-analys och djupare insikter.' :
                    `Du har ${remainingMessages} AI-meddelanden kvar idag.`
                  }
                </p>
                <div className="text-xs text-muted-foreground px-2">
                  {quotaExceeded ? 
                    'AI-funktioner är tillfälligt otillgängliga på grund av API-kvotgräns.' :
                    isAtMessageLimit ?
                    'Du har använt alla dina gratis meddelanden för idag. Uppgradera för obegränsad användning.' :
                    currentSessionName ? 
                    'Fortsätt din konversation eller starta en ny chat.' :
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
                  isAtMessageLimit ? "Daglig gräns nådd. Uppgradera för obegränsad användning." :
                  remainingMessages <= 2 && !isPremium ? `${remainingMessages} meddelanden kvar idag. Ställ din fråga...` :
                  "Ställ en avancerad fråga om din portfölj..."
                }
                disabled={isLoading || isAnalyzing || quotaExceeded || isAtMessageLimit}
                className="flex-1 text-xs sm:text-sm"
              />
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading || isAnalyzing || quotaExceeded || isAtMessageLimit}
                size="icon"
                className="flex-shrink-0"
              >
                {(isLoading || isAnalyzing) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isAtMessageLimit ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            
            {!isPremium && (
              <div className="mt-2 text-center">
                <span className="text-xs text-muted-foreground">
                  {remainingMessages} av 5 gratis meddelanden kvar idag
                </span>
                {remainingMessages <= 2 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs ml-2 p-0 h-auto"
                    onClick={() => createCheckout('premium')}
                  >
                    Uppgradera för obegränsad användning
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChat;
