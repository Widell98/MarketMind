
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
}

const ModernCard: React.FC<ModernCardProps> = ({ 
  children, 
  className, 
  title, 
  icon, 
  headerAction,
  hover = true,
  glow = false
}) => {
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
      "shadow-lg hover:shadow-xl transition-all duration-300",
      hover && "hover:scale-[1.02] hover:-translate-y-1",
      glow && "shadow-glow",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/50 before:to-transparent before:pointer-events-none",
      className
    )}>
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
      
      {title && (
        <CardHeader className="relative">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
                  {icon}
                </div>
              )}
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {title}
              </span>
            </div>
            {headerAction}
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="relative">
        {children}
      </CardContent>
    </Card>
  );
};

export default ModernCard;
