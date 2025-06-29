
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
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-600 to-purple-600 shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-300">
            <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl xl:text-3xl font-bold text-slate-800 dark:text-slate-100">AI Portfolio Assistent</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">Din intelligenta investeringsrådgivare</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSessions(!showSessions)}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 hover:shadow-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Historik</span>
            {showSessions ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onNewSession}
            disabled={isLoading}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 hover:shadow-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Ny Chat</span>
            <span className="sm:hidden">Ny</span>
          </Button>
        </div>
      </div>

      <Collapsible open={showSessions}>
        <CollapsibleContent className="mt-6">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-3 text-slate-800 dark:text-slate-100">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
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
