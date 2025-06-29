
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
    <div className="flex h-[90vh] max-h-[900px] bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
      {/* Sidebar - Modern Design */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:w-80 xl:w-72
      `}>
        <div className="flex flex-col h-full">
          {/* Header with glassmorphism effect */}
          <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    AI Portfolio
                  </h2>
                  <p className="text-xs text-gray-400">Din smarta assistent</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleCreateNewSession}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-lg shadow-lg"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ny Chat
              </Button>
            </div>
            
            {/* Premium Status with enhanced styling */}
            <div className="mt-4">
              {isPremium ? (
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800/50">
                    {remainingMessages}/5 kvar idag
                  </Badge>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(remainingMessages / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat History with improved styling */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    group flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200
                    ${currentSessionId === session.id 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 shadow-lg' 
                      : 'hover:bg-gray-800/50 hover:shadow-md'
                    }
                  `}
                  onClick={() => handleLoadSession(session.id)}
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${currentSessionId === session.id 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                      : 'bg-gray-700 group-hover:bg-gray-600'
                    }
                  `}>
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
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
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 h-auto transition-opacity"
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

          {/* Footer with upgrade CTA */}
          <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
            {!isPremium && (
              <Button
                onClick={() => createCheckout('premium')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area - Enhanced Design */}
      <div className="flex-1 flex flex-col min-h-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        {/* Top Bar with glassmorphism */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
              >
                <History className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  {currentSessionName || 'AI Portfolio Assistent'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {isPremium ? 'Obegränsad AI-analys' : `${remainingMessages} meddelanden kvar idag`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area - Enhanced scrolling */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 lg:p-6 max-w-5xl mx-auto">
              {/* Usage Limit Alerts with better styling */}
              {!isPremium && isAtMessageLimit && (
                <div className="mb-6">
                  <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg">
                    <Lock className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold mb-1">Daglig gräns nådd</div>
                          <div className="text-sm opacity-90">
                            Du har använt alla dina 5 gratis AI-meddelanden för idag.
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg"
                          onClick={() => createCheckout('premium')}
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Uppgradera nu
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {quotaExceeded && (
                <div className="mb-6">
                  <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="font-semibold mb-1">OpenAI API-kvot överskriden</div>
                      <div className="text-sm opacity-90">
                        Du har nått din dagliga gräns för AI-användning. Kontrollera din OpenAI-fakturering eller försök igen senare.
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Welcome Screen with enhanced design */}
              {messages.length === 0 && (
                <div className="max-w-4xl mx-auto py-12">
                  <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                      Hur kan jag hjälpa dig idag?
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Välj ett av förslagen nedan eller ställ din egen fråga om din portfölj
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {quickQuestions.map((q, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="p-6 h-auto text-left justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={q.action}
                        disabled={isLoading || quotaExceeded || isAtMessageLimit}
                      >
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 dark:text-white mb-2 text-base">
                            {q.text}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Få svar direkt från din AI-assistent
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages with enhanced styling */}
              {messages.length > 0 && (
                <div className="space-y-8">
                  {messages.map((message) => (
                    <div key={message.id}>
                      <div className="flex gap-4 lg:gap-6">
                        {message.role === 'assistant' && (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Brain className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white text-sm font-semibold">Du</span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className={`
                            rounded-2xl p-6 shadow-sm
                            ${message.role === 'assistant' 
                              ? 'bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-gray-700 dark:to-gray-600 border border-gray-200/50 dark:border-gray-600/50' 
                              : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                            }
                          `}>
                            {message.role === 'assistant' ? 
                              formatAIResponse(message.content) : 
                              <p className="text-white font-medium leading-relaxed">{message.content}</p>
                            }
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 px-2">
                            <span>
                              {new Date(message.timestamp).toLocaleTimeString('sv-SE', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <div className="flex gap-2">
                              {message.context?.analysisType && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
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
                      
                      {/* Stock Suggestions with enhanced styling */}
                      {message.role === 'assistant' && message.context?.isExchangeRequest && (
                        <div className="ml-16 mt-6">
                          {(() => {
                            const suggestions = parseStockSuggestions(message.content);
                            if (suggestions.length > 0) {
                              return (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6 shadow-lg">
                                  <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                                    <TrendingUp className="w-5 h-5" />
                                    Identifierade aktieförslag
                                  </h4>
                                  <div className="space-y-4">
                                    {suggestions.map((suggestion, idx) => (
                                      <div key={idx} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                          <span className="font-semibold text-gray-900 text-base">
                                            {suggestion.name} ({suggestion.ticker})
                                          </span>
                                          <Badge variant="outline" className="text-xs font-medium">
                                            {suggestion.weight}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                          {suggestion.reason}
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-8 hover:bg-blue-50 border-blue-200"
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
                                    ))}
                                  </div>
                                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <div className="flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                      <p className="text-xs text-yellow-800 font-medium">
                                        <strong>Påminnelse:</strong> Detta är utbildningssyfte endast. Gör egen research innan investeringsbeslut.
                                      </p>
                                    </div>
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
                    <div className="flex gap-4 lg:gap-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 flex items-center gap-3 shadow-sm border border-gray-200/50 dark:border-gray-600/50">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
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

        {/* Input Area - Enhanced Design */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-6 flex-shrink-0 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3 lg:gap-4">
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
                  className="h-12 lg:h-14 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading || quotaExceeded || isAtMessageLimit}
                className="h-12 lg:h-14 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isAtMessageLimit ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
            
            {!isPremium && (
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{remainingMessages} av 5 gratis meddelanden kvar idag</span>
                  {remainingMessages <= 2 && (
                    <>
                      <span>•</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-sm p-0 h-auto text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => createCheckout('premium')}
                      >
                        Uppgradera för obegränsad användning
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
