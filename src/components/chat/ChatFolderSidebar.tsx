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

const SESSION_NAME_CHARACTER_LIMIT = 32;

const formatSessionName = (name: string) => {
  const characters = Array.from(name);
  if (characters.length <= SESSION_NAME_CHARACTER_LIMIT) {
    return name;
  }

  const truncated = characters
    .slice(0, SESSION_NAME_CHARACTER_LIMIT - 1)
    .join('')
    .replace(/[\s\u00A0]+$/u, '');

  return `${truncated}\u2026`;
};

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

    const displayName = formatSessionName(session.session_name);

    return (
      <li key={session.id} className={cn('transition-colors', depth > 0 && 'pl-3')}>
        <div
          className={cn(
            'group flex items-stretch overflow-hidden rounded-ai-md border border-transparent transition-colors duration-150 focus-within:border-ai-border/60 focus-within:ring-1 focus-within:ring-ai-border/60',
            isActive
              ? 'border-ai-border/70 bg-ai-surface text-foreground shadow-lg ring-1 ring-ai-border/70'
              : 'text-ai-text-muted hover:border-ai-border/50 hover:bg-ai-surface/70 hover:text-foreground focus-within:border-ai-border/50 focus-within:bg-ai-surface/70 focus-within:text-foreground',
          )}
        >
          <button
            type="button"
            onClick={() => onLoadSession(session.id)}
            className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left text-[15px] leading-6 transition-colors focus-visible:outline-none"
            title={session.session_name}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border border-transparent transition-colors duration-150',
                isActive
                  ? 'border-ai-border/60 bg-ai-surface text-foreground'
                  : 'border-ai-border/30 bg-ai-surface-muted/70 text-ai-text-muted',
              )}
            >
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="min-w-0 flex-1 truncate font-medium" title={session.session_name}>
              {displayName}
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Konversationsalternativ"
                className={cn(
                  'relative flex h-full w-10 shrink-0 items-center justify-center rounded-none border-l border-white/5 bg-transparent text-ai-text-muted transition-colors duration-150 focus-visible:ring-0 focus-visible:ring-offset-0',
                  'hover:border-ai-border/50 hover:bg-ai-surface/80 hover:text-foreground',
                  'data-[state=open]:border-ai-border/50 data-[state=open]:bg-ai-surface/80 data-[state=open]:text-foreground',
                  'md:border-transparent md:bg-transparent md:opacity-0 md:group-hover:border-ai-border/40 md:group-hover:bg-ai-surface/60 md:group-hover:opacity-100 md:group-focus-within:border-ai-border/40 md:group-focus-within:bg-ai-surface/60 md:group-focus-within:opacity-100',
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 rounded-ai-md border border-ai-border/60 bg-ai-surface/95 p-1 shadow-xl backdrop-blur"
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
                className="text-red-500"
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
      <div className="space-y-3">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.08em] text-ai-text-muted/80">{label}</p>
        <ul className="space-y-2">
          {sessionList.map((session) => renderSessionItem(session))}
        </ul>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'group/sidebar relative flex h-full min-w-[260px] flex-col overflow-hidden border-r border-ai-border/50 bg-gradient-to-b from-ai-surface-muted/90 via-ai-surface-muted/70 to-ai-surface/85',
        'shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]"
      />
      <div className="relative flex h-full flex-col">
        <div className="relative z-10 px-5 pb-5 pt-6">
          <div className="flex flex-col gap-4">
            <div className="rounded-ai-md border border-white/5 bg-ai-surface/90 p-3 shadow-sm">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Button
                  type="button"
                  onClick={onCreateNewSession}
                  variant="ghost"
                  className="w-full justify-center gap-2 rounded-ai-sm border border-ai-border/40 bg-ai-surface px-3 py-2 text-[15px] font-semibold text-foreground shadow-sm transition hover:border-ai-border/60 hover:bg-ai-surface/90 hover:text-foreground focus-visible:ring-ai-border/60 focus-visible:ring-offset-0"
                >
                  <Plus className="h-4 w-4" />
                  Ny konversation
                </Button>
                <CreateFolderDialog
                  onCreateFolder={createFolder}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-full min-h-[40px] justify-center gap-2 rounded-ai-sm border border-transparent bg-ai-surface/80 px-3 text-[14px] font-medium text-ai-text-muted transition hover:border-ai-border/60 hover:bg-ai-surface/90 hover:text-foreground focus-visible:ring-ai-border/60 focus-visible:ring-offset-0"
                    >
                      <Folder className="h-4 w-4" />
                      Ny mapp
                    </Button>
                  }
                />
              </div>
              {onLoadGuideSession && (
                <Button
                  type="button"
                  onClick={onLoadGuideSession}
                  variant="ghost"
                  className="mt-2 w-full justify-center gap-2 rounded-ai-sm border border-primary/40 bg-primary/10 px-3 py-2 text-[15px] font-semibold text-primary transition hover:border-primary/60 hover:bg-primary/15 focus-visible:ring-primary/50 focus-visible:ring-offset-0"
                >
                  <Sparkles className="h-4 w-4" />
                  AI-guide
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ai-text-muted/70" />
              <Input
                placeholder="Sök konversationer"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 rounded-ai-sm border border-white/5 bg-ai-surface/90 pl-10 text-[15px] text-foreground placeholder:text-ai-text-muted focus-visible:border-ai-border focus-visible:ring-0"
              />
            </div>

            <Button
              type="button"
              onClick={handleClearUnorganizedSessions}
              variant="ghost"
              disabled={!hasRootSessions || isClearingRoot}
              className="flex w-full items-center justify-center gap-2 rounded-ai-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-[14px] font-medium text-destructive transition hover:bg-destructive/15 focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-destructive/20"
            >
              <Trash className="h-4 w-4" />
              {isClearingRoot
                ? 'Rensar chattar...'
                : hasRootSessions
                  ? 'Rensa osorterade chattar'
                  : 'Inga osorterade chattar'}
            </Button>
          </div>
        </div>

        <div className="relative z-10 h-px w-full bg-white/5" />

        <nav className="relative z-0 flex-1 space-y-6 overflow-y-auto px-4 pb-6 pt-6">
          {shouldShowGuide && onLoadGuideSession && (
            <button
              type="button"
              onClick={onLoadGuideSession}
              className="group flex w-full items-center gap-3 rounded-ai-md border border-white/5 bg-ai-surface/90 px-4 py-4 text-left text-[15px] leading-6 text-foreground shadow-sm transition hover:border-ai-border/60 hover:bg-ai-surface"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition group-hover:scale-105">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">Upptäck assistenten</p>
                <p className="truncate text-sm text-ai-text-muted">Kom igång med en guidning</p>
              </div>
            </button>
          )}

          {filteredFolders.map((folder) => {
            const folderSessions = getSessionsByFolder(folder.id).filter((session) =>
              session.session_name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            const isExpanded = expandedFolders.has(folder.id) || Boolean(searchTerm);
            const hasActiveSession = folderSessions.some((session) => session.id === currentSessionId);

            return (
              <div key={folder.id} className="space-y-3">
                <div
                  className={cn(
                    'group flex items-stretch overflow-hidden rounded-ai-md border border-transparent transition-colors duration-150 focus-within:border-ai-border/60 focus-within:ring-1 focus-within:ring-ai-border/60',
                    hasActiveSession
                      ? 'border-ai-border/70 bg-ai-surface text-foreground shadow-lg ring-1 ring-ai-border/70'
                      : 'text-ai-text-muted hover:border-ai-border/50 hover:bg-ai-surface/70 hover:text-foreground focus-within:border-ai-border/50 focus-within:bg-ai-surface/70 focus-within:text-foreground',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left text-[15px] leading-6 transition-colors focus-visible:outline-none"
                  >
                    <span className="flex items-center gap-3 truncate font-medium">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span
                        className="flex h-2.5 w-2.5 items-center justify-center rounded-full border border-white/20"
                        style={{ backgroundColor: folder.color || '#d4d7dc' }}
                      />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className="ml-auto rounded-full bg-ai-surface/70 px-2 py-0.5 text-[12px] text-ai-text-muted transition group-hover:bg-ai-surface group-hover:text-foreground/80 group-focus-within:bg-ai-surface group-focus-within:text-foreground/80">
                      {folderSessions.length}
                    </span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mappalternativ"
                        className={cn(
                          'relative flex h-full w-10 shrink-0 items-center justify-center rounded-none border-l border-white/5 bg-transparent text-ai-text-muted transition-colors duration-150 focus-visible:ring-0 focus-visible:ring-offset-0',
                          'hover:border-ai-border/50 hover:bg-ai-surface/80 hover:text-foreground',
                          'data-[state=open]:border-ai-border/50 data-[state=open]:bg-ai-surface/80 data-[state=open]:text-foreground',
                          'md:border-transparent md:bg-transparent md:opacity-0 md:group-hover:border-ai-border/40 md:group-hover:bg-ai-surface/60 md:group-hover:opacity-100 md:group-focus-within:border-ai-border/40 md:group-focus-within:bg-ai-surface/60 md:group-focus-within:opacity-100',
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 rounded-ai-md border border-ai-border/60 bg-ai-surface/95 p-1 shadow-xl backdrop-blur"
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
                      <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-red-500">
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
            <div className="rounded-ai-md border border-white/5 bg-ai-surface/90 px-4 py-6 text-center text-sm text-ai-text-muted/80 shadow-sm">
              Inga konversationer ännu
            </div>
          )}
        </nav>
      </div>

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
