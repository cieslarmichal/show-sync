import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { MobileAuthSection } from './MobileAuthSection';
import { MobileNavigation } from './MobileNavigation';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
        <LanguageToggle />
        <ThemeToggle />
        <MobileAuthSection />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0 active:scale-95 transition-transform"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background absolute top-full left-0 right-0 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <MobileNavigation onItemClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
