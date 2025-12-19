// src/components/AIChatLayout.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface AIChatLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode; // Ny prop för sidofältet
  isSidebarOpen?: boolean;   // Styr synlighet
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ 
  children, 
  sidebar, 
  isSidebarOpen = true 
}) => {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.4))] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-ai-surface">
      {/* Sidebar Area */}
      <div 
        className={cn(
          "flex-shrink-0 border-r border-gray-100 bg-gray-50/50 transition-all duration-300 ease-in-out dark:border-white/5 dark:bg-black/20",
          isSidebarOpen ? "w-[280px] translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 overflow-hidden"
        )}
      >
        {sidebar}
      </div>

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-ai-surface">
        {children}
      </div>
    </div>
  );
};

export default AIChatLayout;
