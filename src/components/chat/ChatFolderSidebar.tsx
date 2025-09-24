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
      <li key={session.id} className={cn(depth > 0 && 'pl-3')}>
        <div
          className={cn(
            'group/session relative flex items-center gap-2 rounded-ai-md border border-transparent px-2.5 py-2.5 transition-colors focus-within:border-ai-border/60 focus-within:bg-ai-surface/80 focus-within:text-foreground',
            isActive
              ? 'border-ai-border/60 bg-ai-surface text-foreground shadow-sm'
              : 'text-ai-text-muted hover:border-ai-border/50 hover:bg-ai-surface/70 hover:text-foreground',
          )}
        >
          <button
            type="button"
            onClick={() => onLoadSession(session.id)}
            className="flex min-w-0 flex-1 items-center gap-3 pr-10 text-left text-[15px] leading-6"
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-transparent bg-ai-surface/70 text-ai-text-muted transition-colors group-hover/session:border-ai-border/50 group-hover/session:bg-ai-surface group-hover/session:text-foreground',
                isActive && 'border-ai-border/60 bg-ai-surface text-foreground',
              )}
            >
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="min-w-0 flex-1 truncate font-medium" title={session.session_name}>
              {session.session_name}
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Konversationsalternativ"
                className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-ai-text-muted transition-opacity hover:bg-ai-surface md:opacity-0 md:group-hover/session:opacity-100 md:group-focus-within/session:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-ai-md border border-ai-border/60 bg-ai-surface p-1 shadow-lg"
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
                  <DropdownMenuSubContent className="rounded-ai-md border border-ai-border/60 bg-ai-surface shadow-lg">
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
      <section className="space-y-2">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-ai-text-muted/80">{label}</p>
        <ul className="space-y-2">
          {sessionList.map((session) => renderSessionItem(session))}
        </ul>
      </section>
    );
  };

  return (
    <aside
      className={cn(
        'group/sidebar relative flex h-full min-h-0 w-[280px] flex-shrink-0 flex-col overflow-hidden border-r border-ai-border/60 bg-ai-surface-muted/80 backdrop-blur-sm supports-[backdrop-filter]:bg-ai-surface-muted/70',
        className,
      )}
    >
      <header className="sticky top-0 z-20 border-b border-ai-border/60 bg-ai-surface-muted/90 px-4 pb-5 pt-6 backdrop-blur-sm supports-[backdrop-filter]:bg-ai-surface-muted/70">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ai-text-muted/60">
              Översikt
            </p>
            <h2 className="text-lg font-semibold text-foreground">Konversationer</h2>
          </div>
          <CreateFolderDialog
            onCreateFolder={createFolder}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-transparent text-ai-text-muted transition-colors hover:border-ai-border/60 hover:bg-ai-surface hover:text-foreground"
                aria-label="Skapa mapp"
              >
                <Folder className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        <Button
          type="button"
          onClick={onCreateNewSession}
          variant="default"
          className="mt-4 h-10 w-full justify-center rounded-ai-md text-[15px] font-semibold shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
        >
          <Plus className="h-4 w-4" />
          Ny konversation
        </Button>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ai-text-muted" />
          <Input
            placeholder="Sök konversationer"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 rounded-ai-md border border-ai-border/60 bg-ai-surface pl-11 text-sm text-foreground placeholder:text-ai-text-muted focus-visible:border-primary/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <Button
          type="button"
          onClick={handleClearUnorganizedSessions}
          variant="ghost"
          size="sm"
          disabled={!hasRootSessions || isClearingRoot}
          className="mt-3 self-end h-auto gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium text-ai-text-muted transition-colors hover:bg-ai-surface/70 hover:text-destructive focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash className="h-3.5 w-3.5 text-destructive" />
          {isClearingRoot
            ? 'Rensar chattar...'
            : hasRootSessions
              ? 'Rensa osorterade'
              : 'Inga osorterade'}
        </Button>
      </header>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-6">
        <div className="flex flex-col gap-6">
          {shouldShowGuide && onLoadGuideSession && (
            <section className="px-1">
              <button
                onClick={onLoadGuideSession}
                className="flex w-full items-center gap-3 rounded-ai-md border border-ai-border/50 bg-ai-surface px-3 py-3 text-left text-[15px] leading-6 text-foreground shadow-sm transition hover:border-primary/40 hover:bg-ai-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">Upptäck assistenten</p>
                  <p className="truncate text-sm text-ai-text-muted">Kom igång med en guidning</p>
                </div>
              </button>
            </section>
          )}

          {filteredFolders.map((folder) => {
            const folderSessions = getSessionsByFolder(folder.id).filter((session) =>
              session.session_name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            const isExpanded = expandedFolders.has(folder.id) || Boolean(searchTerm);
            const hasActiveSession = folderSessions.some((session) => session.id === currentSessionId);

            return (
              <section key={folder.id} className="space-y-2">
                <div
                  className={cn(
                    'group/folder relative flex items-center gap-2 rounded-ai-md border border-transparent px-2.5 py-2.5 transition-colors focus-within:border-ai-border/60 focus-within:bg-ai-surface/80 focus-within:text-foreground',
                    hasActiveSession
                      ? 'border-ai-border/60 bg-ai-surface text-foreground shadow-sm'
                      : 'text-ai-text-muted hover:border-ai-border/50 hover:bg-ai-surface/70 hover:text-foreground',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 pr-10 text-left text-[15px] leading-6"
                  >
                    <span className="flex min-w-0 items-center gap-3 font-medium">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: folder.color || '#d4d7dc' }}
                      />
                      <span className="truncate" title={folder.name}>
                        {folder.name}
                      </span>
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-ai-text-muted transition-colors group-hover/folder:text-foreground/80 group-focus-within/folder:text-foreground/80">
                      {folderSessions.length}
                    </span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mappalternativ"
                        className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-ai-text-muted transition-opacity hover:bg-ai-surface md:opacity-0 md:group-hover/folder:opacity-100 md:group-focus-within/folder:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-ai-md border border-ai-border/60 bg-ai-surface p-1 shadow-lg"
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
                  <ul className="space-y-2 border-l border-ai-border/30 pl-4">
                    {folderSessions.map((session) => renderSessionItem(session, 1))}
                  </ul>
                )}
              </section>
            );
          })}

          {renderSessionGroup(getTodaySessions(unorganizedSessions), 'Idag')}
          {renderSessionGroup(getYesterdaySessions(unorganizedSessions), 'Igår')}
          {renderSessionGroup(getOlderSessions(unorganizedSessions), 'Tidigare')}

          {sessions.length === 0 && (
            <div className="py-12 text-center text-sm text-ai-text-muted">
              Inga konversationer ännu
            </div>
          )}
        </div>
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
