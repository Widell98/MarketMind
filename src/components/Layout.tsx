
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-responsive py-3 lg:py-4 xl:py-5 flex justify-between items-center">
          <Link to="/" className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-finance-navy dark:text-gray-200 flex items-center">
            <span className="mr-2 text-xl lg:text-2xl xl:text-3xl">📈</span>
            <span className="hidden sm:inline">Market Mentor</span>
            <span className="sm:hidden">MM</span>
          </Link>
          
          <div className="flex items-center space-x-3 lg:space-x-4 xl:space-x-6">
            <ThemeToggle />
            {user ? (
              <ProfileMenu />
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="lg:px-6 lg:py-2 xl:px-8 xl:py-3"
                asChild
              >
                <Link to="/auth">
                  <span className="hidden sm:inline">Logga in</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container-responsive py-4 sm:py-6 lg:py-8 xl:py-10 2xl:py-12">
        <div className="text-content-desktop">
          {children}
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 sm:py-6 lg:py-8 xl:py-10 mt-auto">
        <div className="container-responsive text-center text-xs sm:text-sm lg:text-base text-finance-gray dark:text-gray-400">
          © {new Date().getFullYear()} Market Mentor. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
