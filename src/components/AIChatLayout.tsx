import React from 'react';

interface AIChatLayoutProps {
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ children, footerSlot }) => {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-ai-shell transition-colors duration-300"
      />
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:max-w-7xl 2xl:max-w-[1400px]">
        <div className="flex h-full w-full flex-1 flex-col overflow-hidden rounded-ai-lg bg-ai-surface shadow-[0_24px_60px_rgba(15,23,42,0.08)] ring-1 ring-ai-border/60 transition-colors dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          {children}
          {footerSlot && (
            <div className="border-t border-ai-border/60 bg-ai-surface-muted/40 px-4 py-3 text-sm text-ai-text-muted">
              {footerSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatLayout;
