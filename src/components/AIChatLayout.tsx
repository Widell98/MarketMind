import React from 'react';

interface AIChatLayoutProps {
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ children, footerSlot }) => {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-ai-shell transition-colors duration-300" />
        <div className="absolute -top-28 left-1/2 hidden h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl lg:block dark:hidden" />
        <div className="absolute bottom-[-160px] right-[-100px] hidden h-[360px] w-[360px] rounded-full bg-blue-200/30 blur-3xl md:block dark:hidden" />
      </div>
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 xl:max-w-7xl 2xl:max-w-[1400px]">
        <div className="flex h-full w-full flex-1 min-h-0 flex-col overflow-hidden rounded-[32px] bg-ai-surface shadow-[0_32px_90px_rgba(15,23,42,0.08)] ring-1 ring-ai-border/40 backdrop-blur-sm transition-colors dark:rounded-ai-lg dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          {children}
          {footerSlot && (
            <div className="border-t border-ai-border/40 bg-ai-surface/90 px-4 py-3 text-sm text-ai-text-muted backdrop-blur-sm sm:px-6 sm:py-4">
              {footerSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatLayout;
