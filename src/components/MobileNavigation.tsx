
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import { BookOpen, TrendingUp, Heart, Brain, Briefcase, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();

  const isActive = (path: string) => location.pathname === path;

  const investingItems = [
    { title: "Browse Cases", url: "/stock-cases", icon: BookOpen },
    ...(user ? [
      { title: "Watchlist", url: "/watchlist", icon: Heart },
      { title: "Portfolio", url: "/portfolio-advisor", icon: Briefcase },
    ] : [])
  ];

  const learningItems = [
    { title: "Learning Center", url: "/learning", icon: Target },
  ];

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar side="left" className="md:hidden">
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
        <Link 
          to="/" 
          className="text-xl font-bold text-finance-navy dark:text-gray-200 flex items-center"
          onClick={handleLinkClick}
        >
          <span className="mr-2 text-xl">🧠</span>
          Market Mind
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-4 h-4" />
            Investing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {investingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive(item.url) 
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <BookOpen className="w-4 h-4" />
            Learning
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learningItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive(item.url) 
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default MobileNavigation;
