import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MindmapLayout } from '@/types/chatMindmap';

const defaultLayout: MindmapLayout = {
  positions: {},
  groupPositions: {},
  groupColors: {},
  edges: [],
  nodeMeta: {},
};

export const useChatMindmapLayout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [layout, setLayout] = useState<MindmapLayout>(defaultLayout);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadMindmapLayout = useCallback(async () => {
    if (!user) {
      setLayout(defaultLayout);
      return defaultLayout;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_mindmap_layouts')
        .select('layout')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          throw error;
        }
        setLayout(defaultLayout);
        return defaultLayout;
      }

      const nextLayout = (data?.layout as MindmapLayout | null) ?? defaultLayout;
      setLayout(nextLayout);
      return nextLayout;
    } catch (error) {
      console.error('Failed to load mindmap layout', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ladda mindmap-layouten. Försök igen.',
        variant: 'destructive',
      });
      setLayout(defaultLayout);
      return defaultLayout;
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  const saveMindmapLayout = useCallback(
    async (nextLayout: MindmapLayout) => {
      setLayout(nextLayout);
      if (!user) return;

      setIsSaving(true);
      try {
        const { error } = await supabase.from('chat_mindmap_layouts').upsert({
          user_id: user.id,
          layout: nextLayout,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Failed to save mindmap layout', error);
        toast({
          title: 'Fel',
          description: 'Kunde inte spara mindmap-layouten. Försök igen.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [toast, user]
  );

  return {
    layout,
    setLayout,
    defaultLayout,
    loadMindmapLayout,
    saveMindmapLayout,
    isLoading,
    isSaving,
  };
};
