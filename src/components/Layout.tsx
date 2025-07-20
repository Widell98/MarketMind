
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ContextualAISuggestions from '@/components/ContextualAISuggestions';
import IntelligentRouting from '@/components/IntelligentRouting';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/10">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            {/* AI Context Suggestions - Only show when user is logged in */}
            {user && (
              <div className="border-b bg-gradient-to-r from-background to-muted/5 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-2">
                  <ContextualAISuggestions />
                </div>
              </div>
            )}
            
            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl space-y-6">
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
        
        {/* Intelligent Routing Component */}
        <IntelligentRouting />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
