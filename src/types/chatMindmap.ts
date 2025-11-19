import type { ChatFolder, ChatSession } from '@/hooks/useChatFolders';

export type MindmapIcon =
  | 'sparkles'
  | 'folder'
  | 'chart'
  | 'trend'
  | 'star'
  | 'lightbulb';

export interface MindmapMeta {
  title: string;
  color?: string;
  icon?: MindmapIcon;
  labels?: string[];
  tags?: MindmapTag[];
  hasDocuments?: boolean;
  messageCount?: number;
  lastMessageAt?: string;
  lastAssistantAt?: string;
}

export interface MindmapTag {
  id: string;
  label: string;
  color?: string;
}

export interface MindmapPoint {
  x: number;
  y: number;
}

export interface MindmapGroup {
  id: string;
  title: string;
  color?: string;
  icon?: MindmapIcon;
  labels?: string[];
  source?: ChatFolder;
}

export interface MindmapNode {
  id: string;
  session: ChatSession;
  groupId: string | null;
  meta: MindmapMeta;
}

export interface MindmapEdge {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: number;
}

export interface MindmapLayout {
  positions: Record<string, MindmapPoint>;
  groupPositions: Record<string, MindmapPoint>;
  groupColors: Record<string, string>;
  edges: MindmapEdge[];
  nodeMeta?: Record<string, Partial<MindmapMeta>>;
}
