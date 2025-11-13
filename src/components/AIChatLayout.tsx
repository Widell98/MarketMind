import React from 'react';

interface AIChatLayoutProps {
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ children, footerSlot }) => {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-white transition-colors duration-300 dark:bg-ai-shell" />
      </div>
      <div className="relative mx-auto flex h-full w-full max-w-full flex-1 px-0 py-0 sm:max-w-4xl sm:px-4 sm:py-4 lg:max-w-5xl lg:px-6 lg:py-6 xl:max-w-6xl xl:px-8 xl:py-8 2xl:max-w-6xl 2xl:px-10 2xl:py-10">
        <div className="flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden rounded-none bg-white shadow-none ring-0 transition-colors duration-300 dark:bg-ai-surface sm:rounded-[24px] sm:bg-white sm:shadow-[0_32px_80px_rgba(15,23,42,0.06)] sm:ring-1 sm:ring-[#144272]/25 sm:backdrop-blur-sm dark:sm:rounded-ai-lg dark:sm:bg-ai-surface dark:sm:shadow-[0_24px_60px_rgba(0,0,0,0.55)] dark:sm:ring-ai-border/60">
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
