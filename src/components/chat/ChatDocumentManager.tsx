import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatDocument } from '@/hooks/useChatDocuments';
import { cn } from '@/lib/utils';
import { OPEN_CHAT_DOCUMENT_UPLOAD_EVENT } from '@/constants/chatDocuments';
import { CheckCircle2, ChevronDown, FileText, Loader2, Sparkles, Trash } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className="border-t border-b border-ai-border/50 bg-ai-surface-muted/40 px-4 py-3 sm:px-5">
      <div className="mx-auto w-full max-w-3xl">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-ai-text-muted">
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="flex items-center gap-2 text-left text-ai-text-muted transition-colors hover:text-primary/80"
              aria-expanded={!isCollapsed}
              aria-controls="chat-document-manager-panel"
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border border-ai-border/60 text-ai-text-muted transition-transform',
                  isCollapsed ? '-rotate-90' : 'rotate-0'
                )}
              >
                <ChevronDown className="h-3 w-3" />
              </span>
              <span className="text-xs text-ai-text-muted">Uppladdade dokument ({documents.length})</span>
            </button>
            <div className="flex items-center gap-2">
              {selectedDocumentsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-primary/10 text-[10px] font-semibold uppercase tracking-wide text-primary"
                >
                  {selectedDocumentsCount} valda
                </Badge>
              )}
              {(isLoading || isUploading) && (
                <span className="flex items-center gap-1 text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" /> {isUploading ? 'Uppladdar' : 'Hämtar'}
                </span>
              )}
            </div>
          </div>
          {!isCollapsed && (
            <>
              {selectedDocumentList.length > 0 && (
                <div className="rounded-lg bg-ai-surface px-3 py-2 text-xs text-ai-text">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">AI:n använder dessa dokument som källor</p>
                    <button
                      type="button"
                      onClick={() => setIsCollapsed(true)}
                      className="text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Dölj
                    </button>
                  </div>
                  <div className="mt-1 space-y-0.5 text-[11px]">
                    {selectedDocumentList.map((document) => (
                      <p key={document.id} className="break-all">
                        {document.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <div id="chat-document-manager-panel" className="space-y-2">
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
                            'group rounded-xl border bg-white/80 px-4 py-3 text-sm transition-colors dark:bg-ai-surface',
                            isSelected
                              ? 'border-primary/70 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ring-2 ring-primary/30'
                              : 'border-ai-border/60 hover:border-ai-border'
                          )}
                        >
                          <div className="flex flex-col gap-2">
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                <Sparkles className="h-3 w-3" /> Källa vald
                              </span>
                            )}
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleDocumentClick(document.id)}
                                className="flex flex-1 items-center gap-3 text-left"
                                aria-pressed={isSelected}
                              >
                                <div
                                  className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-full border',
                                    isSelected
                                      ? 'border-primary/80 bg-primary/10 text-primary'
                                      : 'border-ai-border/60 text-ai-text-muted'
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
                          </div>
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
