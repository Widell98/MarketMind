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

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(session.session_name);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== session.session_name) {
      onEditName(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(session.session_name);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.setData('sessionId', session.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Idag';
    } else if (diffDays === 2) {
      return 'Igår';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dagar sedan`;
    } else {
      return date.toLocaleDateString('sv-SE', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div 
      className={`group flex items-center gap-2 p-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-muted/50'
      } ${className}`}
      draggable={draggable && !isEditing}
      onDragStart={handleDragStart}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MessageSquare className={`w-3 h-3 flex-shrink-0 ${
          isActive ? 'text-primary' : 'text-muted-foreground'
        }`} />
        
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-6 text-xs"
              autoFocus
              onBlur={handleSaveEdit}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={handleSaveEdit}
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={handleCancelEdit}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={onLoad}
          >
            <div className="text-xs font-medium truncate">
              {session.session_name}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(session.created_at)}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      ) : (
        !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleStartEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Byt namn
              </DropdownMenuItem>
              {onMoveSession && (
                <DropdownMenuItem onClick={() => onMoveSession(session.id, null)}>
                  <FolderInput className="w-4 h-4 mr-2" />
                  Flytta till rot
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive"
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