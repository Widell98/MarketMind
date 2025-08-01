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
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const aiNavigation = [
    { name: 'AI-Assistent', href: '/ai-chat', icon: Brain, priority: true },
    { name: 'Smart Portfölj', href: '/portfolio-implementation', icon: BarChart3, requiresAuth: true },
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
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 relative',
              isActive && !isLocked
                ? 'bg-primary text-primary-foreground shadow-sm'
                : isLocked
                ? 'text-muted-foreground/60 cursor-pointer hover:text-muted-foreground hover:bg-muted/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              isPriority && 'border-l-2 border-primary'
            )}
          >
            {isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            <span>{item.name}</span>
            {isPriority && (
              <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r transition-all duration-300">
      <SidebarContent className="px-3 py-4">
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
              {aiNavigation.map((item) => renderNavItem(item, true))}
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
