import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { MobileAuthSection } from './MobileAuthSection';
import { MobileNavigation } from './MobileNavigation';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center gap-2">
        <MobileAuthSection />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background absolute top-full left-0 right-0 shadow-lg">
          <MobileNavigation onItemClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
