import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Folder, ChevronDown, ChevronRight, MoreHorizontal, Edit, Trash, Move, MessageSquare } from 'lucide-react';
import { useChatFolders } from '@/hooks/useChatFolders';
import { useGuideSession } from '@/hooks/useGuideSession';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CreateFolderDialog from './CreateFolderDialog';
import EditSessionNameDialog from './EditSessionNameDialog';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingSession, setEditingSession] = useState<{ id: string; name: string } | null>(null);
  const { shouldShowGuide } = useGuideSession();
  
  const {
    folders,
    sessions,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveSessionToFolder,
    getSessionsByFolder,
  } = useChatFolders();

  const filteredSessions = sessions.filter(session =>
    session.session_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSessionsByFolder(folder.id).some(session =>
      session.session_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const unorganizedSessions = filteredSessions.filter(session => 
    !session.folder_id
  );

  const totalSessions = sessions.length;
  const isGuideActive = currentSessionId === 'guide-session';

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
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

  const getTodaySessions = (sessionList: any[]) => {
    const today = new Date();
    return sessionList.filter(session => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === today.toDateString();
    });
  };

  const getYesterdaySessions = (sessionList: any[]) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return sessionList.filter(session => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === yesterday.toDateString();
    });
  };

  const getOlderSessions = (sessionList: any[]) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return sessionList.filter(session => {
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() !== today.toDateString() && 
             sessionDate.toDateString() !== yesterday.toDateString();
    });
  };

  const renderSessionGroup = (sessions: any[], label: string) => {
    if (sessions.length === 0) return null;
    
    return (
      <div className="space-y-1 mt-4 first:mt-0">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1">{label}</div>
        {sessions.map(session => (
          <div key={session.id} className="group flex items-center">
            <button
              onClick={() => onLoadSession(session.id)}
              className={`flex-1 text-left px-2 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors truncate ${
                currentSessionId === session.id ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              {session.session_name}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                <DropdownMenuItem onClick={() => handleEditSession(session.id, session.session_name)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Byt namn
                </DropdownMenuItem>
                {folders.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer">
                      <Move className="w-4 h-4 mr-2" />
                      Flytta till mapp
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="bg-background border shadow-lg z-50">
                      {folders.map(folder => (
                        <DropdownMenuItem 
                          key={folder.id}
                          onClick={() => moveSessionToFolder(session.id, folder.id)}
                        >
                          <Folder className="w-4 h-4 mr-2" />
                          {folder.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <DropdownMenuItem onClick={() => onDeleteSession(session.id)} className="text-red-600">
                  <Trash className="w-4 h-4 mr-2" />
                  Ta bort
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header with New Chat Button */}
      <div className="flex-shrink-0 p-4 space-y-3">
        <Button
          onClick={onNewSession}
          className="w-full flex items-center justify-start gap-2 h-9 hover:bg-muted/50 text-sm font-normal text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          variant="ghost"
          disabled={isLoadingSession}
        >
          <Plus className="w-4 h-4" />
          {isLoadingSession ? 'Creating...' : 'New chat'}
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        {/* Create Folder Button */}
        <CreateFolderDialog
          onCreateFolder={createFolder}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
            >
              <Folder className="w-3 h-3 mr-2" />
              Create folder
            </Button>
          }
        />
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pt-0 space-y-1">
          {/* Folders */}
          {filteredFolders.map(folder => {
            const folderSessions = getSessionsByFolder(folder.id).filter(session =>
              session.session_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const isExpanded = expandedFolders.has(folder.id);
            const hasActiveSession = folderSessions.some(session => session.id === currentSessionId);
            
            return (
              <div key={folder.id} className="space-y-1">
                <div className="flex items-center justify-between group">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className={`flex items-center gap-2 px-2 py-1 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors flex-1 ${
                      hasActiveSession ? 'text-foreground bg-muted/30' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <Folder className="w-3 h-3" />
                    <span className="truncate">{folder.name}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {folderSessions.length}
                    </Badge>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                      <DropdownMenuItem onClick={() => {
                        const newName = prompt('Enter new folder name:', folder.name);
                        if (newName && newName !== folder.name) {
                          updateFolder(folder.id, { name: newName });
                        }
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Byt namn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-red-600">
                        <Trash className="w-4 h-4 mr-2" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {isExpanded && (
                  <div className="ml-4 space-y-1">
                    {folderSessions.map(session => (
                      <div key={session.id} className="group flex items-center">
                        <button
                          onClick={() => onLoadSession(session.id)}
                          className={`flex-1 text-left px-2 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors truncate ${
                            currentSessionId === session.id ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {session.session_name}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                            <DropdownMenuItem onClick={() => handleEditSession(session.id, session.session_name)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Byt namn
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => moveSessionToFolder(session.id, null)}>
                              <Move className="w-4 h-4 mr-2" />
                              Ta bort från mapp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteSession(session.id)} className="text-red-600">
                              <Trash className="w-4 h-4 mr-2" />
                              Ta bort
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unorganized Sessions */}
          {renderSessionGroup(getTodaySessions(unorganizedSessions), 'Today')}
          {renderSessionGroup(getYesterdaySessions(unorganizedSessions), 'Yesterday')}
          {renderSessionGroup(getOlderSessions(unorganizedSessions), 'Previous')}

          {/* Empty state */}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No chat history yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Session Name Dialog */}
      <EditSessionNameDialog
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        currentName={editingSession?.name || ''}
        onSave={handleSaveSessionName}
      />
    </div>
  );
});

ChatFolderSidebar.displayName = 'ChatFolderSidebar';

export default ChatFolderSidebar;