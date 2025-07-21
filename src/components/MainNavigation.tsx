
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  MessageSquare,
  TrendingUp, 
  BarChart3
} from 'lucide-react';

const MainNavigation = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'AI-Assistent', href: '/ai-chat', icon: MessageSquare },
    { name: 'Aktiefall', href: '/stock-cases', icon: TrendingUp },
    { name: 'Min Portfölj', href: '/portfolio-implementation', icon: BarChart3 },
  ];

  return (
    <nav className="hidden md:flex space-x-1 lg:space-x-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href || 
          (item.href !== '/' && location.pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden lg:inline">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MainNavigation;
