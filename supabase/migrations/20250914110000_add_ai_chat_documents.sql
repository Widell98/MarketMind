-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create table for uploaded chat documents
CREATE TABLE IF NOT EXISTS public.chat_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_type text,
  file_size bigint,
  storage_path text,
  status text NOT NULL DEFAULT 'processing',
  chunk_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  processing_errors text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Table for document chunks and embeddings
CREATE TABLE IF NOT EXISTS public.chat_document_chunks (
  id bigserial PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.chat_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_document_chunks_document_id
  ON public.chat_document_chunks (document_id, chunk_index);

-- Vector index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_chat_document_chunks_embedding
  ON public.chat_document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Maintain updated_at automatically
CREATE OR REPLACE FUNCTION public.update_chat_document_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_documents_updated_at ON public.chat_documents;
CREATE TRIGGER trg_chat_documents_updated_at
BEFORE UPDATE ON public.chat_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_document_updated_at();

-- Enable RLS
ALTER TABLE public.chat_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_document_chunks ENABLE ROW LEVEL SECURITY;

-- Policies for chat_documents
CREATE POLICY "Users can view their chat documents" ON public.chat_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their chat documents" ON public.chat_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their chat documents" ON public.chat_documents
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can update chat documents" ON public.chat_documents
  FOR UPDATE USING (auth.role() = 'service_role');

-- Policies for document chunks (read-only to owners)
CREATE POLICY "Users can view their chat document chunks" ON public.chat_document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- Helper function for similarity search
CREATE OR REPLACE FUNCTION public.match_chat_document_chunks(
  p_query_embedding vector(1536),
  p_match_count integer,
  p_user_id uuid,
  p_document_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  document_id uuid,
  document_name text,
  chunk_index integer,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.document_id,
    d.name AS document_name,
    c.chunk_index,
    c.content,
    c.metadata,
    1 - (c.embedding <=> p_query_embedding) AS similarity
  FROM public.chat_document_chunks c
  JOIN public.chat_documents d ON d.id = c.document_id
  WHERE d.user_id = p_user_id
    AND d.status = 'processed'
    AND c.embedding IS NOT NULL
    AND (p_document_ids IS NULL OR c.document_id = ANY (p_document_ids))
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT GREATEST(p_match_count, 1);
END;
$$;

-- Storage bucket for original documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-chat-documents',
  'ai-chat-documents',
  false,
  31457280,
  ARRAY[
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies need to be created conditionally because CREATE POLICY does not
-- support IF NOT EXISTS. We guard the statements inside DO blocks to keep the
-- migration idempotent when re-running in different environments.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can upload AI chat documents'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload AI chat documents" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'ai-chat-documents'
        AND auth.uid() = owner
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can view their AI chat documents'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can view their AI chat documents" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'ai-chat-documents'
        AND auth.uid() = owner
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE polname = 'Users can delete their AI chat documents'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete their AI chat documents" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'ai-chat-documents'
        AND auth.uid() = owner
      );
  END IF;
END $$;

