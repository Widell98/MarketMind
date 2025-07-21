
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ProfileMenu from './ProfileMenu';
import BreadcrumbNavigation from './Breadcrumb';
import AIFloatingWidget from './AIFloatingWidget';
import MobileNavigation from './MobileNavigation';
import AppSidebar from './AppSidebar';
import ContextualAISuggestions from './ContextualAISuggestions';
import { ConversationMemoryProvider } from './AIConversationMemory';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Brain } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <ConversationMemoryProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full flex">
          {/* Sidebar for desktop */}
          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-3 lg:py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4 md:space-x-6 lg:space-x-8">
                  {/* Sidebar trigger for desktop */}
                  <SidebarTrigger className="hidden md:flex" />
                  
                  <Link to="/" className="text-xl sm:text-2xl lg:text-3xl font-bold text-finance-navy dark:text-gray-200 flex items-center">
                    <div className="mr-2 lg:mr-3 w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                      <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <span className="hidden sm:inline bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Market Mind</span>
                    <span className="sm:hidden bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">MM</span>
                  </Link>
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                  {user ? (
                    <ProfileMenu />
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="lg:px-6 lg:py-2 text-xs sm:text-sm lg:text-base font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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
            
            {/* Main content */}
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-4 sm:py-6 lg:py-8">
              <BreadcrumbNavigation />
              {children}
            </main>
            
            {/* Footer */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 lg:py-8 mt-auto">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center text-sm lg:text-base text-finance-gray dark:text-gray-400">
                © {new Date().getFullYear()} Market Mind. All rights reserved.
              </div>
            </footer>
          </div>

          {/* AI Floating Widget - available on all pages */}
          <AIFloatingWidget />

          {/* Contextual AI Suggestions */}
          <ContextualAISuggestions />

          {/* Mobile navigation */}
          <MobileNavigation />
        </div>
      </SidebarProvider>
    </ConversationMemoryProvider>
  );
};

export default Layout;
