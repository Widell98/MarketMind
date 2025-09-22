import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  MessageSquare,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useChatFolders, ChatFolder, ChatSession } from '@/hooks/useChatFolders';
import { useGuideSession } from '@/hooks/useGuideSession';
import CreateFolderDialog from './CreateFolderDialog';
import EditSessionNameDialog from './EditSessionNameDialog';
import { cn } from '@/lib/utils';

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
  const [isClearingRoot, setIsClearingRoot] = useState(false);
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

  const rootSessions = sessions.filter((session) => !session.folder_id);

  const filteredSessions = sessions.filter((session) =>
    session.session_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredFolders = folders.filter((folder) => {
    const folderMatches = folder.name.toLowerCase().includes(searchTerm.toLowerCase());
    const folderSessions = getSessionsByFolder(folder.id);
    const sessionMatches = folderSessions.some((session) =>
      session.session_name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return folderMatches || sessionMatches;
  });

  const unorganizedSessions = filteredSessions.filter((session) => !session.folder_id);
  const hasRootSessions = rootSessions.length > 0;

  const toggleFolder = (folderId: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }
    setExpandedFolders(next);
  };

  const handleEditSession = (sessionId: string, sessionName: string) => {
    setEditingSession({ id: sessionId, name: sessionName });
  };

  const handleSaveSessionName = (newName: string) => {
    if (editingSession) {
      onEditSessionName(editingSession.id, newName);
      setEditingSession(null);
    }
  };

  const handleClearUnorganizedSessions = async () => {
    if (isClearingRoot || rootSessions.length === 0) {
      return;
    }

    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(
            'Vill du rensa alla osorterade chattar? Mapplagrade chattar ligger kvar.',
          );

    if (!confirmed) {
      return;
    }

    setIsClearingRoot(true);
    const sessionIds = rootSessions.map((session) => session.id);

    try {
      if (onBulkDeleteSessions) {
        await Promise.resolve(onBulkDeleteSessions(sessionIds));
      } else {
        for (const sessionId of sessionIds) {
          await Promise.resolve(onDeleteSession(sessionId));
        }
      }

      removeSessionsFromState(sessionIds);
      await loadSessions();
    } catch (error) {
      console.error('Error clearing unorganized sessions:', error);
    } finally {
      setIsClearingRoot(false);
    }
  };

  const getTodaySessions = (sessionList: ChatSession[]) => {
    const today = new Date();
    return sessionList.filter((session) => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === today.toDateString();
    });
  };

  const getYesterdaySessions = (sessionList: ChatSession[]) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return sessionList.filter((session) => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === yesterday.toDateString();
    });
  };

  const getOlderSessions = (sessionList: ChatSession[]) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return sessionList.filter((session) => {
      const sessionDate = new Date(session.created_at);
      return (
        sessionDate.toDateString() !== today.toDateString() &&
        sessionDate.toDateString() !== yesterday.toDateString()
      );
    });
  };

  const renderSessionItem = (session: ChatSession, depth = 0) => {
    const isActive = currentSessionId === session.id;

    return (
      <li key={session.id} className={cn(depth > 0 && 'pl-2')}>
        <div
          className={cn(
            'group flex items-center gap-2 rounded-ai-sm px-2 py-2 transition-colors focus-within:ring-1 focus-within:ring-ai-border/70',
            isActive
              ? 'bg-ai-surface text-foreground shadow-sm ring-1 ring-ai-border/70'
              : 'text-ai-text-muted hover:bg-ai-surface/80 hover:text-foreground focus-within:bg-ai-surface/80 focus-within:text-foreground',
          )}
        >
          <button
            type="button"
            onClick={() => onLoadSession(session.id)}
            className="flex flex-1 items-center gap-3 pr-1 text-left text-[15px] leading-6"
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                isActive
                  ? 'bg-ai-surface text-foreground'
                  : 'bg-ai-surface-muted/60 text-ai-text-muted',
              )}
            >
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="min-w-0 flex-1 truncate font-medium">{session.session_name}</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Konversationsalternativ"
                className="h-7 w-7 rounded-full text-ai-text-muted transition-opacity hover:bg-ai-surface md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-ai-sm border border-ai-border/60 bg-ai-surface p-1 shadow-lg"
            >
              <DropdownMenuItem onClick={() => handleEditSession(session.id, session.session_name)}>
                <Edit className="mr-2 h-4 w-4" />
                Byt namn
              </DropdownMenuItem>
              {folders.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Move className="mr-2 h-4 w-4" />
                    Flytta till mapp
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="rounded-ai-sm border border-ai-border/60 bg-ai-surface shadow-lg">
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => moveSessionToFolder(session.id, folder.id)}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => moveSessionToFolder(session.id, null)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Ta bort från mapp
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await Promise.resolve(onDeleteSession(session.id));
                  removeSessionsFromState([session.id]);
                  await loadSessions();
                }}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>
    );
  };

  const renderSessionGroup = (sessionList: ChatSession[], label: string) => {
    if (sessionList.length === 0) return null;

    return (
      <div className="mt-6 space-y-2 first:mt-0">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.08em] text-ai-text-muted">{label}</p>
        <ul className="space-y-2">
          {sessionList.map((session) => renderSessionItem(session))}
        </ul>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'flex h-full min-w-[260px] flex-col border-r border-ai-border/60 bg-ai-surface-muted/60',
        className,
      )}
    >
      <div className="px-4 pb-4 pt-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onCreateNewSession}
            variant="ghost"
            size="sm"
            className="flex-1 justify-center gap-2 rounded-ai-sm border border-ai-border/70 bg-ai-surface px-3 py-2 text-[15px] font-medium text-foreground shadow-sm transition hover:bg-ai-surface-muted/80 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ai-border/70 focus-visible:ring-offset-0"
          >
            <Plus className="h-4 w-4" />
            Ny konversation
          </Button>
          <CreateFolderDialog
            onCreateFolder={createFolder}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-transparent text-ai-text-muted transition hover:border-ai-border/60 hover:bg-ai-surface hover:text-foreground"
                aria-label="Skapa mapp"
              >
                <Folder className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ai-text-muted" />
          <Input
            placeholder="Sök konversationer"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 rounded-ai-sm border border-transparent bg-ai-surface pl-10 text-[15px] text-foreground placeholder:text-ai-text-muted focus-visible:border-ai-border focus-visible:ring-0"
          />
        </div>

        <Button
          type="button"
          onClick={handleClearUnorganizedSessions}
          variant="ghost"
          size="sm"
          disabled={!hasRootSessions || isClearingRoot}
          className="mt-3 w-full justify-center gap-2 rounded-ai-sm border border-ai-border/60 bg-ai-surface px-3 py-2 text-[14px] font-medium text-ai-text-muted transition hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive focus-visible:ring-1 focus-visible:ring-destructive/40 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-destructive/15"
        >
          <Trash className="h-4 w-4 text-destructive" />
          {isClearingRoot
            ? 'Rensar chattar...'
            : hasRootSessions
              ? 'Rensa osorterade chattar'
              : 'Inga osorterade chattar'}
        </Button>
      </div>

      <div className="border-t border-ai-border/60" />

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {shouldShowGuide && onLoadGuideSession && (
          <div className="mb-6 px-1">
            <button
              onClick={onLoadGuideSession}
              className="flex w-full items-center gap-3 rounded-ai-sm bg-ai-surface px-3 py-3 text-left text-[15px] leading-6 text-foreground shadow-sm transition hover:bg-ai-surface/90"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">Upptäck assistenten</p>
                <p className="truncate text-sm text-ai-text-muted">Kom igång med en guidning</p>
              </div>
            </button>
          </div>
        )}

        {filteredFolders.map((folder) => {
          const folderSessions = getSessionsByFolder(folder.id).filter((session) =>
            session.session_name.toLowerCase().includes(searchTerm.toLowerCase()),
          );
          const isExpanded = expandedFolders.has(folder.id) || Boolean(searchTerm);
          const hasActiveSession = folderSessions.some((session) => session.id === currentSessionId);

          return (
            <div key={folder.id} className="mt-6 space-y-2 first:mt-0">
              <div
                className={cn(
                  'group flex items-center gap-2 rounded-ai-sm px-2 py-2 transition-colors focus-within:ring-1 focus-within:ring-ai-border/70',
                  hasActiveSession
                    ? 'bg-ai-surface text-foreground shadow-sm ring-1 ring-ai-border/70'
                    : 'text-ai-text-muted hover:bg-ai-surface/80 hover:text-foreground focus-within:bg-ai-surface/80 focus-within:text-foreground',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="flex flex-1 items-center gap-3 pr-1 text-left text-[15px] leading-6"
                >
                  <span className="flex items-center gap-3 truncate font-medium">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: folder.color || '#d4d7dc' }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </span>
                  <span className="ml-auto text-xs text-ai-text-muted transition-colors group-hover:text-foreground/80 group-focus-within:text-foreground/80">
                    {folderSessions.length}
                  </span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Mappalternativ"
                      className="h-7 w-7 rounded-full text-ai-text-muted transition-opacity hover:bg-ai-surface md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 rounded-ai-sm border border-ai-border/60 bg-ai-surface p-1 shadow-lg"
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        const newName = prompt('Nytt mappnamn', folder.name);
                        if (newName && newName !== folder.name) {
                          updateFolder(folder.id, { name: newName });
                        }
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Byt namn
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-red-600">
                      <Trash className="mr-2 h-4 w-4" />
                      Ta bort mapp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isExpanded && folderSessions.length > 0 && (
                <ul className="space-y-2 pl-4">
                  {folderSessions.map((session) => renderSessionItem(session, 1))}
                </ul>
              )}
            </div>
          );
        })}

        {renderSessionGroup(getTodaySessions(unorganizedSessions), 'Idag')}
        {renderSessionGroup(getYesterdaySessions(unorganizedSessions), 'Igår')}
        {renderSessionGroup(getOlderSessions(unorganizedSessions), 'Tidigare')}

        {sessions.length === 0 && (
          <div className="mt-12 text-center text-sm text-ai-text-muted">
            Inga konversationer ännu
          </div>
        )}
      </nav>

      <EditSessionNameDialog
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        currentName={editingSession?.name || ''}
        onSave={handleSaveSessionName}
      />
    </aside>
  );
});

ChatFolderSidebar.displayName = 'ChatFolderSidebar';

export default ChatFolderSidebar;
