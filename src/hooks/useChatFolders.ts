import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatFolder {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export type ChatAnalysisCategory =
  | 'risk'
  | 'diversification'
  | 'optimization'
  | 'summary'
  | 'profile'
  | 'general'
  | 'other';

export interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
  folder_id: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  last_analysis_type?: ChatAnalysisCategory | null;
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

      const sessionIds = (data || []).map(session => session.id);

      type HistoryRow = {
        chat_session_id: string;
        message: string;
        message_type: string;
        created_at: string;
        context_data: Record<string, unknown> | null;
      };

      const { data: historyData } = sessionIds.length
        ? await supabase
            .from('portfolio_chat_history')
            .select('chat_session_id, message, message_type, created_at, context_data')
            .in('chat_session_id', sessionIds)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        : { data: [] as HistoryRow[] };

      const normalizeAnalysisType = (value?: unknown): ChatAnalysisCategory | null => {
        if (typeof value !== 'string') return null;
        const normalized = value.toLowerCase();

        if (normalized.includes('risk')) return 'risk';
        if (normalized.includes('divers')) return 'diversification';
        if (normalized.includes('optim')) return 'optimization';
        if (normalized.includes('summary')) return 'summary';
        if (normalized.includes('profile')) return 'profile';
        if (normalized.includes('general')) return 'general';
        return 'other';
      };

      const latestMessages = new Map<string, HistoryRow>();
      const latestAssistantMessages = new Map<string, HistoryRow>();

      (historyData || []).forEach((row: HistoryRow) => {
        if (!latestMessages.has(row.chat_session_id)) {
          latestMessages.set(row.chat_session_id, row);
        }

        if (row.message_type !== 'user' && !latestAssistantMessages.has(row.chat_session_id)) {
          latestAssistantMessages.set(row.chat_session_id, row);
        }
      });

      const createPreview = (message?: string | null) => {
        if (!message) return null;
        const collapsed = message.replace(/\s+/g, ' ').trim();
        if (collapsed.length === 0) {
          return null;
        }
        return collapsed.length > 140 ? `${collapsed.slice(0, 137)}...` : collapsed;
      };

      const formattedSessions = data.map(session => {
        const assistantMessage = latestAssistantMessages.get(session.id);
        const fallbackMessage = latestMessages.get(session.id);
        const summarySource = assistantMessage ?? fallbackMessage ?? null;

        const preview = createPreview(summarySource?.message ?? null);
        const analysisTypeRaw =
          summarySource?.context_data && typeof summarySource.context_data === 'object'
            ? (summarySource.context_data as Record<string, unknown>).analysisType
            : undefined;
        const analysisType = normalizeAnalysisType(analysisTypeRaw);

        return {
          id: session.id,
          session_name: session.session_name || 'Ny Session',
          created_at: session.created_at,
          is_active: session.is_active || false,
          folder_id: session.folder_id,
          last_message_at: summarySource?.created_at ?? null,
          last_message_preview: preview,
          last_analysis_type: analysisType,
        } satisfies ChatSession;
      });

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

  const removeSessionsFromState = useCallback((sessionIds: string[]) => {
    if (sessionIds.length === 0) return;

    setSessions((prev) => prev.filter((session) => !sessionIds.includes(session.id)));
  }, []);

  const getSessionsByFolder = useMemo(() => {
    return (folderId: string | null) => {
      return sessions
        .filter(session => session.folder_id === folderId)
        .slice()
        .sort((a, b) => {
          const aDate = a.last_message_at || a.created_at;
          const bDate = b.last_message_at || b.created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });
    };
  }, [sessions]);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Remove loadFolders and loadSessions from dependencies to prevent infinite loop

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
