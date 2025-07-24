import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Folder, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import ChatSessionItem from './ChatSessionItem';
import CreateFolderDialog from './CreateFolderDialog';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
  folder_id: string | null;
}

interface ChatFolder {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface ChatFolderProps {
  folder: ChatFolder | null;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditSessionName: (sessionId: string, name: string) => void;
  onMoveSession?: (sessionId: string, folderId: string | null) => void;
  onEditFolder?: (folderId: string, name: string, color: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onCreateSubfolder?: (name: string, color: string) => void;
  isLoadingSession?: boolean;
  className?: string;
}

const ChatFolder: React.FC<ChatFolderProps> = ({
  folder,
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onEditSessionName,
  onMoveSession,
  onEditFolder,
  onDeleteFolder,
  onCreateSubfolder,
  isLoadingSession = false,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const sessionId = e.dataTransfer.getData('sessionId');
    if (sessionId && onMoveSession) {
      onMoveSession(sessionId, folder?.id || null);
    }
  };

  const folderIcon = folder ? (
    isExpanded ? (
      <FolderOpen className="w-4 h-4" style={{ color: folder.color }} />
    ) : (
      <Folder className="w-4 h-4" style={{ color: folder.color }} />
    )
  ) : (
    <Folder className="w-4 h-4 text-muted-foreground" />
  );

  const sessionCount = sessions.length;

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Folder Header */}
      <div
        className={`flex items-center justify-between p-2 rounded-lg transition-all ${
          isDragOver 
            ? 'bg-primary/10 border-2 border-primary border-dashed' 
            : 'hover:bg-muted/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 flex-1 justify-start h-8 px-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          {folderIcon}
          <span className="text-sm font-medium truncate">
            {folder?.name || 'Omappade chattar'}
          </span>
          {sessionCount > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {sessionCount}
            </Badge>
          )}
        </Button>

        {folder && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onCreateSubfolder && (
                <DropdownMenuItem asChild>
                  <CreateFolderDialog
                    onCreateFolder={onCreateSubfolder}
                    trigger={
                      <div className="flex items-center gap-2 w-full px-2 py-1.5 text-sm">
                        <Plus className="w-4 h-4" />
                        Ny undermapp
                      </div>
                    }
                  />
                </DropdownMenuItem>
              )}
              {onEditFolder && (
                <DropdownMenuItem 
                  onClick={() => onEditFolder(folder.id, folder.name, folder.color)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Redigera mapp
                </DropdownMenuItem>
              )}
              {onDeleteFolder && (
                <DropdownMenuItem 
                  onClick={() => onDeleteFolder(folder.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ta bort mapp
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Sessions */}
      {isExpanded && (
        <div className="ml-4 space-y-1">
          {sessions.map((session) => (
            <ChatSessionItem
              key={session.id}
              session={session}
              isActive={currentSessionId === session.id}
              isLoading={isLoadingSession && currentSessionId === session.id}
              onLoad={() => onLoadSession(session.id)}
              onDelete={() => onDeleteSession(session.id)}
              onEditName={(name) => onEditSessionName(session.id, name)}
              onMoveSession={onMoveSession}
              draggable
            />
          ))}
          
          {sessions.length === 0 && (
            <div className="text-xs text-muted-foreground px-2 py-4 text-center italic">
              {folder ? 'Inga chattar i denna mapp' : 'Skapa din första chat'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatFolder;