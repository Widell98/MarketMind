import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { buildTextPageFromFile, type PdfTextPage } from '@/utils/documentProcessing';
import { useSubscription } from '@/hooks/useSubscription';

export type ChatDocument = {
  id: string;
  name: string;
  created_at: string;
  status: 'processing' | 'processed' | 'failed';
  chunk_count: number;
  metadata?: Record<string, unknown> | null;
  file_type?: string | null;
  file_size?: number | null;
  storage_path?: string | null;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const SUPPORTED_TYPES = ['application/pdf', 'text/plain'];
const FREE_DAILY_DOCUMENT_LIMIT = 1;

const isSupportedType = (file: File) => {
  if (!file.type) {
    return file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.txt');
  }
  return SUPPORTED_TYPES.includes(file.type) || file.type.startsWith('text/');
};

export const useChatDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const [documents, setDocuments] = useState<ChatDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_documents')
      .select('id, name, created_at, status, chunk_count, metadata, file_type, file_size, storage_path')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch chat documents', error);
      toast({
        title: 'Fel vid hämtning',
        description: 'Kunde inte hämta dina dokument just nu.',
        variant: 'destructive',
      });
    } else if (data) {
      setDocuments(data as ChatDocument[]);
    }

    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(async (file: File) => {
    if (!user) {
      toast({
        title: 'Inloggning krävs',
        description: 'Logga in för att ladda upp dokument.',
        variant: 'destructive',
      });
      return;
    }

    if (!isSupportedType(file)) {
      toast({
        title: 'Ogiltig filtyp',
        description: 'Endast PDF- eller textfiler stöds just nu.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Filen är för stor',
        description: 'Välj en fil som är mindre än 15 MB.',
        variant: 'destructive',
      });
      return;
    }

    if (subscription?.subscribed === false) {
      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      const { count: todaysCount, error: limitError } = await supabase
        .from('chat_documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (limitError) {
        console.error('Failed to check daily document limit', limitError);
        toast({
          title: 'Uppladdning misslyckades',
          description: 'Kunde inte verifiera din dokumentgräns just nu. Försök igen senare.',
          variant: 'destructive',
        });
        return;
      }

      if ((todaysCount ?? 0) >= FREE_DAILY_DOCUMENT_LIMIT) {
        toast({
          title: 'Daglig gräns nådd',
          description: 'Uppgradera till Premium för att ladda upp fler dokument per dag.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsUploading(true);

    try {
      const pages: PdfTextPage[] = await buildTextPageFromFile(file);
      if (!pages.length) {
        throw new Error('Kunde inte läsa någon text från dokumentet');
      }

      const storagePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ai-chat-documents')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('Failed to upload document to storage', uploadError);
        throw new Error('Kunde inte spara filen i lagringen');
      }

      const { data: processData, error: processError } = await supabase.functions.invoke('process-chat-document', {
        body: {
          userId: user.id,
          documentName: file.name,
          fileType: file.type,
          fileSize: file.size,
          storagePath,
          pages,
        },
      });

      if (processError || (processData && (processData as { error?: string }).error)) {
        const message = processError?.message || (processData as { error?: string })?.error;
        console.error('Document processing failed', processError || processData);
        throw new Error(message || 'Kunde inte bearbeta dokumentet');
      }

      toast({
        title: 'Uppladdning påbörjad',
        description: 'Dokumentet bearbetas – det kan ta några sekunder.',
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Document upload failed', error);
      toast({
        title: 'Uppladdning misslyckades',
        description: error instanceof Error ? error.message : 'Ett oväntat fel inträffade.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, toast, fetchDocuments, subscription]);

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!user) return;

    const targetDocument = documents.find((doc) => doc.id === documentId);

    const { error } = await supabase
      .from('chat_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Failed to delete chat document', error);
      toast({
        title: 'Kunde inte ta bort dokumentet',
        description: 'Försök igen om en liten stund.',
        variant: 'destructive',
      });
      return;
    }

    if (targetDocument?.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('ai-chat-documents')
        .remove([targetDocument.storage_path]);

      if (storageError) {
        console.error('Failed to delete chat document file', storageError);
      }
    }

    toast({
      title: 'Dokument borttaget',
      description: 'Det uppladdade dokumentet har tagits bort.',
    });

    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  }, [user, toast, documents]);

  const activeDocuments = useMemo(() => documents, [documents]);

  return {
    documents: activeDocuments,
    isLoading,
    isUploading,
    uploadDocument,
    deleteDocument,
    refresh: fetchDocuments,
  };
};
