import React, { useState, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Folder,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash,
  Move,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useChatFolders } from '@/hooks/useChatFolders';
import type { ChatSession } from '@/hooks/useChatFolders';
import { useGuideSession } from '@/hooks/useGuideSession';
import CreateFolderDialog from './CreateFolderDialog';
import EditSessionNameDialog from './EditSessionNameDialog';
import ChatSessionItem from './ChatSessionItem';
import { cn } from '@/lib/utils';
import { isToday, isYesterday, subDays, isAfter } from 'date-fns';

interface ChatFolderSidebarProps {
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
  onEditSessionName: (sessionId: string, name: string) => void;
  onLoadGuideSession?: () => void;
  onCreateNewSession: () => void;
  onBulkDeleteSessions?: (sessionIds: string[]) => Promise<void> | void;
  className?: string;
}

const ChatFolderSidebar: React.FC<ChatFolderSidebarProps> = memo(({
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onEditSessionName,
  onLoadGuideSession,
  onCreateNewSession,
  onBulkDeleteSessions,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingSession, setEditingSession] = useState<{ id: string; name: string } | null>(null);
  
  const { shouldShowGuide } = useGuideSession();

  const {
    folders,
    sessions,
    createFolder,
    updateFolder,
    deleteFolder,
    moveSessionToFolder,
    getSessionsByFolder,
    loadSessions,
    removeSessionsFromState,
  } = useChatFolders();

  // Filtrera sessioner & mappar
  const filteredFolders = folders.filter((folder) => {
    const nameMatch = folder.name.toLowerCase().includes(searchTerm.toLowerCase());
    // Om sökning pågår, visa mappen om den innehåller matchande sessioner också
    if (searchTerm && !nameMatch) {
       const folderSessions = getSessionsByFolder(folder.id);
       return folderSessions.some(s => s.session_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  const rootSessions = sessions.filter((session) => !session.folder_id);
  const filteredRootSessions = rootSessions.filter((session) =>
    session.session_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleFolder = (folderId: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }
    setExpandedFolders(next);
  };

  // Gruppera root-sessioner (Accordion-stil inuti listan)
  const groupedRootSessions = useMemo(() => {
    const groups = {
      today: [] as ChatSession[],
      yesterday: [] as ChatSession[],
      older: [] as ChatSession[],
    };

    filteredRootSessions.forEach((session) => {
      const date = new Date(session.created_at);
      if (isToday(date)) {
        groups.today.push(session);
      } else if (isYesterday(date)) {
        groups.yesterday.push(session);
      } else {
        groups.older.push(session);
      }
    });
    return groups;
  }, [filteredRootSessions]);

  const renderSessionItemComponent = (session: ChatSession, className?: string) => (
    <ChatSessionItem
      key={session.id}
      session={session}
      isActive={currentSessionId === session.id}
      onLoad={() => onLoadSession(session.id)}
      onDelete={async () => {
        await Promise.resolve(onDeleteSession(session.id));
        removeSessionsFromState([session.id]);
        await loadSessions();
      }}
      onEditName={(newName) => onEditSessionName(session.id, newName)}
      onMoveSession={moveSessionToFolder}
      draggable
      className={className}
    />
  );

return (
    <aside className={cn(
      // ÄNDRAT: border-r byttes till border-l (border-left)
      "flex h-full w-full flex-col bg-background/50 backdrop-blur-xl border-l border-border/40",
      className
    )}>
      {/* --- Header / Top Actions --- */}
      <div className="p-3 pb-2 space-y-3">
        <Button
          onClick={onCreateNewSession}
          className="w-full justify-start gap-2 h-10 shadow-sm border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
          Ny konversation
        </Button>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Sök..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/30 border-transparent focus-visible:bg-background focus-visible:border-primary/30"
          />
        </div>
      </div>

      {/* --- Scrollable Content --- */}
      <ScrollArea className="flex-1 px-3">
        <div className="pb-4 space-y-4">
          
          {/* Guide / Intro */}
          {shouldShowGuide && onLoadGuideSession && (
            <div className="mt-2">
               <Button
                variant="outline"
                onClick={onLoadGuideSession}
                className="w-full justify-start gap-3 h-auto py-3 px-3 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10"
              >
                <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-medium">Starta guiden</div>
                  <div className="text-xs text-muted-foreground truncate">Lär dig funktionerna</div>
                </div>
              </Button>
            </div>
          )}

          {/* --- Folders Section (Accordion Style) --- */}
          {filteredFolders.length > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mappar</span>
                <CreateFolderDialog
                  onCreateFolder={createFolder}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
              
              {filteredFolders.map((folder) => {
                const folderSessions = getSessionsByFolder(folder.id).filter(s => 
                  s.session_name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                const isExpanded = expandedFolders.has(folder.id) || Boolean(searchTerm);
                const isActiveInFolder = folderSessions.some(s => s.id === currentSessionId);

                return (
                  <div key={folder.id} className="space-y-0.5">
                    <div className={cn(
                        "group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                        isActiveInFolder ? "bg-accent/40" : "hover:bg-muted/40"
                      )}
                    >
                      <div 
                        className="flex items-center gap-2 flex-1 min-w-0"
                        onClick={() => toggleFolder(folder.id)}
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        <Folder className="h-3.5 w-3.5 text-primary/70 fill-primary/10" />
                        <span className="text-sm font-medium truncate text-foreground/90">{folder.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{folderSessions.length}</span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                             const newName = prompt('Nytt mappnamn', folder.name);
                             if (newName) updateFolder(folder.id, { name: newName });
                          }}>
                            <Edit className="mr-2 h-4 w-4" /> Byt namn
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Ta bort mapp
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {isExpanded && (
                      <div className="pl-3 border-l ml-3 border-border/40 space-y-0.5">
                        {folderSessions.length > 0 ? (
                          folderSessions.map(session => renderSessionItemComponent(session))
                        ) : (
                          <div className="text-xs text-muted-foreground px-2 py-1 italic">Tom mapp</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- Root Sessions (Timeline) --- */}
          <div className="space-y-4">
            {groupedRootSessions.today.length > 0 && (
              <div className="space-y-1">
                <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Idag</h4>
                {groupedRootSessions.today.map(s => renderSessionItemComponent(s))}
              </div>
            )}
            
            {groupedRootSessions.yesterday.length > 0 && (
              <div className="space-y-1">
                <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Igår</h4>
                {groupedRootSessions.yesterday.map(s => renderSessionItemComponent(s))}
              </div>
            )}

            {groupedRootSessions.older.length > 0 && (
              <div className="space-y-1">
                <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Äldre</h4>
                {groupedRootSessions.older.map(s => renderSessionItemComponent(s))}
              </div>
            )}

            {sessions.length === 0 && (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-muted-foreground">Inga konversationer ännu.</p>
                <Button variant="link" onClick={onCreateNewSession} className="text-primary mt-1">
                  Starta en ny
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <EditSessionNameDialog
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        currentName={editingSession?.name || ''}
        onSave={(name) => {
          if (editingSession) onEditSessionName(editingSession.id, name);
          setEditingSession(null);
        }}
      />
    </aside>
  );
});

ChatFolderSidebar.displayName = 'ChatFolderSidebar';

export default ChatFolderSidebar;
