
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    analysisType?: string;
    confidence?: number;
    isExchangeRequest?: boolean;
  };
}

interface AIChatProps {
  portfolioId?: string;
}

const AIChat = ({ portfolioId }: AIChatProps) => {
  const {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    isAnalyzing,
    quotaExceeded,
    isLoadingSession,
    sendMessage,
    analyzePortfolio,
    createNewSession,
    loadSession,
    deleteSession,
    clearMessages,
    getQuickAnalysis,
  } = useAIChat(portfolioId);

  const [input, setInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Auto-scroll when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load the most recent session on component mount
    if (portfolioId) {
      // loadSessions(); // Ensure sessions are loaded when component mounts
    }
  }, [portfolioId]);

  useEffect(() => {
    // Handle navigation state for creating new sessions
    if (location.state?.createNewSession) {
      const { sessionName, initialMessage } = location.state;
      createNewSession(sessionName, initialMessage);
      
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, createNewSession]);

  useEffect(() => {
    const handleCreateStockChat = (event: CustomEvent) => {
      const { sessionName, message } = event.detail;
      createNewSession(sessionName, message);
    };

    const handleExamplePrompt = (event: CustomEvent) => {
      const { message } = event.detail;
      setInput(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

    window.addEventListener('createStockChat', handleCreateStockChat as EventListener);
    window.addEventListener('sendExamplePrompt', handleExamplePrompt as EventListener);

    return () => {
      window.removeEventListener('createStockChat', handleCreateStockChat as EventListener);
      window.removeEventListener('sendExamplePrompt', handleExamplePrompt as EventListener);
    };
  }, [createNewSession]);

  // Intersection Observer for mobile chat expansion
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Chat is in view, expand on mobile
            if (window.innerWidth <= 768) {
              setIsExpanded(true);
            }
          } else {
            // Chat is out of view, collapse on mobile
            if (window.innerWidth <= 768) {
              setIsExpanded(false);
            }
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of the chat is visible
        rootMargin: '-50px 0px', // Add some margin to trigger earlier
      }
    );

    if (chatContainerRef.current) {
      observer.observe(chatContainerRef.current);
    }

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsExpanded(false); // Reset expansion state on desktop
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (chatContainerRef.current) {
        observer.unobserve(chatContainerRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();
    setInput('');
    
    await sendMessage(messageToSend);
  };

  const handleNewSession = async () => {
    await createNewSession();
    setInput('');
  };

  // Dynamic height based on expansion state
  const chatHeight = isExpanded 
    ? 'h-[85vh] sm:h-[75vh] lg:h-[80vh] xl:h-[85vh]' 
    : 'h-[75vh] lg:h-[80vh] xl:h-[85vh]';

  return (
    <div 
      ref={chatContainerRef}
      className={`flex flex-col ${chatHeight} bg-transparent overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'fixed inset-4 z-50 bg-background rounded-2xl shadow-2xl border md:relative md:inset-auto md:z-auto md:bg-transparent md:shadow-none md:border-0' : ''
      }`}
    >
      {/* Mobile close button when expanded */}
      {isExpanded && (
        <div className="md:hidden flex justify-end p-3 border-b">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <ChatHeader
        showSessions={showSessions}
        setShowSessions={setShowSessions}
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={isLoading}
        onNewSession={handleNewSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
      />

      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        isLoadingSession={isLoadingSession}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        quotaExceeded={quotaExceeded}
        inputRef={inputRef}
      />
    </div>
  );
};

export default AIChat;
