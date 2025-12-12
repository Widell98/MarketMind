
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  MessageSquare,
  TrendingUp, 
  BarChart3,
  Lock
} from 'lucide-react';
import CreditsIndicator from '@/components/CreditsIndicator';

const MainNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'Marknader', href: '/predictions', icon: TrendingUp },
    { name: 'AI-Assistent', href: '/ai-chatt', icon: MessageSquare },
    { name: 'Portfölj & Analys', href: '/portfolio-implementation', icon: BarChart3, requiresAuth: true },
    { name: 'Aktiefall', href: '/stock-cases', icon: TrendingUp },
  ];

  const handleLockedNavigation = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      // Navigate to auth page instead
      window.location.href = '/auth';
    }
  };

  return (
    <div className="flex items-center">
      <nav className="hidden md:flex space-x-1 lg:space-x-2">
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
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive && !isLocked
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isLocked
                  ? 'text-muted-foreground/60 cursor-pointer hover:text-muted-foreground hover:bg-muted/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {isLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden lg:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Credits indicator for authenticated users */}
      <div className="hidden md:flex items-center ml-4">
        <CreditsIndicator type="ai_message" showUpgrade={false} />
      </div>
    </div>
  );
};

export default MainNavigation;
