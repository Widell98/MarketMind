import React from 'react';

interface AIChatLayoutProps {
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ children, footerSlot }) => {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#f7f9ff] transition-colors duration-300 dark:bg-ai-shell" />
        <div className="absolute -left-28 top-[-10%] h-64 w-64 rounded-full bg-gradient-to-br from-[#d7e3ff] via-white to-transparent opacity-70 blur-3xl dark:from-primary/20 dark:via-transparent" />
        <div className="absolute -right-24 bottom-[-20%] h-72 w-72 rounded-full bg-gradient-to-tl from-[#e9f2ff] via-white to-transparent opacity-80 blur-3xl dark:from-primary/15 dark:via-transparent" />
      </div>
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:max-w-7xl 2xl:max-w-[1400px]">
        <div className="flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] bg-white/90 shadow-[0_32px_80px_rgba(15,23,42,0.05)] ring-1 ring-[#144272]/15 backdrop-blur-xl transition-colors duration-300 dark:rounded-ai-lg dark:bg-ai-surface/95 dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)] dark:ring-ai-border/60">
          {children}
          {footerSlot && (
            <div className="border-t border-[#144272]/10 bg-white/90 px-4 py-4 text-sm text-ai-text-muted backdrop-blur-sm transition-colors dark:border-ai-border/60 dark:bg-ai-surface-muted/40">
              {footerSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatLayout;
