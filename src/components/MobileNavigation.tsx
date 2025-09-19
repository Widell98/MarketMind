
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
  Brain,
  Search,
  Menu
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'AI-Chat', href: '/ai-chatt', icon: Brain, priority: true },
    { name: 'Aktiefall', href: '/stock-cases', icon: TrendingUp },
    { name: 'Upptäck', href: '/discover', icon: Search },
    { name: 'Portfölj', href: '/portfolio-implementation', icon: BarChart3, requiresAuth: true },
  ];

  const handleLockedNavigation = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      window.location.href = '/auth';
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-2"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Öppna navigering</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-80">
        <SheetHeader>
          <SheetTitle className="text-left">Navigering</SheetTitle>
        </SheetHeader>
        <nav className="mt-6">
          <div className="space-y-2">
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
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative w-full',
                    isActive && !isLocked
                      ? 'text-primary bg-primary/10'
                      : isLocked
                      ? 'text-muted-foreground/60 cursor-pointer hover:text-muted-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <div className="relative flex-shrink-0">
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
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
