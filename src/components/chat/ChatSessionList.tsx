
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
}

interface ChatSessionListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditSession: (session: ChatSession) => void;
}

const ChatSessionList = memo(({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onEditSession
}: ChatSessionListProps) => {
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer group ${
            currentSessionId === session.id
              ? 'bg-primary/20 border border-primary/30 shadow-md'
              : 'bg-background/50 hover:bg-background/70 hover:shadow-md border'
          }`}
          onClick={() => onLoadSession(session.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm sm:text-base">
              {session.session_name}
            </p>
            <p className="text-xs sm:text-sm mt-1 text-muted-foreground">
              {new Date(session.created_at).toLocaleDateString('sv-SE')}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditSession(session);
              }}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-lg hover:shadow-lg hover:bg-secondary/50"
            >
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-lg hover:shadow-lg hover:bg-secondary/50"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      ))}
      {sessions.length === 0 && (
        <p className="text-center py-6 text-sm sm:text-base text-muted-foreground">
          Inga tidigare chattar
        </p>
      )}
    </div>
  );
});

ChatSessionList.displayName = 'ChatSessionList';

export default ChatSessionList;
