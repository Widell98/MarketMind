
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  MessageSquare,
  TrendingUp, 
  BarChart3,
  Lock,
  Brain
} from 'lucide-react';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'AI-Chat', href: '/ai-chat', icon: Brain, priority: true },
    { name: 'Aktiefall', href: '/stock-cases', icon: TrendingUp },
    { name: 'Profil', href: '/profile', icon: BarChart3, requiresAuth: true },
  ];

  const handleLockedNavigation = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      window.location.href = '/auth';
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-pb">
      <div className="flex items-center justify-around py-2 px-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          const isLocked = item.requiresAuth && !user;
          
          return (
            <Link
              key={item.name}
              to={isLocked ? '#' : item.href}
              onClick={(e) => handleLockedNavigation(e, item.requiresAuth || false)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 relative min-w-0 flex-1',
                isActive && !isLocked
                  ? 'text-primary bg-primary/10'
                  : isLocked
                  ? 'text-muted-foreground/60 cursor-pointer hover:text-muted-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <div className="relative">
                {isLocked ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                {item.priority && !isLocked && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <span className="truncate max-w-full">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
