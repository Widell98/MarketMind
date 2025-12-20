import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChatDocument } from '@/hooks/useChatDocuments';
import { cn } from '@/lib/utils';
import { OPEN_CHAT_DOCUMENT_UPLOAD_EVENT } from '@/constants/chatDocuments';
import { AlertCircle, CheckCircle2, ChevronDown, FileText, Loader2, Sparkles, Trash } from 'lucide-react';

interface ChatDocumentManagerProps {
  documents: ChatDocument[];
  selectedDocumentIds: string[];
  onToggleDocument: (documentId: string) => void;
  onUpload: (file: File) => Promise<void> | void;
  onDelete: (documentId: string) => Promise<void> | void;
  isLoading: boolean;
  isUploading: boolean;
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
  isLoading,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const selectedDocuments = useMemo(() => new Set(selectedDocumentIds), [selectedDocumentIds]);
  const selectedDocumentList = useMemo(() => {
    if (selectedDocumentIds.length === 0) {
      return [] as ChatDocument[];
    }

    const idSet = new Set(selectedDocumentIds);
    return documents.filter((document) => idSet.has(document.id));
  }, [documents, selectedDocumentIds]);
  const selectedDocumentsCount = selectedDocumentList.length;
  
  useEffect(() => {
    const handleOpenUpload = () => {
      requestAnimationFrame(() => {
        fileInputRef.current?.click();
      });
    };

    window.addEventListener(OPEN_CHAT_DOCUMENT_UPLOAD_EVENT, handleOpenUpload);

    return () => {
      window.removeEventListener(OPEN_CHAT_DOCUMENT_UPLOAD_EVENT, handleOpenUpload);
    };
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void onUpload(file);
      event.target.value = '';
    }
  }, [onUpload]);

  const handleDocumentClick = useCallback((documentId: string) => {
    const isAlreadySelected = selectedDocuments.has(documentId);
    onToggleDocument(documentId);

    if (!isAlreadySelected) {
      setIsCollapsed(true);
    }
  }, [onToggleDocument, selectedDocuments]);

  return (
    // ÄNDRING: Lade till flex och justify-center på containern, och en inre div med max-bredd
    <div className="border-t border-ai-border/40 bg-transparent px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4">
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 text-left text-ai-text-muted transition-colors hover:text-primary/80 flex-1 min-w-0"
              aria-expanded={!isCollapsed}
              aria-controls="chat-document-manager-panel"
            >
              <span
                className={cn(
                  'flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border border-ai-border/60 text-ai-text-muted transition-transform',
                  isCollapsed ? '-rotate-90' : 'rotate-0'
                )}
              >
                <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </span>
              <span className="text-[10px] sm:text-xs text-ai-text-muted truncate">Dokument ({documents.length})</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {selectedDocumentsCount > 0 && (
                <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <span className="hidden sm:inline">{selectedDocumentsCount} valda</span>
                  <span className="sm:hidden">{selectedDocumentsCount}</span>
                </span>
              )}
              {(isLoading || isUploading) && (
                <span className="flex items-center gap-0.5 sm:gap-1 text-primary">
                  <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
                  <span className="hidden sm:inline text-[10px]">{isUploading ? 'Uppladdar' : 'Hämtar'}</span>
                </span>
              )}
            </div>
          </div>
          {!isCollapsed && (
            <>
              {selectedDocumentList.length > 0 && (
                <div className="rounded-md border border-ai-border/40 bg-white/70 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] text-ai-text">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                    <p className="font-medium text-[10px] sm:text-[11px]">AI:n använder dessa dokument som källor</p>
                    <button
                      type="button"
                      onClick={() => setIsCollapsed(true)}
                      className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-primary transition-colors hover:text-primary/80 flex-shrink-0"
                    >
                      Dölj
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[9px] sm:text-[10px]">
                    {selectedDocumentList.map((document) => (
                      <span key={document.id} className="rounded-full bg-primary/10 px-1.5 py-0.5 sm:px-2 text-primary truncate max-w-[120px] sm:max-w-none">
                        {document.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div id="chat-document-manager-panel" className="space-y-2">
                {documents.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-ai-border/60 bg-white/70 p-2 sm:p-3 text-[10px] sm:text-xs text-ai-text-muted">
                    Du har inte laddat upp några dokument ännu.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {documents.map((document) => {
                      const isSelected = selectedDocuments.has(document.id);
                      const statusLabel = getStatusLabel(document);
                      const metaText = getMetadataText(document);

                      return (
                        <div
                          key={document.id}
                          className={cn(
                            'group flex items-center gap-1.5 sm:gap-2 rounded-full border px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] transition-colors',
                            isSelected
                              ? 'border-primary/60 bg-primary/10 text-primary'
                              : 'border-ai-border/50 bg-white/60 text-ai-text'
                          )}
                        >
                          {isSelected && (
                            <span className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />
                            </span>
                          )}
                          {!isSelected && (
                            <span className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-full border border-ai-border/50 text-ai-text-muted">
                              <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDocumentClick(document.id)}
                            className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 text-left"
                            aria-pressed={isSelected}
                            title={`${document.name} • ${metaText}`}
                          >
                            <span className="truncate font-medium text-[10px] sm:text-[11px] max-w-[100px] sm:max-w-none">{document.name}</span>
                            <span
                              className="hidden text-[9px] sm:text-[10px] text-ai-text-muted sm:inline"
                            >
                              {metaText}
                            </span>
                          </button>
                          <span
                            className={cn(
                              'flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border text-[9px] sm:text-[10px] uppercase',
                              document.status === 'processed' && 'border-emerald-300 text-emerald-600',
                              document.status === 'failed' && 'border-destructive text-destructive',
                              document.status === 'processing' && 'border-primary/50 text-primary'
                            )}
                            title={`${statusLabel} • ${metaText}`}
                          >
                            {document.status === 'processed' && <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />}
                            {document.status === 'failed' && <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />}
                            {document.status === 'processing' && <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" aria-hidden="true" />}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6 text-ai-text-muted hover:text-destructive flex-shrink-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              void onDelete(document.id);
                            }}
                            aria-label={`Ta bort ${document.name}`}
                          >
                            <Trash className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDocumentManager;
