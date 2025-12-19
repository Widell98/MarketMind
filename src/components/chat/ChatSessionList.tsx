import React, { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, MessageSquare } from 'lucide-react';
import { isToday, isYesterday, subDays, isAfter, parseISO } from 'date-fns';

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

// Hjälpkomponent för enskild rad
const ChatSessionItem = ({ 
  session, 
  isActive, 
  onLoad, 
  onEdit, 
  onDelete 
}: {
  session: ChatSession;
  isActive: boolean;
  onLoad: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) => (
  <div
    onClick={onLoad}
    className={`
      group flex items-center justify-between p-2.5 rounded-lg mb-1 cursor-pointer transition-all duration-200
      ${isActive 
        ? 'bg-accent text-accent-foreground font-medium' 
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }
    `}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {/* Ikon som visar om det är aktivt eller inte */}
      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'opacity-50'}`} />
      
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm leading-none">
          {session.session_name || "Namnlös konversation"}
        </p>
      </div>
    </div>

    {/* Action buttons - visas bara vid hover (desktop) eller alltid om man vill på mobil */}
    <div className={`flex items-center gap-0.5 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/80"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-background/80"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
);

const ChatSessionList = memo(({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onEditSession
}: ChatSessionListProps) => {

  // Gruppera sessioner baserat på datum
  const groupedSessions = useMemo(() => {
    const groups = {
      today: [] as ChatSession[],
      yesterday: [] as ChatSession[],
      lastWeek: [] as ChatSession[],
      older: [] as ChatSession[],
    };

    sessions.forEach((session) => {
      const date = parseISO(session.created_at);
      
      if (isToday(date)) {
        groups.today.push(session);
      } else if (isYesterday(date)) {
        groups.yesterday.push(session);
      } else if (isAfter(date, subDays(new Date(), 7))) {
        groups.lastWeek.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  }, [sessions]);

  const hasSessions = sessions.length > 0;

  return (
    <div className="pb-4">
      {!hasSessions && (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-muted-foreground">
            Inga tidigare konversationer.
          </p>
        </div>
      )}

      {/* Helper för att rendera en grupp */}
      {Object.entries(groupedSessions).map(([key, group]) => {
        if (group.length === 0) return null;

        let title = "";
        switch(key) {
            case 'today': title = "Idag"; break;
            case 'yesterday': title = "Igår"; break;
            case 'lastWeek': title = "Senaste 7 dagarna"; break;
            case 'older': title = "Äldre"; break;
        }

        return (
          <div key={key} className="mb-6 animate-in fade-in slide-in-from-left-2 duration-300">
            <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              {title}
            </h4>
            <div className="space-y-[1px]">
              {group.map((session) => (
                <ChatSessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onLoad={() => onLoadSession(session.id)}
                  onEdit={(e) => {
                    e.stopPropagation();
                    onEditSession(session);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

ChatSessionList.displayName = 'ChatSessionList';

export default ChatSessionList;
