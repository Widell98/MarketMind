import React from 'react';

interface AIChatLayoutProps {
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ children, footerSlot }) => {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f6f9ff] via-white to-[#eef3ff] transition-colors duration-500 dark:from-ai-shell dark:via-ai-shell dark:to-ai-shell" />
        <div className="pointer-events-none absolute left-1/2 top-[-25%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/65 blur-3xl dark:bg-[#1f2a44]/40" />
        <div className="pointer-events-none absolute bottom-[-30%] right-[-8%] h-[460px] w-[460px] rounded-full bg-[#c7d8ff]/45 blur-[160px] dark:bg-[#0b1326]/70" />
        <div className="pointer-events-none absolute bottom-[15%] left-[-12%] h-[380px] w-[380px] rounded-full bg-[#e9f2ff]/65 blur-[150px] dark:bg-[#172035]/60" />
      </div>
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:max-w-7xl 2xl:max-w-[1400px]">
        <div className="flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-white/85 shadow-[0_40px_120px_rgba(15,23,42,0.08)] ring-1 ring-white/50 backdrop-blur-2xl transition-all duration-500 dark:rounded-ai-lg dark:bg-ai-surface/95 dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)] dark:ring-ai-border/60">
          {children}
          {footerSlot && (
            <div className="border-t border-white/60 bg-white/80 px-4 py-4 text-sm text-ai-text-muted backdrop-blur-sm transition-colors dark:border-ai-border/60 dark:bg-ai-surface-muted/40">
              {footerSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatLayout;
