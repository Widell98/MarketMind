
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';
import MainNavigation from './MainNavigation';
import MobileNavigation from './MobileNavigation';
import BreadcrumbNavigation from './Breadcrumb';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
      <MobileNavigation />
      
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm">
        <div className="container-responsive py-3 lg:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4 md:space-x-8">
            {/* Mobile spacing for menu button */}
            <div className="md:hidden w-12"></div>
            
            <Link to="/" className="text-lg sm:text-xl lg:text-2xl font-bold text-finance-navy dark:text-gray-200 flex items-center">
              <span className="mr-2 text-xl lg:text-2xl">🧠</span>
              <span className="hidden sm:inline">Market Mind</span>
              <span className="sm:hidden">MM</span>
            </Link>
            
            {/* Desktop navigation - hidden on mobile */}
            <div className="hidden md:block">
              <MainNavigation />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
            {/* Show ThemeToggle on mobile, hide on larger screens */}
            <div className="md:hidden">
              <ThemeToggle />
            </div>
            {user ? (
              <ProfileMenu />
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="lg:px-6 lg:py-2 text-xs sm:text-sm"
                asChild
              >
                <Link to="/auth">
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container-responsive py-4 sm:py-6 pb-20 md:pb-6">
        <BreadcrumbNavigation />
        {children}
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 sm:py-6 mt-auto mb-16 md:mb-0">
        <div className="container-responsive text-center text-xs sm:text-sm lg:text-base text-finance-gray dark:text-gray-400">
          © {new Date().getFullYear()} Market Mind. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
