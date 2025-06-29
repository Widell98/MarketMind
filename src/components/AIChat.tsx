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
  Loader2
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
      <div key={message.id} className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} group`}>
        <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
              : 'bg-gradient-to-br from-green-500 to-teal-600'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          
          <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-3 rounded-2xl shadow-sm backdrop-blur-sm border ${
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-200/50'
                : 'bg-white/80 text-gray-900 border-gray-200/50'
            }`}>
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </div>
              
              {message.context?.isExchangeRequest && !isUser && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200/50">
                  <div className="flex items-center gap-2 text-amber-800 text-sm font-medium mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Portföljförändring föreslås
                  </div>
                  <p className="text-amber-700 text-sm">
                    Detta förslag kan påverka din portföljs sammansättning. Överväg riskerna innan du genomför ändringar.
                  </p>
                </div>
              )}

              {message.context?.confidence && (
                <div className="mt-2 flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
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
            
            <div className={`text-xs text-gray-500 flex items-center gap-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <Clock className="w-3 h-3" />
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white/80 to-blue-50/40 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-white/20 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Portfolio Chat</h2>
              <p className="text-sm text-gray-600">Din personliga investeringsassistent</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSessions(!showSessions)}
              className="bg-white/50 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 shadow-sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Historik
              {showSessions ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewSession}
              disabled={isLoading}
              className="bg-white/50 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ny Chat
            </Button>
          </div>
        </div>

        <Collapsible open={showSessions}>
          <CollapsibleContent className="mt-4">
            <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/30 p-4 shadow-inner">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tidigare chattar
              </h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer group ${
                        currentSessionId === session.id
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200/50 shadow-sm'
                          : 'bg-white/60 hover:bg-white/80 border border-gray-100/50'
                      }`}
                      onClick={() => loadSession(session.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.session_name}
                        </p>
                        <p className="text-xs text-gray-500">
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Inga tidigare chattar
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 lg:p-6 space-y-6">
            {isLoadingSession ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Laddar chat...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Hej! Vad kan jag hjälpa dig med idag?
                </h3>
                <p className="text-gray-600 max-w-md">
                  Ställ frågor om din portfölj, be om analyser eller få investeringsråd. Jag är här för att hjälpa!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/80 border border-gray-200/50 px-4 py-3 rounded-2xl shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AI tänker...</span>
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

      {/* Input */}
      <div className="bg-white/60 backdrop-blur-sm border-t border-white/20 p-4 lg:p-6">
        {quotaExceeded && (
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-medium mb-1">
              <AlertCircle className="w-4 h-4" />
              API-kvot överskriden
            </div>
            <p className="text-amber-700 text-sm">
              Du har nått din dagliga gräns för AI-användning. Försök igen senare eller uppgradera ditt konto.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv ditt meddelande..."
              disabled={isLoading || quotaExceeded}
              className="pr-12 h-12 bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-300 focus:ring-blue-200/50 shadow-sm rounded-xl text-base"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || quotaExceeded}
            className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
