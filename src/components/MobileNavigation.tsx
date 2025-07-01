
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  TrendingUp, 
  MessageSquare,
  BarChart3
} from 'lucide-react';

const MobileNavigation = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'Aktiefall', href: '/stock-cases', icon: TrendingUp },
    { name: 'AI-Chat', href: '/ai-chat', icon: MessageSquare },
    { name: 'Portfölj', href: '/portfolio-implementation', icon: BarChart3 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="grid grid-cols-4 h-16">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:bg-primary/10 focus:text-primary active:bg-primary/20',
                isActive 
                  ? 'text-primary bg-primary/5' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
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
