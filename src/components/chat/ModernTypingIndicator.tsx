
import React from 'react';
import { Brain } from 'lucide-react';

const ModernTypingIndicator = () => {
  return (
    <div className="flex gap-3 items-start max-w-full animate-fade-in">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
        <Brain className="w-4 h-4 text-white" />
      </div>

      {/* Typing Bubble */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl rounded-tl-lg px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>AI-assistenten tänker</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTypingIndicator;
