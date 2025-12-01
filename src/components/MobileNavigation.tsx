
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
  User,
  Newspaper
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
    { name: t('nav.news'), href: '/news', icon: Newspaper },
  ];

  const aiNavigation: NavigationItem[] = [
    { name: t('nav.aiChat'), href: '/ai-chatt', icon: Brain, priority: true },
    { name: t('nav.portfolio'), href: '/portfolio-implementation', icon: BarChart3, requiresAuth: true },
  ];

  const userNavigation: NavigationItem[] = [
    { name: t('nav.profile'), href: '/profile', icon: User, requiresAuth: true },
  ];

  const navigationSections = [
    {
      title: t('nav.mainMenu'),
      icon: Home,
      items: mainNavigation,
      show: true,
    },
    {
      title: t('nav.aiTools'),
      icon: Brain,
      items: aiNavigation,
      show: true,
    },
    {
      title: t('nav.account'),
      icon: User,
      items: userNavigation,
      show: Boolean(user),
    },
  ];

  const handleLockedNavigation = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      window.location.href = '/auth';
    }
  };

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive =
      location.pathname === item.href ||
      (item.href !== '/' && location.pathname.startsWith(item.href));
    const isLocked = item.requiresAuth && !user;

    return (
      <Link
        key={item.name}
        to={isLocked ? '#' : item.href}
        onClick={(e) => handleLockedNavigation(e, item.requiresAuth || false)}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative w-full border',
          'shadow-sm hover:shadow-md',
          isActive && !isLocked
            ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-primary/40 shadow-primary/20'
            : isLocked
            ? 'text-muted-foreground/60 cursor-pointer border-transparent bg-muted/50 hover:text-muted-foreground'
            : 'text-muted-foreground border-transparent bg-background/60 hover:text-foreground hover:bg-gradient-to-r hover:from-muted/70 hover:to-muted/40'
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
      <SheetContent
        side="left"
        className="w-full sm:w-96 px-0 border-r bg-gradient-to-b from-background via-background to-muted/30 shadow-xl"
      >
        <div className="px-5 py-4 border-b bg-background/60 backdrop-blur">
          <SheetHeader>
            <SheetTitle className="text-left text-lg font-semibold tracking-tight">Market Mind</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-muted-foreground mt-1">
            {t('nav.openNavigation') ?? 'Utforska Market Mind'}
          </p>
        </div>

        <nav className="mt-4 space-y-5 px-5 pb-6">
          {navigationSections
            .filter((section) => section.show)
            .map((section) => {
              const SectionIcon = section.icon;
              return (
                <div key={section.title} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    <SectionIcon className="w-4 h-4" />
                    <span>{section.title}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {section.items.map(renderNavItem)}
                  </div>
                </div>
              );
            })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
