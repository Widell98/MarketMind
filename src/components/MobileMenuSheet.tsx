import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  MessageSquare,
  BarChart3,
  Menu,
  User,
  LogOut,
  TrendingUp // Ny import för Marknader-ikonen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

const MobileMenuSheet = () => {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  
  const navigation = [
    { name: 'Hem', href: '/', icon: Home },
    // Ny länk till Marknader
    { name: 'Marknader', href: '/predictions', icon: TrendingUp },
    { name: 'AI-Assistent', href: '/ai-chatt', icon: MessageSquare },
    { name: 'Min Portfölj', href: '/portfolio-implementation', icon: BarChart3 },
  ];

  const userMenuItems = [
    { name: 'Profil', href: '/profile', icon: User },
    ...(isAdmin ? [{ name: 'Admin Dashboard', href: '/admin/stock-cases', icon: BarChart3 }] : []),
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (href: string) => {
    return location.pathname === href || 
      (href !== '/' && location.pathname.startsWith(href));
  };

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        
        {/* Uppdaterad className med din design + justerad bredd (w-[85vw] max-w-[300px]) */}
        <SheetContent 
          side="left" 
          className="fixed z-50 gap-4 bg-background p-6 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-y-0 left-0 h-full data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm w-[85vw] max-w-[300px] px-0 border-r bg-gradient-to-b from-background via-background to-muted/30 shadow-xl"
        >
          <SheetHeader className="px-6 pb-4 border-b border-border/40">
            <SheetTitle className="text-left flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              Market Mind
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            {/* Main Navigation */}
            <nav className="flex-1 px-4 py-6">
              <div className="space-y-2">
                <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Navigation
                </h3>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* User Menu - only if logged in */}
              {user && (
                <div className="mt-8 space-y-2">
                  <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Konto
                  </h3>
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </nav>

            {/* User Info & Sign Out */}
            {user && (
              <div className="px-4 py-6 border-t border-border/40">
                <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium border border-primary/20">
                    {user.email?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.user_metadata?.full_name || 'Användare'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleSignOut}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                >
                  <LogOut className="w-4 h-4" />
                  Logga ut
                </Button>
              </div>
            )}

            {/* Sign In Button - only if not logged in */}
            {!user && (
              <div className="px-4 py-6 border-t border-border/40">
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link to="/auth">Logga in</Link>
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileMenuSheet;
