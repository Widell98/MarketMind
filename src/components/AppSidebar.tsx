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
  Sparkles,
  User,
  Settings
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const aiNavigation = [
    { name: 'Smart Portfölj', href: '/portfolio-implementation', icon: BarChart3, requiresAuth: true },
    { name: 'AI-Assistent', href: '/ai-chat', icon: Brain },
    { name: 'Avancerade Funktioner', href: '/advanced-features', icon: BarChart3, requiresAuth: true },
  ];

  const mainNavigation = [
    { name: 'Hem', href: '/', icon: Home },
    { name: 'Upptäck Möjligheter', href: '/stock-cases', icon: TrendingUp },
    { name: 'Analyser', href: '/market-analyses', icon: BarChart3 }
    
  ];

  const userNavigation = [
    { name: 'Profil', href: '/profile', icon: User, requiresAuth: true },
  ];

  const handleLockedNavigation = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      window.location.href = '/auth';
    }
  };

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href || 
      (item.href !== '/' && location.pathname.startsWith(item.href));
    const isLocked = item.requiresAuth && !user;
    
    return (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton asChild>
          <Link
            to={isLocked ? '#' : item.href}
            onClick={(e) => handleLockedNavigation(e, item.requiresAuth || false)}
            className={cn(
              'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 relative px-3 py-2.5',
              isActive && !isLocked
                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
                : isLocked
                ? 'text-muted-foreground/60 cursor-pointer hover:text-muted-foreground hover:bg-muted/40 hover:shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/70 hover:to-muted/50 hover:shadow-sm'
            )}
          >
            {isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            <span>{item.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r bg-gradient-to-b from-background via-background to-muted/20 shadow-sm">
      <SidebarContent className="px-4 py-6 space-y-6">
        {/* Sidebar Toggle Button */}
        <div className="flex justify-end mb-4">
          <SidebarTrigger className="h-8 w-8 border border-border hover:bg-muted" />
        </div>
        
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-primary flex items-center gap-2">
            <Home className="w-4 h-4" />
            Huvudmeny
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI-First Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI-Verktyg
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiNavigation.map((item) => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        {user && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Konto
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userNavigation.map((item) => renderNavItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
