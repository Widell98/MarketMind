
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
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
            isUser 
              ? 'bg-slate-800' 
              : 'bg-blue-600'
          }`}>
            {isUser ? (
              <User className="w-6 h-6 text-white" />
            ) : (
              <Bot className="w-6 h-6 text-white" />
            )}
          </div>
          
          <div className={`flex flex-col gap-3 ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-6 py-4 rounded-2xl shadow-lg border max-w-3xl ${
              isUser
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <div className="whitespace-pre-wrap break-words leading-relaxed text-base">
                {message.content}
              </div>
              
              {message.context?.isExchangeRequest && !isUser && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3 text-amber-800 font-medium mb-2">
                    <TrendingUp className="w-5 h-5" />
                    Portföljförändring föreslås
                  </div>
                  <p className="text-amber-700">
                    Detta förslag kan påverka din portföljs sammansättning. Överväg riskerna innan du genomför ändringar.
                  </p>
                </div>
              )}

              {message.context?.confidence && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${
                      message.context.confidence > 0.8 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : message.context.confidence > 0.6
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {Math.round(message.context.confidence * 100)}% säkerhet
                  </Badge>
                </div>
              )}
            </div>
            
            <div className={`text-sm text-slate-500 flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <Clock className="w-4 h-4" />
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[80vh] xl:h-[85vh] bg-white overflow-hidden">
      {/* Professional Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 xl:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl xl:text-3xl font-bold text-slate-900">AI Portfolio Assistent</h2>
              <p className="text-base text-slate-600">Din intelligenta investeringsrådgivare</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowSessions(!showSessions)}
              className="bg-white border-slate-200 hover:bg-slate-50 hover:shadow-lg transition-all duration-200 px-4 py-3 text-slate-700"
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
              className="bg-white border-slate-200 hover:bg-slate-50 hover:shadow-lg transition-all duration-200 px-4 py-3 text-slate-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ny Chat
            </Button>
          </div>
        </div>

        <Collapsible open={showSessions}>
          <CollapsibleContent className="mt-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-3">
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
                          ? 'bg-slate-100 border border-slate-200 shadow-md'
                          : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
                      }`}
                      onClick={() => loadSession(session.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate text-base">
                          {session.session_name}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-slate-500 text-center py-6 text-base">
                      Inga tidigare chattar
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Messages - Professional styling */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 xl:p-8 space-y-8 max-w-6xl mx-auto">
            {isLoadingSession ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-4 text-slate-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-lg">Laddar chat...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">
                  Hej! Vad kan jag hjälpa dig med idag?
                </h3>
                <p className="text-lg text-slate-600 max-w-2xl">
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
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-lg">
                        <div className="flex items-center gap-3 text-slate-600">
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

      {/* Professional Input */}
      <div className="bg-slate-50 border-t border-slate-200 p-6 xl:p-8">
        {quotaExceeded && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3 text-amber-800 font-medium mb-2">
              <AlertCircle className="w-5 h-5" />
              API-kvot överskriden
            </div>
            <p className="text-amber-700">
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
              className="h-14 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-200/50 shadow-lg rounded-xl text-base px-6 pr-14"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || quotaExceeded}
            size="lg"
            className="h-14 px-8 bg-slate-800 hover:bg-slate-700 shadow-lg rounded-xl text-base font-medium"
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
