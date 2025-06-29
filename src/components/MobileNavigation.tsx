
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
      {/* Mobile menu trigger button - space theme */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
          className={cn(
            "p-2 h-10 w-10 rounded-full transition-all duration-200",
            "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50",
            "hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl",
            isOpen && "bg-slate-100 dark:bg-slate-700"
          )}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          ) : (
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay - space theme */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu - space theme */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-900 z-50",
        "transform transition-transform duration-300 ease-out shadow-2xl",
        "border-r border-slate-200 dark:border-slate-700",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header with gradient */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-6 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-slate-900">
          <Link 
            to="/" 
            className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center"
            onClick={handleLinkClick}
          >
            <span className="mr-3 text-2xl">🧠</span>
            <div>
              <div>Market Mind</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-normal">AI-Powered Insights</div>
            </div>
          </Link>
        </div>

        {/* Navigation Content */}
        <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
          {/* Community Section */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 px-2">
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
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                    "hover:bg-blue-50 dark:hover:bg-slate-800/50",
                    isActive(item.url) 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm" 
                      : "text-slate-700 dark:text-slate-300"
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

          {/* AI Portfolio Section */}
          {user && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 px-2">
                <Brain className="w-4 h-4" />
                AI Portfolio
              </div>
              <div className="space-y-1">
                <Link
                  to="/portfolio-advisor"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200",
                    "hover:bg-blue-50 dark:hover:bg-slate-800/50",
                    isActive('/portfolio-advisor') 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm" 
                      : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  <Brain className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">Portfolio Advisor</span>
                  {isActive('/portfolio-advisor') && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </Link>
              </div>
            </div>
          )}

          {/* Auth Section */}
          {!user && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button asChild className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700">
                <Link to="/auth" onClick={handleLinkClick}>
                  Logga in / Registrera
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar - space theme */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-30">
        <div className="flex items-center justify-around py-2 px-4">
          {communityItems.slice(0, 4).map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
                isActive(item.url)
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.title === "Browse Cases" ? "Cases" : item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
