import { useMemo } from 'react';
import { ChatFolder, ChatSession, useChatSessions } from '@/contexts/ChatSessionsContext';

export { ChatFolder, ChatSession } from '@/contexts/ChatSessionsContext';

export const useChatFolders = () => {
  const {
    folders,
    sessions,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveSessionToFolder,
    loadFolders,
    loadSessions,
    removeSessionsFromState,
  } = useChatSessions();

  const getSessionsByFolder = useMemo(() => {
    return (folderId: string | null) => {
      return sessions.filter(session => session.folder_id === folderId);
    };
  }, [sessions]);

  return {
    folders,
    sessions,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveSessionToFolder,
    getSessionsByFolder,
    loadFolders,
    loadSessions,
    removeSessionsFromState,
  };
};
