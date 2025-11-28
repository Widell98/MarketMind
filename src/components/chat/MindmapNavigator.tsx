import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useChatFolders, type ChatSession } from '@/hooks/useChatFolders';
import { useGuideSession } from '@/hooks/useGuideSession';
import {
  Crown,
  Edit,
  Link2,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Move,
  Plus,
  MessageSquare,
  RefreshCcw,
  Sparkles,
  Tags,
  Trash,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from 'lucide-react';
import EditSessionNameDialog from './EditSessionNameDialog';
import CreateFolderDialog from './CreateFolderDialog';
import type {
  MindmapEdge,
  MindmapGroup,
  MindmapIcon,
  MindmapLayout,
  MindmapNode,
  MindmapPoint,
  MindmapTag,
} from '@/types/chatMindmap';

interface MindmapNavigatorProps {
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
  onEditSessionName: (sessionId: string, name: string) => void;
  onLoadGuideSession?: () => void;
  onCreateNewSession: () => void;
  onBulkDeleteSessions?: (sessionIds: string[]) => Promise<void> | void;
  className?: string;
  variant?: 'inline' | 'fullscreen';
  layout?: MindmapLayout;
  onUpdateLayout?: (layout: MindmapLayout) => void;
  isLayoutLoading?: boolean;
  sessionActivity?: Record<string, { messageCount: number; lastMessageAt?: string; lastAssistantAt?: string }>;
  sessions?: ChatSession[];
  documentIds?: Set<string>;
  onPrefillPrompt?: (sessionId: string, prompt: string) => void;
}

const folderIconMap: Record<string, MindmapIcon> = {
  market: 'chart',
  aktie: 'trend',
  aktier: 'trend',
  portfölj: 'folder',
  strategi: 'lightbulb',
};

const getIconFromName = (name?: string): MindmapIcon => {
  if (!name) return 'sparkles';
  const lowered = name.toLowerCase();
  const matchedEntry = Object.entries(folderIconMap).find(([keyword]) => lowered.includes(keyword));
  return matchedEntry?.[1] ?? 'sparkles';
};

const tagPalette = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4'];

const getTagColor = (label: string): string => {
  const normalized = label.toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return tagPalette[Math.abs(hash) % tagPalette.length];
};

const normalizeTags = (tags?: string[] | MindmapTag[]) => {
  if (!tags) return [] as MindmapTag[];
  return tags.map((tag) => {
    if (typeof tag === 'string') {
      return { id: tag.toLowerCase(), label: tag, color: getTagColor(tag) } satisfies MindmapTag;
    }
    return { ...tag, color: tag.color ?? getTagColor(tag.label) } satisfies MindmapTag;
  });
};

const useContainerSize = (ref: React.RefObject<HTMLDivElement>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(ref.current);
    setSize({
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
    });

    return () => observer.disconnect();
  }, [ref]);

  return size;
};

