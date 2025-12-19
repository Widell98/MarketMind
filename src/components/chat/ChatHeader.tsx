// src/components/chat/ChatHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  PanelLeft, // NY IKON: Tydligare att det är en sidomeny
  Edit2
} from 'lucide-react';
import EditSessionNameDialog from './EditSessionNameDialog';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  currentSessionName?: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewSession: () => void;
  onEditSessionName: (newName: string) => void;
  isLoading?: boolean;
}

const ChatHeader = ({
  currentSessionName,
  isSidebarOpen,
  onToggleSidebar,
  onNewSession,
  onEditSessionName,
  isLoading
}: ChatHeaderProps) => {
  const [isEditing, setIsEditing] = React.useState(false);

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md dark:border-white/5 dark:bg-black/40">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button - Apple Style */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={cn(
            "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10",
            isSidebarOpen && "bg-gray-100 text-foreground dark:bg-white/10"
          )}
          title={isSidebarOpen ? "Dölj sidofält" : "Visa sidofält"}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        {/* Current Session Title */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {currentSessionName || 'Ny konversation'}
          </h2>
          {currentSessionName && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewSession}
          disabled={isLoading}
          className="text-primary hover:bg-primary/10"
          title="Ny chat"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <EditSessionNameDialog
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        currentName={currentSessionName || ''}
        onSave={onEditSessionName}
      />
    </div>
  );
};

export default ChatHeader;
