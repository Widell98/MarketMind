
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
          <NavigationMenuTrigger className="h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
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
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      isActive('/') && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="text-sm font-medium leading-none flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Community Feed
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Se de senaste insikterna från personer du följer
                    </p>
                  </Link>
                </NavigationMenuLink>
              )}
              <NavigationMenuLink asChild>
                <Link
                  to="/stock-cases"
                  className={cn(
                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    isActive('/stock-cases') && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Browse Cases
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Explore curated investment opportunities
                  </p>
                </Link>
              </NavigationMenuLink>
              {user && (
                <NavigationMenuLink asChild>
                  <Link
                    to="/watchlist"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      isActive('/watchlist') && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="text-sm font-medium leading-none flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Watchlist
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Track your followed stock cases
                    </p>
                  </Link>
                </NavigationMenuLink>
              )}
              <NavigationMenuLink asChild>
                <Link
                  to="/learning"
                  className={cn(
                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    isActive('/learning') && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="text-sm font-medium leading-none flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Learning Center
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
                  "h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 inline-flex items-center rounded-md",
                  (isActive('/portfolio-implementation') || isActive('/portfolio-advisor')) && "bg-accent text-accent-foreground"
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
