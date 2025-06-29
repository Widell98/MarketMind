
import React from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  History,
  Zap
} from 'lucide-react';
import ChatSessionList from './ChatSessionList';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  is_active: boolean;
}

interface ChatHeaderProps {
  showSessions: boolean;
  setShowSessions: (show: boolean) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  onNewSession: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const ChatHeader = ({
  showSessions,
  setShowSessions,
  sessions,
  currentSessionId,
  isLoading,
  onNewSession,
  onLoadSession,
  onDeleteSession
}: ChatHeaderProps) => {
  return (
    <div className="backdrop-blur-sm border-b p-6 xl:p-8" style={{ backgroundColor: 'rgba(222, 211, 196, 0.5)', borderColor: '#DED3C4' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #555879, #98A1BC)' }}>
            <Zap className="w-7 h-7 text-[#F4EBD3]" />
          </div>
          <div>
            <h2 className="text-2xl xl:text-3xl font-bold" style={{ color: '#555879' }}>AI Portfolio Assistent</h2>
            <p className="text-base" style={{ color: '#98A1BC' }}>Din intelligenta investeringsrådgivare</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSessions(!showSessions)}
            className="backdrop-blur-sm border shadow-lg transition-all duration-200 px-4 py-3 hover:shadow-xl"
            style={{ 
              backgroundColor: 'rgba(244, 235, 211, 0.9)',
              borderColor: '#DED3C4',
              color: '#555879'
            }}
          >
            <History className="w-5 h-5 mr-2" />
            Historik
            {showSessions ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onNewSession}
            disabled={isLoading}
            className="backdrop-blur-sm border shadow-lg transition-all duration-200 px-4 py-3 hover:shadow-xl"
            style={{ 
              backgroundColor: 'rgba(244, 235, 211, 0.9)',
              borderColor: '#DED3C4',
              color: '#555879'
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Ny Chat
          </Button>
        </div>
      </div>

      <Collapsible open={showSessions}>
        <CollapsibleContent className="mt-6">
          <div className="backdrop-blur-sm rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(244, 235, 211, 0.9)', borderColor: '#DED3C4' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-3" style={{ color: '#555879' }}>
              <History className="w-5 h-5" />
              Tidigare chattar
            </h3>
            <ScrollArea className="h-40">
              <ChatSessionList
                sessions={sessions}
                currentSessionId={currentSessionId}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
              />
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ChatHeader;
