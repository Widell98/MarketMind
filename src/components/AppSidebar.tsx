import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, TrendingUp, BarChart3, Lock, Brain, Sparkles, User, Settings, HelpCircle, Newspaper, ArrowLeft } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import HelpButton from '@/components/HelpButton';

interface AppSidebarProps {
  onToggleToChatHistory?: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ onToggleToChatHistory }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
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
  const mainNavigation = [{
    name: t('nav.home'),
    href: '/',
    icon: Home
  }, {
    name: t('nav.discover'),
    href: '/discover',
    icon: Sparkles
  },
    {
    name: 'Prediction markets', 
    href: '/predictions',
    icon: TrendingUp
  },                      {
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
  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href || item.href !== '/' && location.pathname.startsWith(item.href);
    const isLocked = item.requiresAuth && !user;
    return <SidebarMenuItem key={item.name}>
        <SidebarMenuButton asChild>
          <Link to={isLocked ? '#' : item.href} onClick={e => handleLockedNavigation(e, item.requiresAuth || false)} className={cn('flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 relative px-3 py-2.5', isActive && !isLocked ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20' : isLocked ? 'text-muted-foreground/60 cursor-pointer hover:text-muted-foreground hover:bg-muted/40 hover:shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/70 hover:to-muted/50 hover:shadow-sm')}>
            {isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            <span>{item.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>;
  };
  return <Sidebar className="border-r bg-gradient-to-b from-background via-background to-muted/20 shadow-sm">
      <SidebarContent className="px-4 py-6 space-y-6">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-primary flex items-center gap-2 relative pr-10 sm:pr-12">
            <Home className="w-4 h-4" />
            {t('nav.mainMenu')}
            {/* Flytande return-ikon för chat-historik - bara synlig i /ai-chatt */}
            {isChatRoute && onToggleToChatHistory && (
              <button
                onClick={onToggleToChatHistory}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary border border-primary/20 hover:border-primary/30 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md active:scale-95"
                aria-label="Visa chat-historik"
                title="Chat-historik"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map(item => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI-First Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            {t('nav.aiTools')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiNavigation.map(item => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        {user && <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('nav.account')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userNavigation.map(item => renderNavItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {/* Help Section */}
        <SidebarGroup className="mt-auto pt-4 border-t">
          
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
};
export default AppSidebar;
