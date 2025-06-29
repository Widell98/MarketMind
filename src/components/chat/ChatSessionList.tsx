
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
          className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer group ${
            currentSessionId === session.id
              ? 'border shadow-md'
              : 'backdrop-blur-sm hover:shadow-md border'
          }`}
          style={{
            backgroundColor: currentSessionId === session.id 
              ? 'rgba(152, 161, 188, 0.2)' 
              : 'rgba(222, 211, 196, 0.8)',
            borderColor: '#DED3C4'
          }}
          onClick={() => onLoadSession(session.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-base" style={{ color: '#555879' }}>
              {session.session_name}
            </p>
            <p className="text-sm mt-1" style={{ color: '#98A1BC' }}>
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
            className="opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 p-0 rounded-lg hover:shadow-lg"
            style={{ 
              color: '#555879',
              backgroundColor: 'rgba(85, 88, 121, 0.1)'
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      {sessions.length === 0 && (
        <p className="text-center py-6 text-base" style={{ color: '#98A1BC' }}>
          Inga tidigare chattar
        </p>
      )}
    </div>
  );
};

export default ChatSessionList;
