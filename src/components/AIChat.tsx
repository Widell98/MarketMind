
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIChat } from '@/hooks/useAIChat';
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Loader2,
  History,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RelatedStockCase from './RelatedStockCase';

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

interface AIChatProps {
  portfolioId?: string;
}

const AIChat = ({ portfolioId }: AIChatProps) => {
  const {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    isAnalyzing,
    quotaExceeded,
    isLoadingSession,
    sendMessage,
    analyzePortfolio,
    createNewSession,
    loadSession,
    deleteSession,
    clearMessages,
    getQuickAnalysis,
  } = useAIChat(portfolioId);

  const [input, setInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load the most recent session on component mount
    if (portfolioId) {
      // loadSessions(); // Ensure sessions are loaded when component mounts
    }
  }, [portfolioId]);

  useEffect(() => {
    const handleCreateStockChat = (event: CustomEvent) => {
      const { sessionName, message } = event.detail;
      createNewSession(sessionName, message);
    };

    const handleExamplePrompt = (event: CustomEvent) => {
      const { message } = event.detail;
      setInput(message);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();
    setInput('');
    
    await sendMessage(messageToSend);
  };

  const handleNewSession = async () => {
    await createNewSession();
    setInput('');
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  const extractStockCaseId = (content: string): string | null => {
    const stockCaseMatch = content.match(/stock_case_id['":\s]*([a-f0-9-]{36})/i);
    return stockCaseMatch ? stockCaseMatch[1] : null;
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const stockCaseId = !isUser ? extractStockCaseId(message.content) : null;
    
    return (
      <div key={message.id} className={`flex gap-6 ${isUser ? 'justify-end' : 'justify-start'} group mb-8`}>
        <div className={`flex gap-4 max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-12 h-12 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg transform transition-transform duration-300 ${
            isUser 
              ? 'rotate-3 hover:rotate-0' 
              : '-rotate-3 hover:rotate-0'
          }`} style={{ 
            background: isUser 
              ? 'linear-gradient(135deg, #555879, #98A1BC)' 
              : 'linear-gradient(135deg, #98A1BC, #DED3C4)'
          }}>
            {isUser ? (
              <User className="w-6 h-6 text-[#F4EBD3]" />
            ) : (
              <Bot className="w-6 h-6" style={{ color: '#555879' }} />
            )}
          </div>
          
          <div className={`flex flex-col gap-3 ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-6 py-4 rounded-2xl shadow-lg border max-w-3xl backdrop-blur-sm ${
              isUser
                ? 'text-[#F4EBD3]'
                : 'text-[#555879]'
            }`} style={{
              backgroundColor: isUser 
                ? 'rgba(85, 88, 121, 0.95)' 
                : 'rgba(244, 235, 211, 0.95)',
              borderColor: isUser ? '#98A1BC' : '#DED3C4'
            }}>
              <div className="whitespace-pre-wrap break-words leading-relaxed text-base">
                {message.content}
              </div>
              
              {message.context?.isExchangeRequest && !isUser && (
                <div className="mt-4 p-4 rounded-xl border backdrop-blur-sm" style={{ backgroundColor: 'rgba(222, 211, 196, 0.9)', borderColor: '#DED3C4' }}>
                  <div className="flex items-center gap-3 font-medium mb-2" style={{ color: '#555879' }}>
                    <TrendingUp className="w-5 h-5" />
                    Portföljförändring föreslås
                  </div>
                  <p style={{ color: '#98A1BC' }}>
                    Detta förslag kan påverka din portföljs sammansättning. Överväg riskerna innan du genomför ändringar.
                  </p>
                </div>
              )}

              {message.context?.confidence && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="backdrop-blur-sm border"
                    style={{
                      backgroundColor: message.context.confidence > 0.8 
                        ? 'rgba(152, 161, 188, 0.2)' 
                        : message.context.confidence > 0.6
                        ? 'rgba(222, 211, 196, 0.3)'
                        : 'rgba(85, 88, 121, 0.2)',
                      borderColor: '#DED3C4',
                      color: '#555879'
                    }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {Math.round(message.context.confidence * 100)}% säkerhet
                  </Badge>
                </div>
              )}
            </div>
            
            <div className={`text-sm flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`} style={{ color: '#98A1BC' }}>
              <Clock className="w-4 h-4" />
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[80vh] xl:h-[85vh] bg-transparent overflow-hidden">
      {/* Artistic Header */}
      <div className="backdrop-blur-sm border-b p-6 xl:p-8" style={{ backgroundColor: 'rgba(222, 211, 196, 0.5)', borderColor: '#DED3C4' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
              <Zap className="w-7 h-7 text-[#F4EBD3]" />
            </div>
            <div>
              <h2 className="text-2xl xl:text-3xl font-bold" style={{ color: '#555879' }}>AI Portfolio Assistent</h2>
              <p className="text-base" style={{ color: '#98A1BC' }}>Din intelligenta investeringsrådgivare</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowSessions(!showSessions)}
              className="backdrop-blur-sm border shadow-lg transition-all duration-200 px-4 py-3 hover:shadow-xl"
              style={{ 
                backgroundColor: 'rgba(244, 235, 211, 0.9)',
                borderColor: '#DED3C4',
                color: '#555879'
              }}
            >
              <History className="w-5 h-5 mr-2" />
              Historik
              {showSessions ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleNewSession}
              disabled={isLoading}
              className="backdrop-blur-sm border shadow-lg transition-all duration-200 px-4 py-3 hover:shadow-xl"
              style={{ 
                backgroundColor: 'rgba(244, 235, 211, 0.9)',
                borderColor: '#DED3C4',
                color: '#555879'
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Ny Chat
            </Button>
          </div>
        </div>

        <Collapsible open={showSessions}>
          <CollapsibleContent className="mt-6">
            <div className="backdrop-blur-sm rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(244, 235, 211, 0.9)', borderColor: '#DED3C4' }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-3" style={{ color: '#555879' }}>
                <History className="w-5 h-5" />
                Tidigare chattar
              </h3>
              <ScrollArea className="h-40">
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer group ${
                        currentSessionId === session.id
                          ? 'border shadow-md'
                          : 'backdrop-blur-sm hover:shadow-md border'
                      }`}
                      style={{
                        backgroundColor: currentSessionId === session.id 
                          ? 'rgba(152, 161, 188, 0.2)' 
                          : 'rgba(222, 211, 196, 0.8)',
                        borderColor: '#DED3C4'
                      }}
                      onClick={() => loadSession(session.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-base" style={{ color: '#555879' }}>
                          {session.session_name}
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#98A1BC' }}>
                          {new Date(session.created_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 p-0 rounded-lg hover:shadow-lg"
                        style={{ 
                          color: '#555879',
                          backgroundColor: 'rgba(85, 88, 121, 0.1)'
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-center py-6 text-base" style={{ color: '#98A1BC' }}>
                      Inga tidigare chattar
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Messages - Artistic styling */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 xl:p-8 space-y-8 max-w-6xl mx-auto">
            {isLoadingSession ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-4" style={{ color: '#98A1BC' }}>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-lg">Laddar chat...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
                  <Bot className="w-12 h-12 text-[#F4EBD3]" />
                </div>
                <h3 className="text-3xl font-bold mb-4" style={{ color: '#555879' }}>
                  Hej! Vad kan jag hjälpa dig med idag?
                </h3>
                <p className="text-lg max-w-2xl" style={{ color: '#98A1BC' }}>
                  Ställ frågor om din portfölj, be om analyser eller få personliga investeringsråd. 
                  Jag är här för att hjälpa dig att fatta smarta investeringsbeslut!
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="flex gap-6 justify-start">
                    <div className="flex gap-4 max-w-4xl">
                      <div className="w-12 h-12 rounded-3xl flex items-center justify-center shadow-lg transform -rotate-3" style={{ background: 'linear-gradient(135deg, #98A1BC, #DED3C4)' }}>
                        <Bot className="w-6 h-6" style={{ color: '#555879' }} />
                      </div>
                      <div className="backdrop-blur-sm border px-6 py-4 rounded-2xl shadow-lg" style={{ backgroundColor: 'rgba(244, 235, 211, 0.95)', borderColor: '#DED3C4' }}>
                        <div className="flex items-center gap-3" style={{ color: '#98A1BC' }}>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-base">AI analyserar din förfrågan...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Artistic Input */}
      <div className="backdrop-blur-sm border-t p-6 xl:p-8" style={{ backgroundColor: 'rgba(222, 211, 196, 0.5)', borderColor: '#DED3C4' }}>
        {quotaExceeded && (
          <div className="mb-6 p-4 backdrop-blur-sm border rounded-xl" style={{ backgroundColor: 'rgba(222, 211, 196, 0.9)', borderColor: '#DED3C4' }}>
            <div className="flex items-center gap-3 font-medium mb-2" style={{ color: '#555879' }}>
              <AlertCircle className="w-5 h-5" />
              API-kvot överskriden
            </div>
            <p style={{ color: '#98A1BC' }}>
              Du har nått din dagliga gräns för AI-användning. Försök igen senare eller uppgradera ditt konto.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv din fråga här... (t.ex. 'Analysera min portfölj' eller 'Vilka aktier bör jag köpa?')"
              disabled={isLoading || quotaExceeded}
              className="h-14 backdrop-blur-sm border shadow-lg rounded-2xl text-base px-6 pr-14 transition-all duration-200 focus:shadow-xl"
              style={{ 
                backgroundColor: 'rgba(244, 235, 211, 0.9)',
                borderColor: '#DED3C4',
                color: '#555879'
              }}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2" style={{ color: '#98A1BC' }}>
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || quotaExceeded}
            size="lg"
            className="h-14 px-8 shadow-lg rounded-2xl text-base font-medium transition-all duration-200 hover:shadow-xl text-[#F4EBD3] transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
