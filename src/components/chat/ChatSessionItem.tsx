import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Loader2,
  FolderInput
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
  folder_id: string | null;
}

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isLoading?: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onEditName: (name: string) => void;
  onMoveSession?: (sessionId: string, folderId: string | null) => void;
  draggable?: boolean;
  className?: string;
}

const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isActive,
  isLoading = false,
  onLoad,
  onDelete,
  onEditName,
  onMoveSession,
  draggable = false,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.session_name);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(session.session_name);
  };

  const handleSaveEdit = (e?: React.MouseEvent | React.FocusEvent) => {
    e?.stopPropagation();
    if (editValue.trim() && editValue !== session.session_name) {
      onEditName(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(session.session_name);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(session.session_name);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.setData('sessionId', session.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className={cn(
        "group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-200 mb-0.5",
        isActive 
          ? "bg-accent/80 text-accent-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        className
      )}
      draggable={draggable && !isEditing}
      onDragStart={handleDragStart}
      onClick={onLoad}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <MessageSquare className={cn(
          "w-4 h-4 flex-shrink-0 transition-colors",
          isActive ? "text-primary" : "opacity-60 group-hover:opacity-100"
        )} />
        
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-7 text-sm px-2 py-1 bg-background"
              autoFocus
              onBlur={handleSaveEdit}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleSaveEdit}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleCancelEdit}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            {/* Här är typography-fixen du bad om */}
            <div className={cn(
              "truncate text-sm font-medium leading-tight",
              isActive ? "text-foreground" : "text-foreground/90"
            )}>
              {session.session_name || "Namnlös konversation"}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      ) : (
        !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100",
                  isActive && "opacity-100 hover:bg-background/20"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="sr-only">Alternativ</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleStartEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Byt namn
              </DropdownMenuItem>
              {onMoveSession && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onMoveSession(session.id, null);
                }}>
                  <FolderInput className="w-4 h-4 mr-2" />
                  Flytta till rot
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      )}
    </div>
  );
};

export default ChatSessionItem;
