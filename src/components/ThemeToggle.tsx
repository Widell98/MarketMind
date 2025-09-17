
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const ThemeToggle = () => {
  const { theme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleButtonClick = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div className="flex items-center">
        <div className="hidden sm:block h-8 w-16 animate-pulse rounded-full bg-muted/60" />
        <div className="sm:hidden h-10 w-10 animate-pulse rounded-full bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-2 py-1 shadow-sm backdrop-blur-sm">
        <Sun
          className={`h-4 w-4 transition-colors ${
            isDark ? 'text-muted-foreground/70' : 'text-amber-500'
          }`}
        />
        <Switch
          aria-label="Växla mörkt läge"
          checked={isDark}
          onCheckedChange={handleToggle}
          className="h-7 w-12 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/70"
        />
        <Moon
          className={`h-4 w-4 transition-colors ${
            isDark ? 'text-blue-400' : 'text-muted-foreground/70'
          }`}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={isDark ? 'Aktivera ljust läge' : 'Aktivera mörkt läge'}
        onClick={handleButtonClick}
        className="sm:hidden h-10 w-10 rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-amber-400" />
        ) : (
          <Moon className="h-5 w-5 text-blue-500" />
        )}
      </Button>
    </div>
  );
};

export default ThemeToggle;
