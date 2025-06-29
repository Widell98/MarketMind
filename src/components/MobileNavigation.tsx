
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, TrendingUp, Heart, Brain, Briefcase, Target, Menu, X, Users, MessageCircle, Home, Settings } from 'lucide-react';
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
      {/* Mobile menu trigger button - fixed position for better visibility */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
          className={cn(
            "p-2 h-10 w-10 rounded-full transition-all duration-200",
            "bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg border border-gray-200/80 dark:border-gray-700/80",
            "hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:scale-105",
            "active:scale-95",
            isOpen && "bg-gray-100 dark:bg-gray-700 scale-95"
          )}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          ) : (
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          )}
        </Button>
      </div>

      {/* Mobile dropdown menu - improved positioning and styling */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 z-50 rounded-b-3xl shadow-2xl border-b border-gray-200 dark:border-gray-700 overflow-hidden max-h-screen">
            {/* Header with proper spacing for close button */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-6 pt-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <Link 
                to="/" 
                className="text-xl font-bold text-finance-navy dark:text-gray-200 flex items-center"
                onClick={handleLinkClick}
              >
                <span className="mr-3 text-2xl">🧠</span>
                <div>
                  <div>Market Mind</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-normal">AI-Powered Insights</div>
                </div>
              </Link>
            </div>

            {/* Navigation Content - scrollable */}
            <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] pb-8">
              {/* Community Section */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                  <Users className="w-4 h-4" />
                  Community
                </div>
                <div className="space-y-2">
                  {communityItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-700/50 active:scale-95",
                        isActive(item.url) 
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold shadow-sm" 
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
                  <div className="space-y-2">
                    <Link
                      to="/portfolio-implementation"
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-700/50 active:scale-95",
                        (isActive('/portfolio-implementation') || isActive('/portfolio-advisor'))
                          ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold shadow-sm" 
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <Brain className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">AI Portfolio Hub</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Intelligenta investeringsinsikter</div>
                      </div>
                      {(isActive('/portfolio-implementation') || isActive('/portfolio-advisor')) && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </Link>
                  </div>
                </div>
              )}

              {/* Settings Section for authenticated users */}
              {user && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                    <Settings className="w-4 h-4" />
                    Inställningar
                  </div>
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-700/50 active:scale-95",
                        isActive('/profile')
                          ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold shadow-sm" 
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <Settings className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">Profil</span>
                      {isActive('/profile') && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </Link>
                  </div>
                </div>
              )}

              {/* Auth Section for non-authenticated users */}
              {!user && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button asChild className="w-full py-3 rounded-xl font-semibold text-base">
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
