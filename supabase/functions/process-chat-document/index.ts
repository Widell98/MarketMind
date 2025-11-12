import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PagePayload = {
  pageNumber: number;
  text: string;
};

type ProcessDocumentPayload = {
  userId: string;
  documentName: string;
  fileType?: string;
  fileSize?: number;
  storagePath?: string;
  pages: PagePayload[];
};

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_CHUNKS = 120;
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

const sanitizeText = (value: string) => {
  const withoutNull = value.split("\u0000").join("");
  return withoutNull
    .replace(/\s+/g, " ")
    .replace(/\s([,.;:!?])/g, "$1")
    .trim();
};

const chunkText = (text: string, pageNumber: number) => {
  const chunks: Array<{ content: string; pageNumber: number }> = [];
  const normalized = text.trim();

  if (!normalized) {
    return chunks;
  }

  let start = 0;
  const length = normalized.length;

  while (start < length) {
    const end = Math.min(start + CHUNK_SIZE, length);
    let chunk = normalized.slice(start, end);

    if (end < length) {
      const boundary = Math.max(
        chunk.lastIndexOf(". "),
        chunk.lastIndexOf("! "),
        chunk.lastIndexOf("? "),
        chunk.lastIndexOf("\n")
      );
      if (boundary > CHUNK_SIZE * 0.5) {
        chunk = chunk.slice(0, boundary + 1);
      }
    }

    const cleaned = sanitizeText(chunk);
    if (cleaned.length > 0) {
      chunks.push({ content: cleaned, pageNumber });
    }

    if (chunks.length >= MAX_CHUNKS) {
      break;
    }

    if (end >= length) {
      break;
    }

    start = end - CHUNK_OVERLAP;
    if (start < 0) {
      start = 0;
    }
  }

  return chunks;
};

const buildChunkPayloads = (pages: PagePayload[]) => {
  const payloads: Array<{ content: string; pageNumber: number }> = [];
  for (const page of pages) {
    const chunks = chunkText(page.text ?? "", page.pageNumber);
    for (const chunk of chunks) {
      payloads.push(chunk);
      if (payloads.length >= MAX_CHUNKS) {
        return payloads;
      }
    }
  }
  return payloads;
};

const fetchEmbedding = async (text: string, apiKey: string) => {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding request failed: ${error}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("Embedding response missing data");
  }

  return embedding as number[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let requestBody: ProcessDocumentPayload | null = null;
  let documentRecordId: string | null = null;

  try {
    requestBody = (await req.json()) as ProcessDocumentPayload;
    const { userId, documentName, fileType, fileSize, storagePath, pages } = requestBody;

    if (!userId || !documentName || !Array.isArray(pages) || pages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !openAIApiKey) {
      console.error("Missing environment configuration", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
        hasOpenAI: !!openAIApiKey,
      });
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const chunkPayloads = buildChunkPayloads(pages);
    const isTruncated = chunkPayloads.length >= MAX_CHUNKS;
    if (chunkPayloads.length === 0) {
      return new Response(JSON.stringify({ error: "Document innehåller ingen läsbar text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: documentRecord, error: insertError } = await supabase
      .from("chat_documents")
      .insert({
        user_id: userId,
        name: documentName,
        file_type: fileType,
        file_size: fileSize,
        storage_path: storagePath,
        status: "processing",
        metadata: {
          page_count: pages.length,
          truncated: isTruncated,
        },
      })
      .select()
      .single();

    if (insertError || !documentRecord) {
      console.error("Failed to insert chat document", insertError);
      throw new Error("Kunde inte spara dokumentet");
    }

    documentRecordId = documentRecord.id as string;

    const chunksToInsert: Array<{ content: string; chunk_index: number; document_id: string; metadata: Record<string, unknown>; embedding: number[] }> = [];
    let chunkIndex = 0;

    for (const payload of chunkPayloads) {
      const embedding = await fetchEmbedding(payload.content, openAIApiKey);
      chunksToInsert.push({
        content: payload.content,
        chunk_index: chunkIndex,
        document_id: documentRecordId,
        metadata: { page_number: payload.pageNumber },
        embedding,
      });
      chunkIndex += 1;
    }

    if (chunksToInsert.length > 0) {
      const { error: chunkError } = await supabase
        .from("chat_document_chunks")
        .insert(chunksToInsert);

      if (chunkError) {
        console.error("Failed to insert document chunks", chunkError);
        throw new Error("Kunde inte bearbeta dokumentet");
      }
    }

    const { error: updateError } = await supabase
      .from("chat_documents")
      .update({
        status: "processed",
        chunk_count: chunksToInsert.length,
        metadata: {
          page_count: pages.length,
          original_type: fileType,
          original_size: fileSize,
          truncated: isTruncated,
        },
      })
      .eq("id", documentRecordId);

    if (updateError) {
      console.error("Failed to update document status", updateError);
    }

    return new Response(
      JSON.stringify({
        documentId: documentRecord.id,
        chunkCount: chunksToInsert.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Document processing failed", error);

    if (documentRecordId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          await supabase
            .from("chat_documents")
            .update({
              status: "failed",
              processing_errors: error instanceof Error ? error.message : "Okänt fel",
            })
            .eq("id", documentRecordId);
        }
      } catch (innerError) {
        console.error("Failed to mark document as failed", innerError);
      }
    } else if (requestBody?.userId && requestBody?.documentName) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          await supabase
            .from("chat_documents")
            .insert({
              user_id: requestBody.userId,
              name: requestBody.documentName,
              file_type: requestBody.fileType,
              file_size: requestBody.fileSize,
              storage_path: requestBody.storagePath,
              status: "failed",
              processing_errors: error instanceof Error ? error.message : "Okänt fel",
            });
        }
      } catch (innerError) {
        console.error("Failed to log failed document", innerError);
      }
    }

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Dokumentbearbetning misslyckades" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
