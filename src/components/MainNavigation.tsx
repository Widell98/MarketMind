
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
          <NavigationMenuTrigger className="h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:focus:bg-gray-700">
            <Users className="w-4 h-4 mr-2" />
            Community
          </NavigationMenuTrigger>
          <NavigationMenuContent className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="grid gap-3 p-6 w-[400px]">
              {user && (
                <NavigationMenuLink asChild>
                  <Link
                    to="/"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground dark:hover:bg-gray-700 dark:focus:bg-gray-700",
                      isActive('/') && "bg-accent text-accent-foreground dark:bg-gray-700"
                    )}
                  >
                    <div className="text-sm font-medium leading-none flex items-center dark:text-white">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Community Feed
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground dark:text-gray-400">
                      Se de senaste insikterna från personer du följer
                    </p>
                  </Link>
                </NavigationMenuLink>
              )}
              <NavigationMenuLink asChild>
                <Link
                  to="/stock-cases"
                  className={cn(
                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground dark:hover:bg-gray-700 dark:focus:bg-gray-700",
                    isActive('/stock-cases') && "bg-accent text-accent-foreground dark:bg-gray-700"
                  )}
                >
                  <div className="text-sm font-medium leading-none flex items-center dark:text-white">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Browse Cases
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground dark:text-gray-400">
                    Explore curated investment opportunities
                  </p>
                </Link>
              </NavigationMenuLink>
              {user && (
                <NavigationMenuLink asChild>
                  <Link
                    to="/watchlist"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground dark:hover:bg-gray-700 dark:focus:bg-gray-700",
                      isActive('/watchlist') && "bg-accent text-accent-foreground dark:bg-gray-700"
                    )}
                  >
                    <div className="text-sm font-medium leading-none flex items-center dark:text-white">
                      <Heart className="w-4 h-4 mr-2" />
                      Watchlist
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground dark:text-gray-400">
                      Track your followed stock cases
                    </p>
                  </Link>
                </NavigationMenuLink>
              )}
              <NavigationMenuLink asChild>
                <Link
                  to="/learning"
                  className={cn(
                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground dark:hover:bg-gray-700 dark:focus:bg-gray-700",
                    isActive('/learning') && "bg-accent text-accent-foreground dark:bg-gray-700"
                  )}
                >
                  <div className="text-sm font-medium leading-none flex items-center dark:text-white">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Learning Center
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground dark:text-gray-400">
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
                  "h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 inline-flex items-center rounded-md dark:hover:bg-gray-700 dark:focus:bg-gray-700",
                  (isActive('/portfolio-implementation') || isActive('/portfolio-advisor')) && "bg-accent text-accent-foreground dark:bg-gray-700"
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
