
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, TrendingUp, Heart, Brain, Briefcase, Target, Menu, X, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MobileNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const communityItems = [
    ...(user ? [{ title: "Community Feed", url: "/", icon: MessageCircle }] : []),
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
      {/* Mobile menu trigger button */}
      <div className="md:hidden fixed top-3 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
          className="p-2"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <Link 
            to="/" 
            className="text-xl font-bold text-finance-navy dark:text-gray-200 flex items-center"
            onClick={handleLinkClick}
          >
            <span className="mr-2 text-xl">🧠</span>
            Market Mind
          </Link>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.url) 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {user && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Brain className="w-4 h-4" />
                AI Portfolio
              </div>
              <div className="space-y-1">
                <Link
                  to="/portfolio-advisor"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive('/portfolio-advisor') 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Brain className="w-4 h-4" />
                  Portfolio Advisor
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
