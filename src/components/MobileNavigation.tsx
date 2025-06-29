
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, TrendingUp, Heart, Brain, Briefcase, Target, Menu, X, Users, MessageCircle, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const communityItems = [
    { title: "Hem", url: "/", icon: Home },
    { title: "Browse Cases", url: "/stock-cases", icon: TrendingUp },
    ...(user ? [{ title: "Watchlist", url: "/watchlist", icon: Heart }] : []),
    { title: "Learning Center", url: "/learning", icon: BookOpen },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu trigger button - only show on mobile screens */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
          className={cn(
            "p-2 h-10 w-10 rounded-full transition-all duration-200",
            "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50",
            "hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl",
            isOpen && "bg-gray-100 dark:bg-gray-700"
          )}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          ) : (
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          )}
        </Button>
      </div>

      {/* Mobile dropdown menu - only show on mobile screens */}
      {isOpen && (
        <>
          {/* Overlay - only on mobile */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu - only on mobile */}
          <div className="md:hidden fixed top-16 left-3 right-3 bg-white dark:bg-gray-800 z-50 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <Link 
                to="/" 
                className="text-lg font-bold text-finance-navy dark:text-gray-200 flex items-center"
                onClick={handleLinkClick}
              >
                <span className="mr-2 text-xl">🧠</span>
                <div>
                  <div>Market Mind</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-normal">AI-Powered Insights</div>
                </div>
              </Link>
            </div>

            {/* Navigation Content */}
            <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
              {/* Community Section */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                  <Users className="w-4 h-4" />
                  Community
                </div>
                <div className="space-y-1">
                  {communityItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-700/50",
                        isActive(item.url) 
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold" 
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {isActive(item.url) && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* AI Portfolio Section - Only for authenticated users */}
              {user && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                    <Brain className="w-4 h-4" />
                    AI Portfolio
                  </div>
                  <div className="space-y-1">
                    <Link
                      to="/portfolio-implementation"
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-700/50",
                        (isActive('/portfolio-implementation') || isActive('/portfolio-advisor'))
                          ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-semibold" 
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <Brain className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">AI Portfolio</span>
                      {(isActive('/portfolio-implementation') || isActive('/portfolio-advisor')) && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </Link>
                  </div>
                </div>
              )}

              {/* Auth Section for non-authenticated users */}
              {!user && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button asChild className="w-full py-2.5 rounded-xl font-semibold">
                    <Link to="/auth" onClick={handleLinkClick}>
                      Logga in / Registrera
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileNavigation;
