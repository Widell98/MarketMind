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
import { useChatFolders } from '@/hooks/useChatFolders';
import type { ChatFolder, ChatSession } from '@/hooks/useChatFolders';
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
      <li key={session.id} className={cn('mb-0.5', depth > 0 && 'pl-3')}>
        <div
          className={cn(
            'group/session relative flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200',
            isActive
              ? 'bg-white text-foreground shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10'
              : 'text-muted-foreground hover:bg-black/5 hover:text-foreground dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
          )}
        >
          <button
            type="button"
            onClick={() => onLoadSession(session.id)}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-[13px] font-medium leading-5"
          >
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground/50 group-hover/session:text-foreground/70'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <span className="min-w-0 flex-1 truncate" title={session.session_name}>
              {session.session_name}
            </span>
          </button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Konversationsalternativ"
                className={cn(
                  "absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full opacity-0 transition-opacity hover:bg-black/5 dark:hover:bg-white/10",
                  "group-hover/session:opacity-100 group-focus-within/session:opacity-100",
                  isActive && "hover:bg-gray-100 dark:hover:bg-white/20"
                )}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border border-gray-100 bg-white/95 p-1 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/95"
            >
              <DropdownMenuItem onClick={() => handleEditSession(session.id, session.session_name)}>
                <Edit className="mr-2 h-3.5 w-3.5" />
                Byt namn
              </DropdownMenuItem>
              {folders.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Move className="mr-2 h-3.5 w-3.5" />
                    Flytta till mapp
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="rounded-xl border border-gray-100 bg-white/95 shadow-xl dark:border-white/10 dark:bg-zinc-900/95">
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => moveSessionToFolder(session.id, folder.id)}
                      >
                        <Folder className="mr-2 h-3.5 w-3.5" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => moveSessionToFolder(session.id, null)}>
                      <Trash className="mr-2 h-3.5 w-3.5" />
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
                className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
              >
                <Trash className="mr-2 h-3.5 w-3.5" />
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
      <section className="space-y-0.5">
        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</p>
        <ul className="space-y-0.5">
          {sessionList.map((session) => renderSessionItem(session))}
        </ul>
      </section>
    );
  };

  return (
    <aside
      className={cn(
        'group/sidebar relative flex h-full min-h-0 w-[280px] flex-shrink-0 flex-col overflow-hidden border-r border-gray-200/60 bg-gray-50/50 backdrop-blur-xl transition-all duration-300 dark:border-white/5 dark:bg-black/20',
        className,
      )}
    >
      <header className="flex-shrink-0 px-3 pt-4 pb-2">
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sök"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 w-full rounded-lg border-transparent bg-black/5 pl-9 text-[13px] font-normal transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-white/10 dark:focus-visible:bg-white/10 placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 pl-1">
            Bibliotek
          </span>
          <div className="flex items-center gap-0.5">
             <CreateFolderDialog
                onCreateFolder={createFolder}
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10" title="Ny mapp">
                    <Folder className="h-3.5 w-3.5" />
                  </Button>
                }
             />
             <Button
                variant="ghost"
                size="icon"
                onClick={onCreateNewSession}
                className="h-6 w-6 text-muted-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                title="Ny konversation"
             >
                <Plus className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </header>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
        <div className="flex flex-col gap-1">
          {shouldShowGuide && onLoadGuideSession && (
            <div className="mb-2 px-1">
              <button
                onClick={onLoadGuideSession}
                className="flex w-full items-center gap-3 rounded-xl border border-primary/10 bg-gradient-to-br from-white to-gray-50 px-3 py-3 text-left text-[13px] leading-relaxed text-foreground shadow-sm transition-all hover:border-primary/20 hover:shadow-md dark:from-white/5 dark:to-white/0 dark:border-white/5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">Upptäck</p>
                  <p className="truncate text-xs text-muted-foreground">Kom igång med en guide</p>
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
              <section key={folder.id} className="space-y-0.5">
                <div
                  className={cn(
                    'group/folder relative flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                    hasActiveSession
                      ? 'bg-black/5 text-foreground dark:bg-white/10'
                      : 'text-muted-foreground hover:bg-black/5 hover:text-foreground dark:text-gray-400 dark:hover:bg-white/5'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-[13px] font-medium leading-5"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      )}
                      
                      <span className="truncate" title={folder.name}>
                        {folder.name}
                      </span>
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/50">
                      {folderSessions.length}
                    </span>
                  </button>

                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mappalternativ"
                        className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full opacity-0 transition-opacity hover:bg-black/5 group-hover/folder:opacity-100 group-focus-within/folder:opacity-100 dark:hover:bg-white/10"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl border border-gray-100 bg-white/95 p-1 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/95"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          const newName = prompt('Nytt mappnamn', folder.name);
                          if (newName && newName !== folder.name) {
                            updateFolder(folder.id, { name: newName });
                          }
                        }}
                      >
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Byt namn
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                        <Trash className="mr-2 h-3.5 w-3.5" />
                        Ta bort mapp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isExpanded && folderSessions.length > 0 && (
                  <ul className="space-y-0.5 pl-3">
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
            <div className="py-12 text-center text-[13px] text-muted-foreground/50">
              Inga konversationer
            </div>
          )}
        </div>
      </nav>

      {hasRootSessions && (
        <div className="flex-shrink-0 border-t border-gray-200/60 p-3 dark:border-white/5">
          <Button
            type="button"
            onClick={handleClearUnorganizedSessions}
            variant="ghost"
            size="sm"
            disabled={isClearingRoot}
            className="w-full justify-start gap-2 h-8 px-2 text-[11px] font-medium text-muted-foreground/70 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:text-red-400"
          >
            <Trash className="h-3.5 w-3.5" />
            {isClearingRoot ? 'Rensar...' : 'Rensa osorterade'}
          </Button>
        </div>
      )}

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
