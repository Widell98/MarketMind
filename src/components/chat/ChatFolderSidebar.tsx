import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Folder,
  Archive,
  MoreHorizontal,
  Compass,
  BookOpen
} from 'lucide-react';
import { useChatFolders } from '@/hooks/useChatFolders';
import { useGuideSession } from '@/hooks/useGuideSession';
import CreateFolderDialog from './CreateFolderDialog';
import ChatFolder from './ChatFolder';

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

const ChatFolderSidebar: React.FC<ChatFolderSidebarProps> = ({
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

  return (
    <div className={`flex flex-col h-full bg-background border-r ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">AI Chattar</h2>
            {totalSessions > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalSessions}
              </Badge>
            )}
          </div>
          <Button
            onClick={onNewSession}
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ny
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Sök chattar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Folders and Sessions */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Permanent Guide Session */}
          <div className="mb-4">
            <Button
              variant={isGuideActive ? "default" : "outline"}
              size="sm"
              onClick={onLoadGuideSession}
              className={`w-full justify-start gap-3 h-10 transition-all duration-200 ${
                isGuideActive 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md' 
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/30 dark:hover:to-orange-950/30'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center flex-shrink-0">
                <Compass className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">Market Mind Guide</div>
                <div className="text-xs opacity-75">Kom igång med plattformen</div>
              </div>
              {shouldShowGuide && (
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              )}
            </Button>
          </div>

          <Separator />

          {/* Create Folder Button */}
          <CreateFolderDialog
            onCreateFolder={createFolder}
            isLoading={isLoading}
            trigger={
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Skapa mapp
              </Button>
            }
          />

          <Separator />

          {/* Folders */}
          {filteredFolders.map((folder) => {
            const folderSessions = searchTerm 
              ? filteredSessions.filter(session => session.folder_id === folder.id)
              : getSessionsByFolder(folder.id);

            return (
              <ChatFolder
                key={folder.id}
                folder={folder}
                sessions={folderSessions}
                currentSessionId={currentSessionId}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
                onEditSessionName={onEditSessionName}
                onMoveSession={moveSessionToFolder}
                onEditFolder={(folderId, name, color) => 
                  updateFolder(folderId, { name, color })
                }
                onDeleteFolder={deleteFolder}
                onCreateSubfolder={createFolder}
                isLoadingSession={isLoadingSession}
              />
            );
          })}

          {/* Unorganized Sessions */}
          {unorganizedSessions.length > 0 && (
            <ChatFolder
              folder={null}
              sessions={unorganizedSessions}
              currentSessionId={currentSessionId}
              onLoadSession={onLoadSession}
              onDeleteSession={onDeleteSession}
              onEditSessionName={onEditSessionName}
              onMoveSession={moveSessionToFolder}
              isLoadingSession={isLoadingSession}
            />
          )}

          {/* Empty State */}
          {totalSessions === 0 && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Inga chattar än</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Skapa din första chat för att komma igång med AI-assistenten
              </p>
              <Button onClick={onNewSession} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Skapa första chatten
              </Button>
            </div>
          )}

          {/* No Results */}
          {searchTerm && filteredSessions.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Inga resultat</h3>
              <p className="text-sm text-muted-foreground">
                Prova att ändra söktermen eller skapa en ny chat
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{totalSessions} chattar</span>
          <span>{folders.length} mappar</span>
        </div>
      </div>
    </div>
  );
};

export default ChatFolderSidebar;