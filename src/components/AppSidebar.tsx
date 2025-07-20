
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
  Settings,
  Zap
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  const aiNavigation = [
    { 
      name: 'AI-Assistent', 
      href: '/ai-chat', 
      icon: Brain, 
      priority: true,
      description: 'Chatta med AI om investeringar'
    },
    { 
      name: 'Smart Portfolio', 
      href: '/portfolio-implementation', 
      icon: BarChart3, 
      requiresAuth: true,
      description: 'AI-driven portföljanalys'
    },
  ];

  const mainNavigation = [
    { 
      name: 'Hem', 
      href: '/', 
      icon: Home,
      description: 'Startsida och översikt'
    },
    { 
      name: 'Aktiefall', 
      href: '/stock-cases', 
      icon: TrendingUp,
      description: 'Utforska investeringsmöjligheter'
    },
  ];

  const userNavigation = [
    { 
      name: 'Profil', 
      href: '/profile', 
      icon: User, 
      requiresAuth: true,
      description: 'Hantera ditt konto'
    },
  ];

  const handleLockedNavigation = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      window.location.href = '/auth';
    }
  };

  const renderNavItem = (item: any, isPriority = false) => {
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
              'group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden',
              'hover:scale-[1.02] hover:shadow-md',
              isActive && !isLocked
                ? 'bg-gradient-to-r from-primary to-blue-600 text-primary-foreground shadow-lg scale-[1.02]'
                : isLocked
                ? 'text-muted-foreground/60 cursor-pointer hover:text-muted-foreground hover:bg-muted/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:to-blue-50/50',
              isPriority && 'border border-primary/20 shadow-sm',
              'before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-blue-50/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300'
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
              isActive && !isLocked
                ? 'bg-white/20 text-white'
                : isPriority
                ? 'bg-gradient-to-br from-primary/10 to-blue-100/50 text-primary group-hover:from-primary/20 group-hover:to-blue-200/50'
                : 'bg-muted/50 group-hover:bg-muted'
            )}>
              {isLocked ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.name}</span>
                  {isPriority && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-0.5 shadow-sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <p className="text-xs opacity-70 mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className={cn(
      "border-r border-border/50 backdrop-blur-sm transition-all duration-300",
      isCollapsed ? "w-20" : "w-72"
    )}>
      <SidebarContent className="px-4 py-6 space-y-6">
        {/* AI-First Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-sm font-bold mb-4 flex items-center gap-2",
            "bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
          )}>
            {!isCollapsed && (
              <>
                <Zap className="w-4 h-4 text-primary" />
                AI-Verktyg
              </>
            )}
            {isCollapsed && <Brain className="w-5 h-5 text-primary mx-auto" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {aiNavigation.map((item) => renderNavItem(item, true))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            {!isCollapsed && "Huvudmeny"}
            {isCollapsed && <Home className="w-4 h-4 mx-auto" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainNavigation.map((item) => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        {user && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              {!isCollapsed && "Konto"}
              {isCollapsed && <User className="w-4 h-4 mx-auto" />}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {userNavigation.map((item) => renderNavItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* AI Status Indicator */}
        {!isCollapsed && (
          <div className="mt-auto pt-4 border-t border-border/50">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  AI Aktiv
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Redo att hjälpa dig med smarta investeringsbeslut
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
