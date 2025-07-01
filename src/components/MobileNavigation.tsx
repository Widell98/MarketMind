
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  TrendingUp, 
  BarChart3,
  MessageSquare,
  Users
} from 'lucide-react';

const MobileNavigation = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'Aktiefall', href: '/stock-cases', icon: TrendingUp },
    { name: 'Portfölj', href: '/portfolio-implementation', icon: BarChart3 },
    { name: 'AI-Chat', href: '/ai-chat', icon: MessageSquare },
    { name: 'Community', href: '/social', icon: Users },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
