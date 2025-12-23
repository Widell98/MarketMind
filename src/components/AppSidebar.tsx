import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Home, TrendingUp, BarChart3, Lock, Brain, Sparkles, User, Settings, HelpCircle, Newspaper, ArrowLeft, Activity } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import HelpButton from '@/components/HelpButton';

interface AppSidebarProps {
  onToggleToChatHistory?: () => void;
  renderDirectly?: boolean; // Om true, renderar innehållet direkt utan Sidebar-wrappern
}

const AppSidebar: React.FC<AppSidebarProps> = ({ onToggleToChatHistory, renderDirectly = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const isChatRoute = location.pathname.startsWith('/ai-chat') || location.pathname.startsWith('/ai-chatt');
  const aiNavigation = [{
    name: t('nav.aiChat'),
    href: '/ai-chatt',
    icon: Brain
  }, {
    name: t('nav.portfolio'),
    href: '/portfolio-implementation',
    icon: BarChart3,
    requiresAuth: true
  }];
  const analysisNavigation = [{
    name: t('nav.discover'),
    href: '/discover',
    icon: Sparkles
  }, {
    name: 'Prediction markets', 
    href: '/predictions',
    icon: TrendingUp
  }, {
    name: t('nav.news'),
    href: '/news',
    icon: Newspaper
  }];
  const userNavigation = [{
    name: t('nav.profile'),
    href: '/profile',
    icon: User,
    requiresAuth: true
  }];
  const handleLockedNavigation = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      window.location.href = '/auth';
    }
  };
  const renderNavItem = (item: any, asListItem = true) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href || item.href !== '/' && location.pathname.startsWith(item.href);
    const isLocked = item.requiresAuth && !user;
    const linkContent = (
      <Link 
        to={isLocked ? '#' : item.href} 
        onClick={e => handleLockedNavigation(e, item.requiresAuth || false)} 
        className={cn('flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 relative px-2 py-2 sm:px-3 sm:py-2.5', isActive && !isLocked ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20' : isLocked ? 'text-muted-foreground/60 cursor-pointer hover:text-muted-foreground hover:bg-muted/40 hover:shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/70 hover:to-muted/50 hover:shadow-sm')}
      >
        {isLocked ? <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        <span className="truncate">{item.name}</span>
      </Link>
    );

    if (!asListItem) {
      return <li key={item.name}>{linkContent}</li>;
    }

    return <SidebarMenuItem key={item.name}>
        <SidebarMenuButton asChild>
          {linkContent}
        </SidebarMenuButton>
      </SidebarMenuItem>;
  };
  const navigationContent = (
    <>
      {/* Home Section */}
      <div className="relative flex w-full min-w-0 flex-col p-2">
        <div className="text-[10px] sm:text-xs font-semibold text-primary flex items-center gap-1.5 sm:gap-2 relative pr-8 sm:pr-10 md:pr-12 mb-2">
          <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t('nav.mainMenu')}
          {/* Flytande return-ikon för chat-historik - bara synlig i /ai-chatt */}
          {isChatRoute && onToggleToChatHistory && (
            <button
              onClick={onToggleToChatHistory}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary border border-primary/20 hover:border-primary/30 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md active:scale-95"
              aria-label="Visa chat-historik"
              title="Chat-historik"
            >
              <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            </button>
          )}
        </div>
        <div className="relative flex w-full min-w-0 flex-col">
          <ul className="space-y-1">
            {renderNavItem({ name: t('nav.home'), href: '/', icon: Home }, !renderDirectly)}
            {user && renderNavItem({ name: t('nav.profile'), href: '/profile', icon: User, requiresAuth: true }, !renderDirectly)}
          </ul>
        </div>
      </div>

      {/* AI Tools Section */}
      <div className="relative flex w-full min-w-0 flex-col p-2">
        <div className="text-[10px] sm:text-xs font-semibold text-primary flex items-center gap-1.5 sm:gap-2 mb-2">
          <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t('nav.aiTools')}
        </div>
        <div className="relative flex w-full min-w-0 flex-col">
          <ul className="space-y-1">
            {aiNavigation.map(item => renderNavItem(item, !renderDirectly))}
          </ul>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="relative flex w-full min-w-0 flex-col p-2">
        <div className="text-[10px] sm:text-xs font-semibold text-primary flex items-center gap-1.5 sm:gap-2 mb-2">
          <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t('nav.analysis')}
        </div>
        <div className="relative flex w-full min-w-0 flex-col">
          <ul className="space-y-1">
            {analysisNavigation.map(item => renderNavItem(item, !renderDirectly))}
          </ul>
        </div>
      </div>

      {/* Help Section */}
      <div className="relative flex w-full min-w-0 flex-col p-2 mt-auto pt-2 sm:pt-3 md:pt-4 border-t">
        
      </div>
    </>
  );

  if (renderDirectly) {
    return (
      <div className="flex h-full w-full flex-col bg-gradient-to-b from-background via-background to-muted/20 overflow-auto">
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden px-2 py-3 sm:px-3 sm:py-4 md:px-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6">
          {navigationContent}
        </div>
      </div>
    );
  }

  return <Sidebar className="border-r bg-gradient-to-b from-background via-background to-muted/20 shadow-sm">
      <SidebarContent className="px-2 py-3 sm:px-3 sm:py-4 md:px-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] sm:text-xs font-semibold text-primary flex items-center gap-1.5 sm:gap-2 relative pr-8 sm:pr-10 md:pr-12">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t('nav.mainMenu')}
            {/* Flytande return-ikon för chat-historik - bara synlig i /ai-chatt */}
            {isChatRoute && onToggleToChatHistory && (
              <button
                onClick={onToggleToChatHistory}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary border border-primary/20 hover:border-primary/30 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md active:scale-95"
                aria-label="Visa chat-historik"
                title="Chat-historik"
              >
                <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </button>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderNavItem({ name: t('nav.home'), href: '/', icon: Home })}
              {user && renderNavItem({ name: t('nav.profile'), href: '/profile', icon: User, requiresAuth: true })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] sm:text-xs font-semibold text-primary flex items-center gap-1.5 sm:gap-2">
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t('nav.aiTools')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiNavigation.map(item => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analysis Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] sm:text-xs font-semibold text-primary flex items-center gap-1.5 sm:gap-2">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t('nav.analysis')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analysisNavigation.map(item => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Help Section */}
        <SidebarGroup className="mt-auto pt-2 sm:pt-3 md:pt-4 border-t">
          
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
};
export default AppSidebar;
