
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Home, 
  TrendingUp, 
  MessageSquare,
  BarChart3
} from 'lucide-react';

const MobileNavigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'Aktiefall', href: '/stock-cases', icon: TrendingUp },
    { name: 'AI-Chat', href: '/ai-chat', icon: MessageSquare },
    { name: 'Portfölj', href: '/portfolio-implementation', icon: BarChart3 },
  ];

  // Only show on mobile devices
  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-pb">
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 transition-all duration-200 touch-manipulation',
                'hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                isActive 
                  ? 'text-primary bg-primary/5 border-t-2 border-primary' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Icon className={cn(
                'transition-all duration-200',
                isActive ? 'w-6 h-6' : 'w-5 h-5'
              )} />
              <span className={cn(
                'text-xs font-medium transition-all duration-200',
                isActive && 'font-semibold'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
