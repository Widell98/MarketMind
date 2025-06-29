
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
}

interface ChatSessionListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const ChatSessionList = ({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession
}: ChatSessionListProps) => {
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer group ${
            currentSessionId === session.id
              ? 'bg-gradient-to-r from-blue-500/20 to-sky-600/20 border border-blue-500/30 shadow-md'
              : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 hover:shadow-md border border-slate-200 dark:border-slate-700'
          }`}
          onClick={() => onLoadSession(session.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm sm:text-base text-slate-800 dark:text-slate-100">
              {session.session_name}
            </p>
            <p className="text-xs sm:text-sm mt-1 text-slate-600 dark:text-slate-300">
              {new Date(session.created_at).toLocaleDateString('sv-SE')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSession(session.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-lg hover:shadow-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      ))}
      {sessions.length === 0 && (
        <p className="text-center py-6 text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Inga tidigare chattar
        </p>
      )}
    </div>
  );
};

export default ChatSessionList;
