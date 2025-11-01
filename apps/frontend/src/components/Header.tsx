import { HeaderLogo } from './Header/HeaderLogo';
import { DesktopNavigation } from './Header/DesktopNavigation';
import { DesktopAuthSection } from './Header/DesktopAuthSection';
import { MobileMenu } from './Header/MobileMenu';

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
