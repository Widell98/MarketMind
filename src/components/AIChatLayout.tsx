import React from 'react';

interface AIChatLayoutProps {
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const AIChatLayout: React.FC<AIChatLayoutProps> = ({ children, footerSlot }) => {
  return (
    // Vi tar bort alla containers som begränsar bredd (max-w), padding (px/py) och marginaler (mx-auto).
    // Vi tar även bort "kort"-designen (rounded, shadow, ring) för desktop.
    <div className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-white transition-colors duration-300 dark:bg-ai-surface">
      {/* Här låter vi children (chatten) ta upp all plats direkt utan inre containers.
         flex-1 säkerställer att den växer för att fylla höjden.
      */}
      {children}

      {footerSlot && (
        <div className="border-t border-[#144272]/20 bg-white px-4 py-4 text-sm text-ai-text-muted backdrop-blur-sm transition-colors dark:border-ai-border/60 dark:bg-ai-surface-muted/40">
          {footerSlot}
        </div>
      )}
    </div>
  );
};

export default AIChatLayout;
