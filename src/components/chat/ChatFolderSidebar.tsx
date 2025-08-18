import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useChatFolders } from '@/hooks/useChatFolders';

interface ChatFolderSidebarProps {
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditSessionName: (sessionId: string, name: string) => void;
  onNewSession: () => void;
  onLoadGuideSession?: () => void;
  isLoadingSession?: boolean;
  className?: string;
}

const ChatFolderSidebar: React.FC<ChatFolderSidebarProps> = memo(({
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onEditSessionName,
  onNewSession,
  onLoadGuideSession,
  isLoadingSession = false,
  className = ""
}) => {
  const { sessions, getSessionsByFolder } = useChatFolders();

  const unorganizedSessions = sessions.filter(session => !session.folder_id);

  const getTodaySessions = () => {
    const today = new Date();
    return unorganizedSessions.filter(session => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === today.toDateString();
    });
  };

  const getYesterdaySessions = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return unorganizedSessions.filter(session => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === yesterday.toDateString();
    });
  };

  const getOlderSessions = () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return unorganizedSessions.filter(session => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() !== today.toDateString() && 
             sessionDate.toDateString() !== yesterday.toDateString();
    });
  };

  const todaySessions = getTodaySessions();
  const yesterdaySessions = getYesterdaySessions();
  const olderSessions = getOlderSessions();

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header with New Chat Button */}
      <div className="flex-shrink-0 p-4">
        <Button
          onClick={onNewSession}
          className="w-full flex items-center justify-start gap-2 h-9 hover:bg-muted/50 text-sm font-normal text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          variant="ghost"
          disabled={isLoadingSession}
        >
          <Plus className="w-4 h-4" />
          {isLoadingSession ? 'Creating...' : 'New chat'}
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pt-0 space-y-1">
          {/* Today's sessions */}
          {todaySessions.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">Today</div>
              {todaySessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => onLoadSession(session.id)}
                  className={`w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors truncate ${
                    currentSessionId === session.id ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {session.session_name}
                </button>
              ))}
            </div>
          )}

          {/* Yesterday's sessions */}
          {yesterdaySessions.length > 0 && (
            <div className="space-y-1 mt-4">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">Yesterday</div>
              {yesterdaySessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => onLoadSession(session.id)}
                  className={`w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors truncate ${
                    currentSessionId === session.id ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {session.session_name}
                </button>
              ))}
            </div>
          )}

          {/* Older sessions */}
          {olderSessions.length > 0 && (
            <div className="space-y-1 mt-4">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">Previous</div>
              {olderSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => onLoadSession(session.id)}
                  className={`w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors truncate ${
                    currentSessionId === session.id ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {session.session_name}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No chat history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatFolderSidebar.displayName = 'ChatFolderSidebar';

export default ChatFolderSidebar;