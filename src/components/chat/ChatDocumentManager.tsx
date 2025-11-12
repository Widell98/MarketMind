import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatDocument } from '@/hooks/useChatDocuments';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Trash,
  UploadCloud,
} from 'lucide-react';

interface ChatDocumentManagerProps {
  documents: ChatDocument[];
  selectedDocumentIds: string[];
  onToggleDocument: (documentId: string) => void;
  onUpload: (file: File) => Promise<void> | void;
  onDelete: (documentId: string) => Promise<void> | void;
  isUploading: boolean;
  isLoading: boolean;
}

const getStatusLabel = (document: ChatDocument) => {
  if (document.status === 'processed') {
    return 'Klar';
  }

  if (document.status === 'failed') {
    return 'Fel';
  }

  return 'Bearbetas';
};

const getMetadataText = (document: ChatDocument) => {
  const metadata = (document.metadata ?? {}) as { page_count?: number; truncated?: boolean };
  const pageCount = typeof metadata.page_count === 'number' ? metadata.page_count : undefined;
  const isTruncated = metadata.truncated === true;

  if (document.status === 'failed') {
    return 'Bearbetning misslyckades';
  }

  if (!pageCount) {
    if (document.status === 'processed' && isTruncated) {
      return 'Bearbetning klar (trunkerad)';
    }

    return document.status === 'processed'
      ? 'Bearbetning klar'
      : 'Bearbetar...';
  }

  return `${pageCount} sidor${isTruncated ? ' (urval)' : ''}`;
};

const ChatDocumentManager: React.FC<ChatDocumentManagerProps> = ({
  documents,
  selectedDocumentIds,
  onToggleDocument,
  onUpload,
  onDelete,
  isUploading,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedDocuments = useMemo(() => new Set(selectedDocumentIds), [selectedDocumentIds]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void onUpload(file);
      event.target.value = '';
    }
  }, [onUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void onUpload(file);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="border-t border-b border-ai-border/50 bg-ai-surface-muted/40 px-4 py-3 sm:px-6">
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-dashed border-ai-border/70 bg-white/70 p-4 text-sm transition-colors dark:bg-ai-surface/80',
          isDragging && 'border-primary/60 bg-primary/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-foreground">
            <UploadCloud className="h-4 w-4 text-primary" />
            <span className="font-medium">Ladda upp dokument</span>
          </div>
          <p className="text-xs text-ai-text-muted">
            Dra in en årsredovisning eller annan PDF/textfil här, eller välj från din enhet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bearbetar...
              </>
            ) : (
              <>
                <Paperclip className="mr-2 h-4 w-4" />
                Välj fil
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <Badge variant="secondary" className="rounded-full bg-ai-surface px-3 py-1 text-xs text-ai-text-muted">
            PDF eller text, max 15 MB
          </Badge>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-ai-text-muted">
          <span>Uppladdade dokument ({documents.length})</span>
          {isLoading && (
            <span className="flex items-center gap-1 text-primary">
              <Loader2 className="h-3 w-3 animate-spin" /> Hämtar
            </span>
          )}
        </div>

        {documents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ai-border/60 bg-white/70 p-3 text-xs text-ai-text-muted">
            Du har inte laddat upp några dokument ännu.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {documents.map((document) => {
              const isSelected = selectedDocuments.has(document.id);
              const statusLabel = getStatusLabel(document);
              const metaText = getMetadataText(document);

              return (
                <div
                  key={document.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border bg-white/80 px-4 py-3 text-sm transition-colors dark:bg-ai-surface',
                    isSelected ? 'border-primary/60 shadow-[0_12px_30px_rgba(15,23,42,0.08)]' : 'border-ai-border/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onToggleDocument(document.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border',
                      isSelected ? 'border-primary/80 bg-primary/10 text-primary' : 'border-ai-border/60 text-ai-text-muted'
                    )}
                    >
                      {isSelected ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate font-medium text-foreground">{document.name}</span>
                      <span className="text-xs text-ai-text-muted">{metaText}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full px-2 py-0 text-[11px] uppercase tracking-wide',
                        document.status === 'processed' && 'border-emerald-400 text-emerald-600',
                        document.status === 'failed' && 'border-destructive text-destructive',
                        document.status === 'processing' && 'border-primary/50 text-primary'
                      )}
                    >
                      {statusLabel}
                    </Badge>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-ai-text-muted hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onDelete(document.id);
                    }}
                    aria-label={`Ta bort ${document.name}`}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDocumentManager;
