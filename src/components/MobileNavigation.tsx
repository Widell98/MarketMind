
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Home,
  BarChart3,
  Lock,
  Brain,
  Sparkles,
  Menu,
  User
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  requiresAuth?: boolean;
  priority?: boolean;
};

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const mainNavigation: NavigationItem[] = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.discover'), href: '/discover', icon: Sparkles },
    { name: t('nav.news'), href: '/discover/news', icon: Sparkles },
  ];

  const aiNavigation: NavigationItem[] = [
    { name: t('nav.aiChat'), href: '/ai-chatt', icon: Brain, priority: true },
    { name: t('nav.portfolio'), href: '/portfolio-implementation', icon: BarChart3, requiresAuth: true },
  ];

  const userNavigation: NavigationItem[] = [
    { name: t('nav.profile'), href: '/profile', icon: User, requiresAuth: true },
  ];

  const handleLockedNavigation = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      window.location.href = '/auth';
    }
  };

  const renderNavItem = (item: NavigationItem) => {
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
          <span className="sr-only">{t('nav.openNavigation') ?? 'Öppna navigering'}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-80">
        <SheetHeader>
          <SheetTitle className="text-left">Market Mind</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-6">
          <div>
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              {t('nav.mainMenu')}
            </h3>
            <div className="mt-3 space-y-2">
              {mainNavigation.map(renderNavItem)}
            </div>
          </div>

          <div>
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              {t('nav.aiTools')}
            </h3>
            <div className="mt-3 space-y-2">
              {aiNavigation.map(renderNavItem)}
            </div>
          </div>

          {user && (
            <div>
              <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                {t('nav.account')}
              </h3>
              <div className="mt-3 space-y-2">
                {userNavigation.map(renderNavItem)}
              </div>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
