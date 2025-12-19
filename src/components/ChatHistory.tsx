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
  Bot,
  Plus
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
  onNewSession?: () => void; // Ny prop för att skapa ny session
  isLoadingSession?: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onNewSession,
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

  const handleNewSession = () => {
    if (onNewSession) {
      onNewSession();
      setIsOpen(false);
    }
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
      
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Chat-historik
          </DialogTitle>
          <DialogDescription>
            Alla dina tidigare AI-chattar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          
          {/* --- NY CHATT KNAPP (Placerad högst upp) --- */}
          {onNewSession && (
            <Button 
              onClick={handleNewSession}
              className="w-full justify-start gap-3 h-12 text-base font-medium shadow-sm bg-primary/90 hover:bg-primary"
              size="lg"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                <Plus className="h-5 w-5" />
              </div>
              Starta ny konversation
            </Button>
          )}

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

          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-2 pb-4">
              {filteredSessions.length > 0 ? (
                filteredSessions.map(session => {
                  const isActive = session.id === currentSessionId;
                  
                  return (
                    <div 
                      key={session.id}
                      className={`
                        w-full p-3 rounded-lg border transition-all cursor-pointer group
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
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`font-medium text-sm truncate ${
                                isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {session.session_name}
                              </h4>
                              {isActive && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                  Aktiv
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getTimeAgo(session.created_at)}
                              </span>
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
                            className="ml-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
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
                  <p className="text-xs mt-1">Klicka på knappen ovan för att starta en ny.</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inga chattar matchade din sökning</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {sessions.length > 0 && (
            <div className="border-t pt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>
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
