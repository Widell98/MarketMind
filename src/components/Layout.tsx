import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import ProfileMenu from './ProfileMenu';
import BreadcrumbNavigation from './Breadcrumb';
// import AIFloatingWidget from './AIFloatingWidget';
import MobileNavigation from './MobileNavigation';
import AppSidebar from './AppSidebar';
import ThemeToggle from './ThemeToggle';
import { ConversationMemoryProvider } from './AIConversationMemory';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Brain } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/ai-chat') || location.pathname.startsWith('/ai-chatt');

  // Chatten ska ha h-screen (låst till fönstrets höjd), övriga sidor min-h-screen
  const rootClassName = isChatRoute
    ? 'h-screen w-full flex overflow-hidden bg-white dark:bg-background'
    : 'min-h-screen bg-background w-full flex overflow-hidden';

  const mainClassName = isChatRoute
    ? 'flex-1 w-full min-h-0 max-w-full flex flex-col overflow-hidden'
    : 'flex-1 container-responsive py-2 sm:py-3 lg:py-4 min-h-0 max-w-full overflow-y-scroll';

  const breadcrumbWrapperClassName = 'mb-2 sm:mb-4';

  const contentWrapperClassName = isChatRoute
    ? 'flex-1 flex w-full flex-col min-h-0'
    : 'max-w-full overflow-hidden px-1 sm:px-0';

  // ÄNDRING: Visa alltid Header, men dölj Footer/Breadcrumb i chatten
  const showHeader = true; 
  const showFooter = !isChatRoute;
  const showBreadcrumb = !isChatRoute;

  return (
    <ConversationMemoryProvider>
      <SidebarProvider>
        <div className={rootClassName}>
          {/* Global Sidebar */}
          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0 max-w-full">
            
            {/* Header - Nu alltid synlig */}
            {showHeader && (
              <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
                <div className="container-responsive py-2 sm:py-3 lg:py-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 min-w-0">
                    <SidebarTrigger className="hidden md:flex flex-shrink-0" />
                    <MobileNavigation />
                    
                    <Link to="/" className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center min-w-0 flex-shrink-0">
                      <div className="mr-2 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300 flex-shrink-0">
                        <Brain className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary-foreground" />
                      </div>
                      <span className="hidden sm:inline bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent truncate">Market Mind</span>
                      <span className="sm:hidden bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">MM</span>
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-shrink-0">
                    <ThemeToggle />
                    {user ? (
                      <ProfileMenu />
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-shrink-0"
                        asChild
                      >
                        <Link to="/auth">
                          <span className="hidden sm:inline">{t('nav.login')}</span>
                          <span className="sm:hidden">{t('nav.login')}</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </header>
            )}
            
            {/* Main content */}
            <main className={mainClassName} style={{ scrollbarGutter: 'stable' }}>
              {showBreadcrumb && (
                <div className={breadcrumbWrapperClassName}>
                  <BreadcrumbNavigation />
                </div>
              )}
              <div className={contentWrapperClassName}>
                {children}
              </div>
            </main>
            
            {/* Footer */}
            {showFooter && (
              <footer className="bg-card border-t border-border py-4 sm:py-6 lg:py-8 mt-auto flex-shrink-0">
                <div className="container-responsive text-center sm:text-left text-xs sm:text-sm lg:text-base text-muted-foreground flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex flex-col items-center sm:items-start gap-2">
                    <span>© {new Date().getFullYear()} Market Mind. {t('footer.copyright')}</span>
                    <p className="max-w-2xl leading-relaxed">{t('footer.disclaimer')}</p>
                  </div>
                  <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                    <Link to="/terms" className="hover:text-foreground transition-colors">
                      {t('footer.terms')}
                    </Link>
                    <Link to="/privacy" className="hover:text-foreground transition-colors">
                      {t('footer.privacy')}
                    </Link>
                  </nav>
                </div>
              </footer>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ConversationMemoryProvider>
  );
};

export default Layout;
