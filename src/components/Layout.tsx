
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
    <div className="min-h-screen bg-gradient-to-br from-[#EEEEEE] via-slate-50 to-[#EEEEEE] dark:from-[#222831] dark:via-[#393E46] dark:to-[#222831] w-full">
      <MobileNavigation />
      
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#222831]/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-[#393E46]/50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl py-3 lg:py-4 xl:py-5 flex justify-between items-center">
          <div className="flex items-center space-x-4 md:space-x-8 lg:space-x-12">
            {/* Mobile spacing for menu button */}
            <div className="md:hidden w-12"></div>
            
            <Link to="/" className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#222831] dark:text-[#EEEEEE] flex items-center hover:text-blue-500 transition-colors duration-300">
              <span className="mr-2 lg:mr-3 text-2xl lg:text-3xl xl:text-4xl">🧠</span>
              <span className="hidden sm:inline bg-gradient-to-r from-[#222831] to-blue-600 dark:from-[#EEEEEE] dark:to-blue-500 bg-clip-text text-transparent">Market Mind</span>
              <span className="sm:hidden bg-gradient-to-r from-[#222831] to-blue-600 dark:from-[#EEEEEE] dark:to-blue-500 bg-clip-text text-transparent">MM</span>
            </Link>
            
            {/* Desktop navigation - hidden on mobile */}
            <div className="hidden md:block">
              <MainNavigation />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-6">
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
                className="lg:px-8 lg:py-3 xl:px-10 xl:py-4 text-xs sm:text-sm lg:text-base xl:text-lg font-medium bg-white/80 dark:bg-[#393E46]/80 backdrop-blur-sm border border-blue-500/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-blue-500/10 dark:hover:bg-blue-500/20 text-[#222831] dark:text-[#EEEEEE] hover:border-blue-500"
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
      
      <footer className="bg-white/80 dark:bg-[#222831]/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-[#393E46]/50 py-6 lg:py-8 xl:py-10 mt-auto mb-16 md:mb-0 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl text-center text-sm lg:text-base xl:text-lg text-[#393E46] dark:text-[#EEEEEE]/80">
          © {new Date().getFullYear()} Market Mind. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
