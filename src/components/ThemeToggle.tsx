
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
      />
      <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    </div>
  );
};

export default ThemeToggle;
