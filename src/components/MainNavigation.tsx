
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  TrendingUp, 
  BookOpen, 
  Target, 
  BarChart3, 
  Eye,
  MessageSquare,
  Users
} from 'lucide-react';

const MainNavigation = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'Aktiefall', href: '/stock-cases', icon: TrendingUp },
    { name: 'Lärande', href: '/learning', icon: BookOpen },
    { name: 'Portfölj-AI', href: '/portfolio-advisor', icon: Target },
    { name: 'Min Portfölj', href: '/portfolio-implementation', icon: BarChart3 },
    { name: 'AI-Assistent', href: '/ai-chat', icon: MessageSquare },
    { name: 'Watchlist', href: '/watchlist', icon: Eye },
    { name: 'Community', href: '/social', icon: Users },
  ];

  return (
    <nav className="hidden lg:flex space-x-8">
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
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default MainNavigation;
