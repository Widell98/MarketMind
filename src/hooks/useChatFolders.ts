import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatFolder {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
  folder_id: string | null;
}

export const useChatFolders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFolders = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda mappar. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSessions = data.map(session => ({
        id: session.id,
        session_name: session.session_name || 'Ny Session',
        created_at: session.created_at,
        is_active: session.is_active || false,
        folder_id: session.folder_id,
      }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda sessioner. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const createFolder = useCallback(async (name: string, color: string = '#3B82F6') => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .insert([{
          user_id: user.id,
          name,
          color
        }])
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      toast({
        title: "Mapp skapad",
        description: `Mappen "${name}" har skapats.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa mapp. Försök igen.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const updateFolder = useCallback(async (folderId: string, updates: Partial<ChatFolder>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('chat_folders')
        .update(updates)
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, ...updates }
          : folder
      ));

      toast({
        title: "Mapp uppdaterad",
        description: "Mappen har uppdaterats.",
      });
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera mapp. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user) return;
    
    try {
      // First, move all sessions from this folder to no folder
      const { error: sessionsError } = await supabase
        .from('ai_chat_sessions')
        .update({ folder_id: null })
        .eq('folder_id', folderId)
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      // Then delete the folder
      const { error } = await supabase
        .from('chat_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      setSessions(prev => prev.map(session => 
        session.folder_id === folderId 
          ? { ...session, folder_id: null }
          : session
      ));

      toast({
        title: "Mapp borttagen",
        description: "Mappen har tagits bort och alla chattar har flyttats till rot-nivån.",
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort mapp. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const moveSessionToFolder = useCallback(async (sessionId: string, folderId: string | null) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({ folder_id: folderId })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, folder_id: folderId }
          : session
      ));

      const targetFolder = folderId ? folders.find(f => f.id === folderId) : null;
      toast({
        title: "Chat flyttad",
        description: targetFolder 
          ? `Chatten har flyttats till "${targetFolder.name}".`
          : "Chatten har flyttats till rot-nivån.",
      });
    } catch (error) {
      console.error('Error moving session:', error);
      toast({
        title: "Fel",
        description: "Kunde inte flytta chat. Försök igen.",
        variant: "destructive",
      });
    }
  }, [user, folders, toast]);

  const getSessionsByFolder = useCallback((folderId: string | null) => {
    return sessions.filter(session => session.folder_id === folderId);
  }, [sessions]);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadSessions();
    }
  }, [user, loadFolders, loadSessions]);

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
  };
};