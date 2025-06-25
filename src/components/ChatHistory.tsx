import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  History, 
  Star, 
  StarOff, 
  Search, 
  Calendar, 
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Shield,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
  is_favorite?: boolean;
  market_context?: 'volatile' | 'bull' | 'bear' | 'normal';
  summary?: string;
  message_count?: number;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  onLoadSession: (sessionId: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  onLoadSession,
  onToggleFavorite,
  onRenameSession,
  onDeleteSession
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const filteredSessions = sessions.filter(session =>
    session.session_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favoritesSessions = filteredSessions.filter(s => s.is_favorite);
  const recentSessions = filteredSessions.filter(s => !s.is_favorite).slice(0, 10);

  const getMarketIcon = (context?: string) => {
    switch (context) {
      case 'volatile': return <TrendingDown className="w-4 h-4 text-orange-500" />;
      case 'bull': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'bear': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Shield className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Nyss';
    if (diffInHours < 24) return `${diffInHours}h sedan`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d sedan`;
    return date.toLocaleDateString('sv-SE');
  };

  const handleRename = (sessionId: string, currentName: string) => {
    setIsRenaming(sessionId);
    setNewName(currentName);
  };

  const submitRename = (sessionId: string) => {
    if (newName.trim()) {
      onRenameSession(sessionId, newName.trim());
    }
    setIsRenaming(null);
    setNewName('');
  };

  const handleDelete = (sessionId: string, sessionName: string) => {
    if (window.confirm(`Är du säker på att du vill ta bort chatten "${sessionName}"? Detta kan inte ångras.`)) {
      onDeleteSession?.(sessionId);
    }
  };

  const SessionItem = ({ session }: { session: ChatSession }) => (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getMarketIcon(session.market_context)}
        <div className="flex-1 min-w-0">
          {isRenaming === session.id ? (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(session.id);
                  if (e.key === 'Escape') setIsRenaming(null);
                }}
                autoFocus
              />
              <Button size="sm" onClick={() => submitRename(session.id)}>
                Spara
              </Button>
            </div>
          ) : (
            <>
              <h4 
                className="font-medium text-sm truncate cursor-pointer hover:text-blue-600"
                onClick={() => handleRename(session.id, session.session_name)}
              >
                {session.session_name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(session.created_at)}
                </span>
                {session.message_count && (
                  <Badge variant="outline" className="text-xs">
                    {session.message_count} meddelanden
                  </Badge>
                )}
              </div>
              {session.summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {session.summary}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleFavorite(session.id)}
          className="p-1"
        >
          {session.is_favorite ? 
            <Star className="w-4 h-4 text-yellow-500 fill-current" /> : 
            <StarOff className="w-4 h-4" />
          }
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDelete(session.id, session.session_name)}
          className="p-1 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onLoadSession(session.id)}
        >
          Öppna
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          Chathistorik
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Dina sparade chattar
          </DialogTitle>
          <DialogDescription>
            Återgå till tidigare rådgivningssamtal och viktiga diskussioner
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Sök i chathistorik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-6">
              {/* Favorites */}
              {favoritesSessions.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Favoriter
                  </h3>
                  <div className="space-y-2">
                    {favoritesSessions.map(session => (
                      <SessionItem key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent */}
              <div>
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Senaste chattar
                </h3>
                <div className="space-y-2">
                  {recentSessions.length > 0 ? (
                    recentSessions.map(session => (
                      <SessionItem key={session.id} session={session} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Inga chattar hittades</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistory;
