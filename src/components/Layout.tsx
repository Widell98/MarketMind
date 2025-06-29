
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
      {/* Mobile Navigation - always rendered */}
      <MobileNavigation />
      
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl py-3 lg:py-4 xl:py-5 flex justify-between items-center">
          <div className="flex items-center space-x-4 md:space-x-8 lg:space-x-12">
            {/* Mobile spacing for menu button - only on mobile */}
            <div className="md:hidden w-12"></div>
            
            <Link to="/" className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-finance-navy dark:text-gray-200 flex items-center">
              <span className="mr-2 lg:mr-3 text-2xl lg:text-3xl xl:text-4xl">🧠</span>
              <span className="hidden sm:inline">Market Mind</span>
              <span className="sm:hidden">MM</span>
            </Link>
            
            {/* Desktop navigation - hidden on mobile */}
            <div className="hidden md:block">
              <MainNavigation />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-6">
            {/* Show ThemeToggle only on desktop */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {user ? (
              <ProfileMenu />
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="lg:px-8 lg:py-3 xl:px-10 xl:py-4 text-xs sm:text-sm lg:text-base xl:text-lg font-medium"
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
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl py-4 sm:py-6 lg:py-8 xl:py-10 pb-20 md:pb-6 lg:pb-8 xl:pb-10">
        <BreadcrumbNavigation />
        {children}
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 lg:py-8 xl:py-10 mt-auto mb-16 md:mb-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl text-center text-sm lg:text-base xl:text-lg text-finance-gray dark:text-gray-400">
          © {new Date().getFullYear()} Market Mind. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