const MindmapNavigator: React.FC<MindmapNavigatorProps> = ({
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onEditSessionName,
  onLoadGuideSession,
  onCreateNewSession,
  onBulkDeleteSessions,
  className,
  variant = 'inline',
  layout,
  onUpdateLayout,
  isLayoutLoading,
  sessionActivity,
  sessions: providedSessions,
  documentIds,
  onPrefillPrompt,
}) => {
  const {
    folders,
    sessions: storedSessions,
    isLoading,
    loadSessions,
    createFolder,
    updateFolder,
    deleteFolder,
    moveSessionToFolder,
  } = useChatFolders();
  const sessions = providedSessions ?? storedSessions;
  const { shouldShowGuide } = useGuideSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSession, setEditingSession] = useState<{ id: string; name: string } | null>(null);
  const [nodeMeta, setNodeMeta] = useState<Record<string, Partial<MindmapNode['meta']>>>({});
  const [positions, setPositions] = useState<Record<string, MindmapPoint>>({});
  const [groupPositions, setGroupPositions] = useState<Record<string, MindmapPoint>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [edges, setEdges] = useState<MindmapEdge[]>(() => []);
  const [groupColors, setGroupColors] = useState<Record<string, string>>({});
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const hasHydratedLayoutRef = useRef(false);
  const isMindmapBusy = isLoading || isLayoutLoading;

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (layout) {
      setPositions(layout.positions ?? {});
      setGroupPositions(layout.groupPositions ?? {});
      setEdges(layout.edges ?? []);
      setGroupColors(layout.groupColors ?? {});
      setNodeMeta(layout.nodeMeta ?? {});
      hasHydratedLayoutRef.current = true;
    }
  }, [layout]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeTag = (event.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(activeTag ?? '')) return;

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onCreateNewSession();
      }

      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        const name = window.prompt('Namn på nytt tema?');
        if (name) {
          void createFolder(name, '#6366F1');
        }
      }

      if (event.key === 'Delete' && selectedEdgeId) {
        setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createFolder, onCreateNewSession, selectedEdgeId]);

  useEffect(() => {
    setEdges((prev) =>
      prev.filter((edge) =>
        nodes.some((node) => node.id === edge.sourceId) && nodes.some((node) => node.id === edge.targetId)
      )
    );
  }, [nodes]);

  useEffect(() => {
    if (!layout && !hasHydratedLayoutRef.current) {
      hasHydratedLayoutRef.current = true;
    }
  }, [layout]);

  const groups = useMemo<MindmapGroup[]>(() => {
    const folderGroups = folders.map((folder) => ({
      id: folder.id,
      title: folder.name,
      color: groupColors[folder.id] || folder.color || '#6366F1',
      icon: getIconFromName(folder.name),
      labels: ['Tema', 'Anpassad mapp'],
      source: folder,
    }));

    const hasUngrouped = sessions.some((session) => !session.folder_id);
    const ungroupedGroup: MindmapGroup | null = hasUngrouped
      ? {
          id: 'ungrouped',
          title: 'Osorterade',
          color: '#94a3b8',
          icon: 'sparkles',
          labels: ['Allmänt', 'Ingen mapp'],
        }
      : null;

    return ungroupedGroup ? [...folderGroups, ungroupedGroup] : folderGroups;
  }, [folders, groupColors, sessions]);

  useEffect(() => {
    setGroupColors((previous) => {
      const next: Record<string, string> = {};

      groups.forEach((group) => {
        const fallbackColor = group.color || (group.id === 'ungrouped' ? '#94a3b8' : '#6366F1');
        next[group.id] = previous[group.id] ?? fallbackColor;
      });

      const previousKeys = Object.keys(previous);
      const nextKeys = Object.keys(next);
      const hasSizeChanged = previousKeys.length !== nextKeys.length;
      const hasValueChanged = nextKeys.some((key) => previous[key] !== next[key]);

      if (hasSizeChanged || hasValueChanged) {
        return next;
      }

      return previous;
    });
  }, [groups]);

  const nodes = useMemo<MindmapNode[]>(() => {
    return sessions.map((session) => {
      const groupId = session.folder_id ?? 'ungrouped';
      const group = groups.find((candidate) => candidate.id === groupId);
      const layoutMeta = nodeMeta[session.id];
      const contextMeta = session.context_data as { tags?: string[]; documentIds?: string[] } | undefined;
      const sessionTags = normalizeTags(contextMeta?.tags || layoutMeta?.tags);
      const sessionDocIds = Array.isArray(contextMeta?.documentIds)
        ? contextMeta?.documentIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        : [];
      const hasDocumentsFromSession = Boolean(sessionDocIds.length);
      const hasDocumentsFromLibrary = sessionDocIds.some((docId) => documentIds?.has(docId));
      const hasDocuments = layoutMeta?.hasDocuments ?? (hasDocumentsFromSession || hasDocumentsFromLibrary);
      const activity = sessionActivity?.[session.id];
      const lastAssistantAt = activity?.lastAssistantAt ?? layoutMeta?.lastAssistantAt;
      const lastMessageAt = activity?.lastMessageAt ?? layoutMeta?.lastMessageAt;
      const messageCount = activity?.messageCount ?? layoutMeta?.messageCount;

      const labels = [
        group?.title ?? 'Allmänt',
        new Date(session.created_at).toLocaleDateString('sv-SE'),
      ];

      return {
        id: session.id,
        session,
        groupId: session.folder_id ?? 'ungrouped',
        meta: {
          title: session.session_name,
          color: group?.color ?? '#6366F1',
          icon: session.is_active ? 'star' : group?.icon ?? 'sparkles',
          labels,
          tags: sessionTags,
          hasDocuments,
          messageCount,
          lastAssistantAt,
          lastMessageAt,
        },
      } satisfies MindmapNode;
    });
  }, [documentIds, groups, nodeMeta, sessionActivity, sessions]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const matchedNodeIds = useMemo(() => {
    if (!normalizedSearch) return new Set(nodes.map((node) => node.id));

    return new Set(
      nodes
        .filter((node) => {
          const inTitle = node.meta.title.toLowerCase().includes(normalizedSearch);
          const inLabels = node.meta.labels?.some((label) =>
            label.toLowerCase().includes(normalizedSearch)
          );
          const inTags = node.meta.tags?.some((tag) =>
            tag.label.toLowerCase().includes(normalizedSearch)
          );
          const group = groups.find((candidate) => candidate.id === (node.groupId ?? 'ungrouped'));
          const inGroup = group?.title?.toLowerCase().includes(normalizedSearch);

          return inTitle || inLabels || inTags || inGroup;
        })
        .map((node) => node.id)
    );
  }, [groups, nodes, normalizedSearch]);

  const hasSearch = normalizedSearch.length > 0;
  const actionableNodes = hasSearch ? nodes.filter((node) => matchedNodeIds.has(node.id)) : nodes;

  const activeGroups = useMemo(
    () =>
      groups.filter((group) =>
        nodes.some((node) => (node.groupId ?? 'ungrouped') === group.id)
      ),
    [groups, nodes]
  );

  const groupMatchMap = useMemo(() => {
    const map = new Map<string, boolean>();
    groups.forEach((group) => {
      const hasMatch = nodes.some(
        (node) => (node.groupId ?? 'ungrouped') === group.id && matchedNodeIds.has(node.id)
      );
      map.set(group.id, hasMatch);
    });
    return map;
  }, [groups, matchedNodeIds, nodes]);

  const center = useMemo(() => ({
    x: Math.max(width / 2, 200),
    y: Math.max(height / 2, 240),
  }), [width, height]);

  useEffect(() => {
    if (!width || !height || activeGroups.length === 0) return;

    const radius = Math.max(Math.min(width, height) / 2 - 120, 140);

    setGroupPositions((previous) => {
      const next: Record<string, MindmapPoint> = {};
      const activeGroupIds = new Set(activeGroups.map((group) => group.id));

      activeGroups.forEach((group, index) => {
        if (previous[group.id]) {
          next[group.id] = previous[group.id];
          return;
        }

        const angle = (index / activeGroups.length) * Math.PI * 2;
        next[group.id] = {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
        };
      });

      Object.entries(previous).forEach(([groupId, value]) => {
        if (activeGroupIds.has(groupId) && !next[groupId]) {
          next[groupId] = value;
        }
      });

      return next;
    });
  }, [activeGroups, center.x, center.y, height, width]);

  useEffect(() => {
    if (!width || !height || nodes.length === 0) return;

    const nodeRadius = Math.max(Math.min(width, height) / 4 - 80, 120);

    setPositions((prev) => {
      const next: Record<string, MindmapPoint> = {};

      activeGroups.forEach((group) => {
        const groupCenter = groupPositions[group.id];
        const groupedNodes = nodes.filter((node) => (node.groupId ?? 'ungrouped') === group.id);

        groupedNodes.forEach((node, index) => {
          if (prev[node.id]) {
            next[node.id] = prev[node.id];
            return;
          }

          const angle = (index / groupedNodes.length) * Math.PI * 2;
          next[node.id] = {
            x: (groupCenter?.x ?? center.x) + nodeRadius * Math.cos(angle),
            y: (groupCenter?.y ?? center.y) + nodeRadius * Math.sin(angle),
          };
        });
      });

      return next;
    });
  }, [activeGroups, center.x, center.y, groupPositions, height, nodes, width]);

  const getNearestGroup = (position: MindmapPoint) => {
    let nearest: { group: MindmapGroup; distance: number } | null = null;
    activeGroups.forEach((group) => {
      const groupPos = groupPositions[group.id];
      if (!groupPos) return;
      const distance = Math.hypot(groupPos.x - position.x, groupPos.y - position.y);
      if (!nearest || distance < nearest.distance) {
        nearest = { group, distance };
      }
    });
    return nearest;
  };

  useEffect(() => {
    if (!onUpdateLayout || !hasHydratedLayoutRef.current) return;

    if (nodes.length === 0 && edges.length === 0 && activeGroups.length === 0) return;

    const availableNodeIds = new Set(nodes.map((node) => node.id));
    const availableGroupIds = new Set(activeGroups.map((group) => group.id));

    const filteredPositions = Object.fromEntries(
      Object.entries(positions).filter(([id]) => availableNodeIds.has(id))
    );
    const filteredGroupPositions = Object.fromEntries(
      Object.entries(groupPositions).filter(([id]) => availableGroupIds.has(id))
    );
    const filteredEdges = edges.filter(
      (edge) => availableNodeIds.has(edge.sourceId) && availableNodeIds.has(edge.targetId)
    );

    onUpdateLayout({
      positions: filteredPositions,
      groupPositions: filteredGroupPositions,
      groupColors,
      edges: filteredEdges,
      nodeMeta,
    });
  }, [activeGroups, edges, groupColors, groupPositions, nodeMeta, nodes, onUpdateLayout, positions]);

  const getNearestNode = (sessionId: string, position: MindmapPoint) => {
    let nearest: { node: MindmapNode; distance: number } | null = null;
    nodes.forEach((node) => {
      if (node.id === sessionId) return;
      const nodePos = positions[node.id];
      if (!nodePos) return;
      const distance = Math.hypot(nodePos.x - position.x, nodePos.y - position.y);
      if (!nearest || distance < nearest.distance) {
        nearest = { node, distance };
      }
    });
    return nearest;
  };

  const attachToGroupOrNode = (sessionId: string) => {
    const currentPos = positions[sessionId];
    if (!currentPos) return;
    const nearestGroup = getNearestGroup(currentPos);
    if (nearestGroup && nearestGroup.distance < 120) {
      const targetGroupId = nearestGroup.group.id === 'ungrouped' ? null : nearestGroup.group.id;
      void moveSessionToFolder(sessionId, targetGroupId);
    } else {
      const nearestNode = getNearestNode(sessionId, currentPos);
      if (nearestNode && nearestNode.distance < 140) {
        const sorted = [sessionId, nearestNode.node.id].sort();
        const edgeId = `${sorted[0]}__${sorted[1]}`;
        setEdges((prev) => {
          if (prev.some((edge) => edge.id === edgeId)) return prev;
          return [
            ...prev,
            { id: edgeId, sourceId: sorted[0], targetId: sorted[1], createdAt: Date.now() },
          ];
        });
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const confirmed =
      typeof window === 'undefined' ? true : window.confirm('Vill du ta bort chatten?');
    if (!confirmed) return;

    await Promise.resolve(onDeleteSession(sessionId));
  };

  const handleBulkClear = async () => {
    if (actionableNodes.length === 0) return;
    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm('Vill du rensa alla filtrerade chattsessioner?');
    if (!confirmed) return;

    if (onBulkDeleteSessions) {
      await Promise.resolve(onBulkDeleteSessions(actionableNodes.map((node) => node.id)));
    } else {
      for (const node of actionableNodes) {
        await Promise.resolve(onDeleteSession(node.id));
      }
    }
  };

  const handleStartDrag = (sessionId: string) => (event: React.PointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startPos = positions[sessionId];
    if (!startPos) return;

    setDraggingId(sessionId);

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / viewTransform.scale;
      const deltaY = (moveEvent.clientY - startY) / viewTransform.scale;
      const nextX = Math.min(Math.max(startPos.x + deltaX, 40), width / viewTransform.scale - 40);
      const nextY = Math.min(Math.max(startPos.y + deltaY, 40), height / viewTransform.scale - 40);
      setPositions((prev) => ({ ...prev, [sessionId]: { x: nextX, y: nextY } }));
    };

    const handleUp = () => {
      setDraggingId(null);
      attachToGroupOrNode(sessionId);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const updateNodeMeta = (nodeId: string, next: Partial<MindmapMeta> | null) => {
    setNodeMeta((prev) => {
      const updated = { ...prev } as Record<string, Partial<MindmapMeta>>;
      if (!next) {
        delete updated[nodeId];
        return updated;
      }

      updated[nodeId] = { ...updated[nodeId], ...next };
      return updated;
    });
  };

  const handleAddTag = (nodeId: string) => {
    const tag = typeof window === 'undefined' ? '' : window.prompt('Lägg till tagg');
    if (!tag) return;
    const normalized = normalizeTags([tag])[0];
    updateNodeMeta(nodeId, {
      tags: Array.from(
        new Map(
          [
            ...(nodeMeta[nodeId]?.tags ?? []),
            normalized,
          ].map((entry) => [entry.id, entry])
        ).values()
      ),
    });
  };

  const handleRemoveTags = (nodeId: string) => {
    updateNodeMeta(nodeId, { tags: [] });
  };

  const handleToggleDocuments = (nodeId: string) => {
    const hasDocs = nodeMeta[nodeId]?.hasDocuments;
    updateNodeMeta(nodeId, { hasDocuments: !hasDocs });
  };

  const handlePanStart = (event: React.PointerEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-node-id]')) return;

    setIsPanning(true);
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      originX: viewTransform.x,
      originY: viewTransform.y,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!panStartRef.current) return;
      const deltaX = moveEvent.clientX - panStartRef.current.x;
      const deltaY = moveEvent.clientY - panStartRef.current.y;
      setViewTransform((prev) => ({ ...prev, x: panStartRef.current!.originX + deltaX, y: panStartRef.current!.originY + deltaY }));
    };

    const handleUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const handleZoom = (direction: 'in' | 'out', pivot?: { x: number; y: number }) => {
    const factor = direction === 'in' ? 1.1 : 0.9;
    setViewTransform((prev) => {
      const nextScale = Math.min(Math.max(prev.scale * factor, 0.5), 2.5);
      const originX = pivot?.x ?? width / 2;
      const originY = pivot?.y ?? height / 2;
      const deltaScale = nextScale / prev.scale;
      return {
        scale: nextScale,
        x: originX - (originX - prev.x) * deltaScale,
        y: originY - (originY - prev.y) * deltaScale,
      };
    });
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    if (!width || !height) return;
    event.preventDefault();
    handleZoom(event.deltaY < 0 ? 'in' : 'out', { x: event.clientX, y: event.clientY });
  };

  const fitToScreen = () => {
    if (!containerRef.current || nodes.length === 0) return;

    const values = Object.values(positions);
    if (values.length === 0) return;

    const minX = Math.min(...values.map((point) => point.x));
    const maxX = Math.max(...values.map((point) => point.x));
    const minY = Math.min(...values.map((point) => point.y));
    const maxY = Math.max(...values.map((point) => point.y));
    const padding = 80;

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const scaleX = width / contentWidth;
    const scaleY = height / contentHeight;
    const nextScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 2.5);

    setViewTransform({
      scale: nextScale,
      x: (width - (maxX + minX) * nextScale) / 2,
      y: (height - (maxY + minY) * nextScale) / 2,
    });
  };

  const renderIcon = (icon?: MindmapIcon) => {
    switch (icon) {
      case 'chart':
        return <Sparkles className="h-3.5 w-3.5 rotate-45" />;
      case 'folder':
        return <Crown className="h-3.5 w-3.5" />;
      case 'trend':
        return <RefreshCcw className="h-3.5 w-3.5 rotate-180" />;
      case 'star':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'lightbulb':
        return <Edit className="h-3.5 w-3.5" />;
      default:
        return <Sparkles className="h-3.5 w-3.5" />;
    }
  };

  const renderSessionNode = (node: MindmapNode) => {
    const position = positions[node.id];
    if (!position) return null;

    const { session, meta } = node;
    const isActive = currentSessionId === session.id;
    const group = groups.find((candidate) => candidate.id === node.groupId);
    const folderName = group?.title;
    const isMatch = matchedNodeIds.has(session.id);
    const isDimmed = hasSearch && !isMatch;
    const hasDocuments = Boolean(meta.hasDocuments);
    const messageCount = meta.messageCount ?? 0;
    const lastReplyAt = meta.lastAssistantAt ?? meta.lastMessageAt;
    const lastReplyLabel = lastReplyAt
      ? new Date(lastReplyAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
      : null;

    return (
      <div
        key={session.id}
        style={{
          transform: `translate(${position.x - 80}px, ${position.y - 40}px)`,
          borderColor: meta.color ?? undefined,
        }}
        className={cn(
          'absolute w-44 cursor-grab rounded-ai-lg border p-3 shadow-lg transition-all',
          'bg-ai-surface text-sm hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl',
          draggingId === session.id && 'cursor-grabbing opacity-80',
          isActive && 'border-primary/60 bg-primary/10 text-foreground',
          isDimmed && 'opacity-50 grayscale',
          isMatch && hasSearch && 'ring-2 ring-primary/40'
        )}
        onPointerDown={handleStartDrag(session.id)}
        onDoubleClick={() => onLoadSession(session.id)}
        title="Dra för att koppla, dubbelklicka för att öppna"
        data-node-id={session.id}
      >
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onLoadSession(session.id)}
            className="flex-1 text-left font-semibold leading-6 line-clamp-2"
          >
            {meta.title}
          </button>
          <div className="flex items-center gap-1">
            {hasDocuments ? (
              <Badge
                variant="outline"
                className="border-ai-border/60 bg-primary/10 px-2 py-0 text-[11px] text-primary"
              >
                <Paperclip className="mr-1 h-3 w-3" />
                Bilagor
              </Badge>
            ) : null}
            {onPrefillPrompt ? (
              <button
                type="button"
                aria-label="Snabbfråga"
                onClick={(event) => {
                  event.stopPropagation();
                  onPrefillPrompt(
                    session.id,
                    `Kan du fortsätta konversationen kring "${meta.title}" och dela de viktigaste insikterna?`
                  );
                }}
                className="rounded-full p-1 text-ai-text-muted transition hover:bg-primary/10 hover:text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Byt namn"
              onClick={(event) => {
                event.stopPropagation();
                setEditingSession({ id: session.id, name: session.session_name });
              }}
              className="rounded-full p-1 text-ai-text-muted transition hover:bg-ai-surface-muted hover:text-foreground"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Ta bort"
              onClick={(event) => {
                event.stopPropagation();
                void handleDeleteSession(session.id);
              }}
              className="rounded-full p-1 text-ai-text-muted transition hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full p-1 text-ai-text-muted transition hover:bg-ai-surface-muted hover:text-foreground"
                  aria-label="Fler alternativ"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 rounded-ai-md border border-ai-border/60 bg-ai-surface p-1 shadow-lg">
                <DropdownMenuItem onClick={() => onLoadSession(session.id)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Öppna session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingSession({ id: session.id, name: session.session_name })}>
                  <Edit className="mr-2 h-4 w-4" />
                  Byt namn
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const target = window.prompt('Flytta till tema (ange namn eller lämna tomt för osorterad)');
                    if (target === null) return;
                    const folderMatch = folders.find(
                      (folder) => folder.name.toLowerCase() === target.toLowerCase()
                    );
                    void moveSessionToFolder(session.id, folderMatch?.id ?? null);
                  }}
                >
                  <Move className="mr-2 h-4 w-4" />
                  Flytta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddTag(session.id)}>
                  <Tags className="mr-2 h-4 w-4" />
                  Lägg till tagg
                </DropdownMenuItem>
                {meta.tags?.length ? (
                  <DropdownMenuItem onClick={() => handleRemoveTags(session.id)}>
                    <Trash className="mr-2 h-4 w-4" />
                    Rensa taggar
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => handleToggleDocuments(session.id)}>
                  <Paperclip className="mr-2 h-4 w-4" />
                  {hasDocuments ? 'Markera utan bilagor' : 'Markera med bilagor'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => void handleDeleteSession(session.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Ta bort
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-ai-text-muted">
          <div className="flex items-center gap-1">
            <span>{new Date(session.created_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-1 rounded-full bg-ai-surface-muted/60 px-2 py-0.5 text-[11px]">
              {renderIcon(meta.icon)}
              {meta.labels?.[0] ?? 'Tema'}
            </span>
          </div>
          {folderName ? (
            <Badge
              variant="outline"
              style={{ borderColor: meta.color ?? undefined, color: meta.color ?? undefined }}
            >
              {folderName}
            </Badge>
          ) : null}
          {messageCount > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-ai-surface-muted/60 px-2 py-0.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {messageCount}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center justify-between text-[12px] text-ai-text-muted">
          {lastReplyLabel ? (
            <span className="flex items-center gap-1 rounded-full bg-ai-surface-muted/60 px-2 py-0.5">
              <Sparkles className="h-3 w-3" />
              Senast svar: {lastReplyLabel}
            </span>
          ) : (
            <span className="rounded-full bg-ai-surface-muted/60 px-2 py-0.5">Ingen historik än</span>
          )}
          {meta.tags?.length ? (
            <div className="flex flex-wrap gap-1">
              {meta.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{ borderColor: tag.color ?? undefined, color: tag.color ?? undefined }}
                  className="border-ai-border/60 bg-transparent text-[11px]"
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const mapTransformStyle = useMemo(
    () => ({
      transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
      transformOrigin: '0 0',
    }),
    [viewTransform.scale, viewTransform.x, viewTransform.y]
  );

  const connectors = [
    ...activeGroups
      .map((group) => {
        const position = groupPositions[group.id];
        if (!position) return null;
        const isGroupMatch = groupMatchMap.get(group.id);
        return (
          <line
            key={`group-${group.id}`}
            x1={center.x}
            y1={center.y}
            x2={position.x}
            y2={position.y}
            stroke="currentColor"
            strokeOpacity={hasSearch && !isGroupMatch ? 0.06 : 0.15}
            strokeWidth={1.6}
          />
        );
      })
      .filter((line): line is JSX.Element => Boolean(line)),
    ...nodes
      .map((node) => {
        const position = positions[node.id];
        const groupCenter = groupPositions[node.groupId ?? 'ungrouped'];
        if (!position || !groupCenter) return null;
        const isMatch = matchedNodeIds.has(node.id);
        return (
          <line
            key={node.id}
            x1={groupCenter.x}
            y1={groupCenter.y}
            x2={position.x}
            y2={position.y}
            stroke="currentColor"
            strokeOpacity={hasSearch && !isMatch ? 0.08 : 0.15}
            strokeWidth={1.25}
          />
        );
      })
      .filter((line): line is JSX.Element => Boolean(line)),
    ...edges
      .filter((edge) => positions[edge.sourceId] && positions[edge.targetId])
      .map((edge) => {
        const source = positions[edge.sourceId];
        const target = positions[edge.targetId];
        const isSelected = selectedEdgeId === edge.id;
        const bothMatch = matchedNodeIds.has(edge.sourceId) && matchedNodeIds.has(edge.targetId);
        return (
          <line
            key={`edge-${edge.id}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={isSelected ? 'var(--primary)' : 'currentColor'}
            strokeOpacity={isSelected ? 0.45 : hasSearch && !bothMatch ? 0.08 : 0.18}
            strokeWidth={isSelected ? 2.4 : 1.25}
            className="cursor-pointer"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedEdgeId(edge.id);
            }}
            onDoubleClick={() => {
              setEdges((prev) => prev.filter((candidate) => candidate.id !== edge.id));
              setSelectedEdgeId(null);
            }}
          />
        );
      }),
  ];

  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);
  const selectedEdgeNodes = selectedEdge
    ? [selectedEdge.sourceId, selectedEdge.targetId].map((id) => nodes.find((node) => node.id === id))
    : [];

  const renderGroupHub = (group: MindmapGroup) => {
    const position = groupPositions[group.id];
    if (!position) return null;

    const isUngrouped = group.id === 'ungrouped';
    const groupedSessions = nodes.filter((node) => (node.groupId ?? 'ungrouped') === group.id);
    const isDimmed = hasSearch && !groupMatchMap.get(group.id);

    return (
      <div
        key={group.id}
        style={{ transform: `translate(${position.x - 70}px, ${position.y - 34}px)` }}
        className={cn(
          'absolute flex w-36 flex-col gap-1 rounded-ai-lg border border-ai-border/60 bg-ai-surface px-3 py-2 text-xs shadow-md',
          isDimmed && 'opacity-60 grayscale'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 font-semibold" style={{ color: group.color }}>
            {renderIcon(group.icon)}
            {group.title}
          </span>
          <div className="flex items-center gap-1">
            {group.labels?.[0] ? (
              <Badge variant="outline" className="border-ai-border/60 text-[11px]">
                {group.labels[0]}
              </Badge>
            ) : null}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full p-1 text-ai-text-muted transition hover:bg-ai-surface-muted hover:text-foreground"
                  aria-label="Gruppalternativ"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 rounded-ai-md border border-ai-border/60 bg-ai-surface p-1 shadow-lg">
                {!isUngrouped ? (
                  <DropdownMenuItem
                    onClick={() => {
                      const name = window.prompt('Byt namn på tema', group.title);
                      if (name && name !== group.title) {
                        void updateFolder(group.id, { name });
                      }
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Byt namn
                  </DropdownMenuItem>
                ) : null}
                {!isUngrouped ? (
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => {
                      const confirmed =
                        typeof window === 'undefined'
                          ? true
                          : window.confirm('Vill du ta bort temat och flytta chattar till osorterat?');
                      if (!confirmed) return;
                      void deleteFolder(group.id);
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Ta bort tema
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() => {
                    setEdges((prev) => prev.filter(
                      (edge) =>
                        !groupedSessions.some(
                          (sessionNode) => edge.sourceId === sessionNode.id || edge.targetId === sessionNode.id
                        )
                    ));
                  }}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Rensa kopplingar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {group.labels?.[1] ? (
          <span className="text-[11px] text-ai-text-muted">{group.labels[1]}</span>
        ) : null}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-ai-xl border border-ai-border/60 bg-gradient-to-b from-ai-surface/60 via-ai-surface to-ai-surface/60',
        variant === 'fullscreen' && 'h-full rounded-none border-0',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-ai-border/60 bg-ai-surface/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Chattmindmap</h3>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Sök efter sessioner"
            className="h-9 max-w-xs rounded-ai-md border-ai-border/60 bg-ai-surface"
          />
          <CreateFolderDialog
            onCreateFolder={(name, color) => {
              void createFolder(name, color);
            }}
            trigger={(
              <Button variant="outline" size="sm" className="rounded-ai-md">
                <Plus className="mr-2 h-4 w-4" /> Ny grupp
              </Button>
            )}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={onCreateNewSession}
            className="rounded-ai-md"
          >
            <Plus className="mr-2 h-4 w-4" /> Ny chatt
          </Button>
          {shouldShowGuide && onLoadGuideSession ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadGuideSession}
              className="rounded-ai-md"
            >
              <Crown className="mr-2 h-4 w-4" /> Guide-läge
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadSessions()}
            className="ml-auto rounded-ai-md text-ai-text-muted hover:text-foreground"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Uppdatera
          </Button>
          {actionableNodes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleBulkClear()}
              className="rounded-ai-md text-red-500 hover:bg-red-500/10"
            >
              <Trash className="mr-2 h-4 w-4" /> Rensa markerade
            </Button>
          )}
          <div className="flex items-center gap-2 rounded-ai-md bg-ai-surface-muted/70 px-3 py-1 text-[11px] text-ai-text-muted">
            <span className="font-semibold text-foreground">Genvägar</span>
            <span>Dubbelklick: öppna</span>
            <span>⌫: ta bort koppling</span>
            <span>N: ny chatt</span>
            <span>G: nytt tema</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1" onWheel={handleWheel}>
        {isMindmapBusy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ai-surface/70 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <svg className="absolute inset-0 h-full w-full text-foreground/40" aria-hidden>
          <defs>
            <radialGradient id="mindmapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.12)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mindmapGlow)" />
        </svg>

        <div className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-ai-md bg-ai-surface/80 px-2 py-2 shadow-lg">
          <Button size="icon" variant="ghost" className="rounded-ai-md" onClick={() => handleZoom('out')}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="rounded-ai-md" onClick={() => handleZoom('in')}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="rounded-ai-md" onClick={fitToScreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={cn('absolute inset-0', isPanning && 'cursor-grabbing')}
          onPointerDown={handlePanStart}
          role="presentation"
        >
          <svg
            className="absolute inset-0 h-full w-full text-foreground/40"
            style={mapTransformStyle}
            aria-hidden
          >
            {connectors}
          </svg>

          <div className="absolute inset-0" style={mapTransformStyle}>
            {activeGroups.map(renderGroupHub)}
            {nodes.map(renderSessionNode)}
          </div>
        </div>

        {nodes.length > 0 && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex w-[220px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 rounded-ai-xl border border-ai-border/60 bg-ai-surface/80 p-4 text-center shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Utforska dina konversationer</p>
              <p className="mt-1 text-xs text-ai-text-muted">Dra noderna, tryck för att öppna eller byt namn direkt.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" className="rounded-ai-md" onClick={onCreateNewSession}>
                <Plus className="mr-2 h-4 w-4" /> Ny session
              </Button>
              {onLoadGuideSession ? (
                <Button size="sm" variant="outline" className="rounded-ai-md" onClick={onLoadGuideSession}>
                  <Sparkles className="mr-2 h-4 w-4" /> Guide
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {selectedEdge && (
          <div className="pointer-events-auto absolute bottom-4 right-4 z-20 flex flex-col gap-2 rounded-ai-lg border border-ai-border/70 bg-ai-surface px-4 py-3 text-sm shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <Link2 className="h-4 w-4 text-primary" /> Markerad koppling
              </span>
              <Badge variant="outline" className="border-ai-border/60 text-[11px]">
                {new Date(selectedEdge.createdAt).toLocaleTimeString()}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 text-ai-text-muted">
              <span>{selectedEdgeNodes[0]?.meta.title ?? 'Okänd session'}</span>
              <span className="text-xs text-ai-text-muted/80">↔</span>
              <span>{selectedEdgeNodes[1]?.meta.title ?? 'Okänd session'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-ai-md"
                onClick={() => setSelectedEdgeId(null)}
              >
                Avmarkera
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-ai-md"
                onClick={() => {
                  setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdge.id));
                  setSelectedEdgeId(null);
                }}
              >
                Ta bort koppling
              </Button>
            </div>
          </div>
        )}

        {hasSearch && actionableNodes.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-ai-text-muted">
            <div className="flex flex-col items-center gap-3 rounded-ai-lg border border-ai-border/60 bg-ai-surface px-6 py-5">
              <X className="h-5 w-5" />
              <p>Ingen chatt matchade din sökning. Skapa en ny för att komma igång.</p>
              <Button onClick={onCreateNewSession} size="sm" className="rounded-ai-md">
                <Plus className="mr-2 h-4 w-4" /> Starta ny konversation
              </Button>
            </div>
          </div>
        )}
      </div>

      <EditSessionNameDialog
        open={Boolean(editingSession)}
        sessionId={editingSession?.id ?? ''}
        currentName={editingSession?.name ?? ''}
        onClose={() => setEditingSession(null)}
        onSave={(name) => {
          if (editingSession) {
            onEditSessionName(editingSession.id, name);
            setEditingSession(null);
          }
        }}
      />
    </div>
  );
};

export default MindmapNavigator;
