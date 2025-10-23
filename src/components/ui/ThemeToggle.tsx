/**
 * Red Bull Racing - Theme Toggle Button
 * Professional implementation with next-themes
 */

'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-rbr-red/10 transition-colors"
          aria-label="Seleziona tema"
        >
          {theme === 'light' ? (
            <Sun className="h-5 w-5 text-yellow-500 transition-all" />
          ) : theme === 'dark' ? (
            <Moon className="h-5 w-5 text-rbr-navy-primary transition-all" />
          ) : (
            <Laptop className="h-5 w-5 text-rbr-accent-blue transition-all" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-rbr-dark-elevated border-rbr-border">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer hover:bg-rbr-red/10"
        >
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="text-rbr-text-primary">Chiaro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer hover:bg-rbr-red/10"
        >
          <Moon className="mr-2 h-4 w-4 text-rbr-navy-primary" />
          <span className="text-rbr-text-primary">Scuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer hover:bg-rbr-red/10"
        >
          <Laptop className="mr-2 h-4 w-4 text-rbr-accent-blue" />
          <span className="text-rbr-text-primary">Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

