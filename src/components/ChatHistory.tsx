
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  History, 
  Search, 
  MessageSquare,
  Trash2,
  Clock,
  User,
  Bot
} from 'lucide-react';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  isLoadingSession?: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  isLoadingSession = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredSessions = sessions.filter(session =>
    session.session_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Nyss';
    if (diffInHours < 24) return `${diffInHours}h sedan`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d sedan`;
    return date.toLocaleDateString('sv-SE');
  };

  const handleLoadSession = (sessionId: string) => {
    onLoadSession(sessionId);
    setIsOpen(false);
  };

  const handleDelete = (sessionId: string, sessionName: string) => {
    if (window.confirm(`Är du säker på att du vill ta bort chatten "${sessionName}"? Detta kan inte ångras.`)) {
      onDeleteSession?.(sessionId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Historik</span>
          {sessions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {sessions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Chat-historik
            {currentSessionId && (
              <Badge variant="outline" className="text-xs">
                {sessions.find(s => s.id === currentSessionId)?.session_name || 'Aktiv chat'}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Alla dina tidigare AI-chattar. Klicka på en chat för att ladda den.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Sök i chathistorik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoadingSession && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Laddar chat...</p>
            </div>
          )}

          <ScrollArea className="h-96">
            <div className="space-y-2 pr-4">
              {filteredSessions.length > 0 ? (
                filteredSessions.map(session => {
                  const isActive = session.id === currentSessionId;
                  
                  return (
                    <div 
                      key={session.id}
                      className={`
                        w-full p-3 rounded-lg border transition-all cursor-pointer
                        ${isActive 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }
                      `}
                      onClick={() => handleLoadSession(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {isActive ? (
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm truncate ${
                              isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {session.session_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getTimeAgo(session.created_at)}
                              </span>
                              {isActive && (
                                <Badge variant="secondary" className="text-xs px-2 py-0">
                                  Aktiv
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {onDeleteSession && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(session.id, session.session_name);
                            }}
                            className="ml-2 p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inga chattar ännu</p>
                  <p className="text-xs mt-1">Dina AI-chattar kommer att visas här</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inga chattar matchade din sökning</p>
                  <p className="text-xs mt-1">Försök med andra sökord</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {sessions.length > 0 && (
            <div className="border-t pt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Du</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>AI-assistent</span>
                </div>
              </div>
              <p className="mt-2">
                {sessions.length} {sessions.length === 1 ? 'chat' : 'chattar'} sparade
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistory;
