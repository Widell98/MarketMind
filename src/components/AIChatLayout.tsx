import React from 'react';

interface AIChatLayoutProps {
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ children, footerSlot }) => {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-white lg:min-h-[85vh] lg:bg-[#f7f8fb] xl:min-h-[88vh] 2xl:min-h-[90vh] dark:bg-ai-shell">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/70 to-white opacity-90 transition-colors duration-300 lg:from-[#f3f5fb] lg:via-white/60 lg:to-white dark:from-ai-shell dark:via-ai-shell/95 dark:to-ai-shell" />
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-64 bg-[radial-gradient(circle_at_top,_rgba(20,66,114,0.08),_transparent_55%)] lg:block" />
      </div>
      <div className="relative flex h-full w-full flex-1 px-0 py-0 sm:px-4 sm:py-4 lg:px-6 lg:py-6 xl:px-8">
        <div className="flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden rounded-none bg-white/95 shadow-none ring-0 transition-colors duration-300 backdrop-blur sm:rounded-[24px] sm:bg-white sm:shadow-[0_32px_80px_rgba(15,23,42,0.06)] sm:ring-1 sm:ring-[#144272]/25 sm:backdrop-blur-sm dark:bg-ai-surface/95 dark:backdrop-blur-none dark:sm:rounded-ai-lg dark:sm:bg-ai-surface dark:sm:shadow-[0_24px_60px_rgba(0,0,0,0.55)] dark:sm:ring-ai-border/60 lg:rounded-[32px] lg:border lg:border-white/70 lg:bg-white lg:shadow-[0_60px_160px_rgba(15,23,42,0.12)] dark:lg:border-ai-border/50 dark:lg:bg-ai-surface dark:lg:shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
          {children}
          {footerSlot && (
            <div className="border-t border-[#144272]/20 bg-white px-4 py-4 text-sm text-ai-text-muted backdrop-blur-sm transition-colors dark:border-ai-border/60 dark:bg-ai-surface-muted/40">
              {footerSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatLayout;
