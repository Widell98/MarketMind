import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Send, Loader2, MessageSquare, Shield, TrendingUp, Zap, AlertCircle, Crown, Lock, Plus, Clock } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { useSubscription } from '@/hooks/useSubscription';
import ChatHistory from './ChatHistory';
import StockExchangeSuggestions from './StockExchangeSuggestions';

interface AIChatProps {
  portfolioId?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    analysisType?: string;
    confidence?: number;
    isExchangeRequest?: boolean;
  };
}

const AIChat: React.FC<AIChatProps> = ({ portfolioId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const { 
    messages, 
    sessions, 
    currentSessionId,
    isLoading, 
    isLoadingSession,
    quotaExceeded,
    sendMessage, 
    createNewSession,
    loadSession,
    deleteSession,
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
      console.log('Messages in current session:', messages.length);
    }
  }, [currentSessionId, sessions, messages]);

  // Listen for custom events to create stock-specific chats
  useEffect(() => {
    const handleCreateStockChat = (event: CustomEvent) => {
      const { sessionName, message } = event.detail;
      console.log('Creating stock chat:', sessionName, message);
      createNewSession(sessionName, message);
    };

    window.addEventListener('createStockChat', handleCreateStockChat as EventListener);
    
    return () => {
      window.removeEventListener('createStockChat', handleCreateStockChat as EventListener);
    };
  }, [createNewSession]);

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
    
    console.log('About to send message, current remaining:', remainingMessages);
    await sendMessage(message);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleQuickQuestion = async (prompt: string) => {
    const remainingMessages = getRemainingUsage('ai_message');
    const isPremium = subscription?.subscribed;

    if (!isPremium && remainingMessages <= 0) {
      return;
    }

    console.log('About to send quick question, current remaining:', remainingMessages);
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

  const quickQuestions = [
    { text: "Hur mår min portfölj just nu?", action: () => handleQuickQuestion("Ge mig en snabb översikt över hur min portfölj mår just nu") },
    { text: "Vilka risker finns i mina innehav?", action: () => handleQuickQuestion("Identifiera de största riskerna i min nuvarande portfölj") },
    { text: "Borde jag rebalansera?", action: () => handleQuickQuestion("Analysera om jag borde rebalansera min portfölj och varför") },
    { text: "Vad händer på marknaden?", action: () => handleQuickQuestion("Ge mig en uppdatering om vad som händer på finansmarknaderna som kan påverka mig") }
  ];

  const parseStockSuggestions = (content: string) => {
    // Try to extract stock suggestions from AI response
    const suggestionPatterns = [
      /Förslag:?\s*([^(]+)\s*\(([^)]+)\)\s*-\s*([^.]+)/gi,
      /(\w+[\s\w]*)\s*\(([A-Z]{1,5})\)[\s-]*([^.]{20,100})/gi,
      /•\s*([^(]+)\s*\(([^)]+)\)[\s-]*([^•\n]{20,150})/gi
    ];

    const suggestions = [];
    
    for (const pattern of suggestionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null && suggestions.length < 3) {
        const [, name, ticker, reason] = match;
        if (name && ticker && reason) {
          suggestions.push({
            name: name.trim(),
            ticker: ticker.trim().toUpperCase(),
            reason: reason.trim(),
            weight: '5-10%', // Default weight
            sector: 'Teknologi', // Default sector
            marketCap: 'Large Cap', // Default market cap
            risk: 'medium' as const
          });
        }
      }
      if (suggestions.length > 0) break;
    }

    return suggestions;
  };

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

  const currentSessionName = currentSessionId && sessions.length > 0 
    ? sessions.find(s => s.id === currentSessionId)?.session_name 
    : null;

  console.log('Current remaining messages in render:', remainingMessages);
  console.log('Is premium:', isPremium);
  console.log('Usage object:', usage);

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
              <Badge variant={remainingMessages <= 2 ? "destructive" : "outline"} className="text-xs">
                {remainingMessages}/5 meddelanden kvar idag
              </Badge>
            )}
          </div>
          
          <CardDescription className="text-xs sm:text-sm">
            {isPremium ? 
              'Obegränsad AI-analys med djupgående portföljinsikter' :
              'Gratis användare har 5 meddelanden per dag'
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
          
          {/* Quick Questions */}
          <div className="w-full mt-4">
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
                  <div key={message.id}>
                    <div
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
                    
                    {/* Show stock suggestions if this is an AI message with exchange suggestions */}
                    {message.role === 'assistant' && message.context?.isExchangeRequest && (
                      <div className="mt-3 ml-0 mr-auto max-w-[85%]">
                        {(() => {
                          const suggestions = parseStockSuggestions(message.content);
                          if (suggestions.length > 0) {
                            return (
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Identifierade aktieförslag
                                </h4>
                                <div className="space-y-3">
                                  {suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="bg-white rounded p-3 border border-blue-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">
                                          {suggestion.name} ({suggestion.ticker})
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {suggestion.weight}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2">
                                        {suggestion.reason}
                                      </p>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-7"
                                          onClick={() => {
                                            // Create new chat session for this specific stock
                                            const event = new CustomEvent('createStockChat', {
                                              detail: { 
                                                sessionName: `Diskussion: ${suggestion.name}`,
                                                message: `Berätta mer om ${suggestion.name} (${suggestion.ticker}) och varför det skulle passa min portfölj. Vad är riskerna och möjligheterna?`
                                              }
                                            });
                                            window.dispatchEvent(event);
                                          }}
                                        >
                                          Diskutera mer
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                  <strong>Påminnelse:</strong> Detta är utbildningssyfte endast. Gör egen research innan investeringsbeslut.
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 p-3 sm:p-4 rounded-lg flex items-center gap-3 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-xs sm:text-sm text-gray-700">
                        AI-assistenten tänker...
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
                disabled={isLoading || quotaExceeded || isAtMessageLimit}
                className="flex-1 text-xs sm:text-sm"
              />
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading || quotaExceeded || isAtMessageLimit}
                size="icon"
                className="flex-shrink-0"
              >
                {isLoading ? (
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
