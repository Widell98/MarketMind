
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Send, Loader2, MessageSquare, Shield, TrendingUp, Zap, AlertCircle, Crown, Lock, Plus, Clock, Edit3, Trash2, History } from 'lucide-react';
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

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ portfolioId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
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

    // Listen for example prompts
    const handleExamplePrompt = (event: CustomEvent) => {
      const { message } = event.detail;
      setInputMessage(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

    window.addEventListener('createStockChat', handleCreateStockChat as EventListener);
    window.addEventListener('sendExamplePrompt', handleExamplePrompt as EventListener);
    
    return () => {
      window.removeEventListener('createStockChat', handleCreateStockChat as EventListener);
      window.removeEventListener('sendExamplePrompt', handleExamplePrompt as EventListener);
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
    setShowSidebar(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    console.log('Deleting session from ChatHistory:', sessionId);
    await deleteSession(sessionId);
  };

  const handleCreateNewSession = async () => {
    console.log('Creating new session...');
    await createNewSession();
    setShowSidebar(false);
  };

  const isPremium = subscription?.subscribed;
  const remainingMessages = getRemainingUsage('ai_message');

  const quickQuestions = [
    { text: "Hur mår min portfölj?", action: () => handleQuickQuestion("Ge mig en snabb översikt över hur min portfölj mår just nu") },
    { text: "Vilka risker finns?", action: () => handleQuickQuestion("Identifiera de största riskerna i min nuvarande portfölj") },
    { text: "Borde jag rebalansera?", action: () => handleQuickQuestion("Analysera om jag borde rebalansera min portfölj och varför") },
    { text: "Marknadsläget?", action: () => handleQuickQuestion("Ge mig en uppdatering om vad som händer på finansmarknaderna som kan påverka mig") }
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
    <div className="flex h-[700px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border">
      {/* Sidebar - ChatGPT Style */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-50 w-80 bg-gray-900 text-white transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:w-72
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-400" />
                <h2 className="text-lg font-semibold">AI Portfolio</h2>
              </div>
              <Button
                size="sm"
                onClick={handleCreateNewSession}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ny Chat
              </Button>
            </div>
            
            {/* Premium Status */}
            <div className="mt-3">
              {isPremium ? (
                <Badge className="bg-yellow-600 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {remainingMessages}/5 kvar idag
                </Badge>
              )}
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    group flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors
                    ${currentSessionId === session.id ? 'bg-gray-800 border-l-2 border-blue-400' : ''}
                  `}
                  onClick={() => handleLoadSession(session.id)}
                >
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {session.session_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            {!isPremium && (
              <Button
                onClick={() => createCheckout('premium')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Crown className="w-4 h-4 mr-2" />
                Uppgradera till Premium
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area - Fixed Height */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                <History className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentSessionName || 'AI Portfolio Assistent'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isPremium ? 'Obegränsad AI-analys' : `${remainingMessages} meddelanden kvar idag`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area - Scrollable with Fixed Height */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {/* Usage Limit Alerts */}
              {!isPremium && isAtMessageLimit && (
                <div className="mb-4">
                  <Alert className="border-red-200 bg-red-50">
                    <Lock className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-sm">
                          <strong>Daglig gräns nådd:</strong> Du har använt alla dina 5 gratis AI-meddelanden för idag.
                        </span>
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => createCheckout('premium')}
                        >
                          Uppgradera nu
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {quotaExceeded && (
                <div className="mb-4">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-sm">
                      <strong>OpenAI API-kvot överskriden:</strong> Du har nått din dagliga gräns för AI-användning. 
                      Kontrollera din OpenAI-fakturering eller försök igen senare.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Quick Questions */}
              {messages.length === 0 && (
                <div className="max-w-3xl mx-auto py-8">
                  <div className="text-center mb-8">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Hur kan jag hjälpa dig idag?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Välj ett av förslagen nedan eller ställ din egen fråga
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickQuestions.map((q, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="p-4 h-auto text-left justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={q.action}
                        disabled={isLoading || quotaExceeded || isAtMessageLimit}
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {q.text}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Få svar direkt
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.map((message) => (
                    <div key={message.id}>
                      <div className="flex gap-4">
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-medium">Du</span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            {message.role === 'assistant' ? 
                              formatAIResponse(message.content) : 
                              <p className="text-gray-900 dark:text-white">{message.content}</p>
                            }
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>
                              {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
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
                      
                      {/* Stock Suggestions */}
                      {message.role === 'assistant' && message.context?.isExchangeRequest && (
                        <div className="ml-12 mt-4">
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
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-gray-700 dark:text-gray-300">
                            AI-assistenten tänker...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    quotaExceeded ? "AI-funktioner är tillfälligt otillgängliga..." :
                    isAtMessageLimit ? "Daglig gräns nådd. Uppgradera för obegränsad användning." :
                    "Skriv ditt meddelande här..."
                  }
                  disabled={isLoading || quotaExceeded || isAtMessageLimit}
                  className="border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading || quotaExceeded || isAtMessageLimit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {remainingMessages} av 5 gratis meddelanden kvar idag
                </span>
                {remainingMessages <= 2 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs ml-2 p-0 h-auto text-blue-600"
                    onClick={() => createCheckout('premium')}
                  >
                    Uppgradera för obegränsad användning
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
