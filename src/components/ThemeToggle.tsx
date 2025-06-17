
import React from 'react';
import { Moon, Sun, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const isDark = theme === 'dark';

  const handleToggle = (checked: boolean) => {
    if (checked && !user) {
      // User trying to enable dark mode without being logged in
      toast({
        title: "Account Required",
        description: "Please create an account to access dark mode",
        variant: "destructive",
      });
      return;
    }
    
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4 text-yellow-500" />
      <div className="relative">
        <Switch
          checked={isDark}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-blue-600"
          disabled={!user && !isDark} // Only disable when trying to switch to dark without auth
        />
        {!user && (
          <Lock className="absolute -top-1 -right-1 h-3 w-3 text-gray-400" />
        )}
      </div>
      <Moon className="h-4 w-4 text-blue-600" />
    </div>
  );
};

export default ThemeToggle;
