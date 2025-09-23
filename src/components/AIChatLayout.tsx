import React from 'react';

interface AIChatLayoutProps {
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ children, footerSlot }) => {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-ai-shell transition-colors duration-300" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,128,255,0.16)_0,_rgba(56,128,255,0.05)_40%,rgba(255,255,255,0)_85%)] opacity-80 dark:hidden" />
        <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl dark:hidden" />
        <div className="pointer-events-none absolute -right-28 bottom-12 h-72 w-72 rounded-full bg-blue-100/40 blur-[120px] dark:hidden" />
      </div>
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:max-w-7xl 2xl:max-w-[1400px]">
        <div className="flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-white/90 shadow-[0_32px_80px_rgba(15,23,42,0.06)] ring-1 ring-blue-100/70 backdrop-blur-sm transition-colors duration-300 dark:rounded-ai-lg dark:bg-ai-surface dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)] dark:ring-ai-border/60">
          {children}
          {footerSlot && (
            <div className="border-t border-blue-100/70 bg-white/80 px-4 py-4 text-sm text-ai-text-muted backdrop-blur-sm transition-colors dark:border-ai-border/60 dark:bg-ai-surface-muted/40">
              {footerSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatLayout;
