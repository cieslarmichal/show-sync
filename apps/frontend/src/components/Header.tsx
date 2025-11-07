import { HeaderLogo } from './header/HeaderLogo';
import { DesktopNavigation } from './header/DesktopNavigation';
import { DesktopAuthSection } from './header/DesktopAuthSection';
import { MobileMenu } from './header/MobileMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm backdrop-blur-sm">
      <div className="relative flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 py-3">
        <HeaderLogo />
        <DesktopNavigation />
        <div className="hidden md:flex shrink-0 items-center ml-auto">
          <DesktopAuthSection />
        </div>
        <MobileMenu />
      </div>
    </header>
  );
}
