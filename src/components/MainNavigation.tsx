
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Heart, Brain, Briefcase, Users, MessageCircle, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const MainNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <NavigationMenu className="hidden md:flex z-50">
      <NavigationMenuList>
        {/* Community Section */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-10 px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 focus:bg-blue-500/10 dark:focus:bg-blue-500/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50 text-slate-900 dark:text-slate-100 rounded-xl backdrop-blur-sm">
            <Users className="w-4 h-4 mr-2" />
            Community
          </NavigationMenuTrigger>
          <NavigationMenuContent className="z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl">
            <div className="grid gap-3 p-6 w-[400px]">
              {user && (
                <NavigationMenuLink asChild>
                  <Link
                    to="/"
                    className={cn(
                      "block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 focus:bg-blue-500/10 dark:focus:bg-blue-500/20 hover:shadow-lg",
                      isActive('/') && "bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 shadow-lg"
                    )}
                  >
                    <div className="text-sm font-medium leading-none flex items-center text-slate-900 dark:text-slate-100">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Community Feed
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-slate-600 dark:text-slate-400">
                      Se de senaste insikterna från personer du följer
                    </p>
                  </Link>
                </NavigationMenuLink>
              )}
              <NavigationMenuLink asChild>
                <Link
                  to="/stock-cases"
                  className={cn(
                    "block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 focus:bg-blue-500/10 dark:focus:bg-blue-500/20 hover:shadow-lg",
                    isActive('/stock-cases') && "bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 shadow-lg"
                  )}
                >
                  <div className="text-sm font-medium leading-none flex items-center text-slate-900 dark:text-slate-100">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Browse Cases
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-slate-600 dark:text-slate-400">
                    Explore curated investment opportunities
                  </p>
                </Link>
              </NavigationMenuLink>
              {user && (
                <NavigationMenuLink asChild>
                  <Link
                    to="/watchlist"
                    className={cn(
                      "block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 focus:bg-blue-500/10 dark:focus:bg-blue-500/20 hover:shadow-lg",
                      isActive('/watchlist') && "bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 shadow-lg"
                    )}
                  >
                    <div className="text-sm font-medium leading-none flex items-center text-slate-900 dark:text-slate-100">
                      <Heart className="w-4 h-4 mr-2" />
                      Watchlist
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-slate-600 dark:text-slate-400">
                      Track your followed stock cases
                    </p>
                  </Link>
                </NavigationMenuLink>
              )}
              <NavigationMenuLink asChild>
                <Link
                  to="/learning"
                  className={cn(
                    "block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 focus:bg-blue-500/10 dark:focus:bg-blue-500/20 hover:shadow-lg",
                    isActive('/learning') && "bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 shadow-lg"
                  )}
                >
                  <div className="text-sm font-medium leading-none flex items-center text-slate-900 dark:text-slate-100">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Learning Center
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-slate-600 dark:text-slate-400">
                    Interactive quizzes and educational content
                  </p>
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* AI Portfolio - Now points to implementation page */}
        {user && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to="/portfolio-implementation"
                className={cn(
                  "h-10 px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 focus:bg-blue-500/10 dark:focus:bg-blue-500/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50 inline-flex items-center rounded-xl text-slate-900 dark:text-slate-100 backdrop-blur-sm",
                  (isActive('/portfolio-implementation') || isActive('/portfolio-advisor')) && "bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 shadow-lg"
                )}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Portfolio
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MainNavigation;
