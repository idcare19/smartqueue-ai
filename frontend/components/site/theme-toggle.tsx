'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/site/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="secondary" onClick={toggleTheme}>
      {theme === 'dark' ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </Button>
  );
}

