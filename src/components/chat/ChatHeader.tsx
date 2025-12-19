import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  History,
  Zap,
  Edit2
} from 'lucide-react';
import ChatSessionList from './ChatSessionList';
import EditSessionNameDialog from './EditSessionNameDialog';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
}

interface ChatHeaderProps {
  showSessions: boolean;
  setShowSessions: (show: boolean) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  onNewSession: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditSessionName: (sessionId: string, newName: string) => void;
}

const ChatHeader = ({
  showSessions,
  setShowSessions,
  sessions,
  currentSessionId,
  isLoading,
  onNewSession,
  onLoadSession,
  onDeleteSession,
  onEditSessionName
}: ChatHeaderProps) => {
  const [editingSession, setEditingSession] = useState<ChatSession | null>(null);

  const currentSession = sessions.find(session => session.id === currentSessionId);

  const handleEditSessionName = (newName: string) => {
    if (editingSession) {
      onEditSessionName(editingSession.id, newName);
      setEditingSession(null);
    }
  };

  return (
    <div className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        
        {/* Left: Title & Icon */}
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold truncate leading-none">
                {currentSession ? currentSession.session_name : 'Ny konversation'}
              </h2>
              {currentSession && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingSession(currentSession)}
                  className="h-5 w-5 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Edit2 className="h-3 w-3" />
                  <span className="sr-only">Redigera namn</span>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate leading-none mt-1">
              AI Portfolio Assistent
            </p>
          </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSessions(!showSessions)}
            className={cn(
                "h-9 px-2 sm:px-3 text-muted-foreground hover:text-foreground",
                showSessions && "bg-accent text-accent-foreground"
            )}
          >
            <History className="mr-0 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Historik</span>
            {showSessions ? (
                <ChevronUp className="ml-1 sm:ml-2 h-3 w-3" />
            ) : (
                <ChevronDown className="ml-1 sm:ml-2 h-3 w-3" />
            )}
          </Button>

          <Button
            size="sm"
            onClick={onNewSession}
            disabled={isLoading}
            className="h-9 px-3 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Ny Chatt</span>
            <span className="sm:hidden">Ny</span>
          </Button>
        </div>
      </div>

      {/* History Drawer */}
      <Collapsible open={showSessions}>
        <CollapsibleContent className="border-b bg-muted/10 shadow-inner">
          <div className="container max-w-3xl py-4">
            <div className="mb-3 flex items-center justify-between px-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tidigare sessioner
                </h3>
            </div>
            <ScrollArea className="h-[40vh] sm:h-[300px]">
              <ChatSessionList
                sessions={sessions}
                currentSessionId={currentSessionId}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
                onEditSession={setEditingSession}
              />
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <EditSessionNameDialog
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        currentName={editingSession?.session_name || ''}
        onSave={handleEditSessionName}
      />
    </div>
  );
};

export default ChatHeader;
