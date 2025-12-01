import { HeaderLogo } from './header/HeaderLogo';
import { DesktopNavigation } from './header/DesktopNavigation';
import { DesktopAuthSection } from './header/DesktopAuthSection';
import { MobileMenu } from './header/MobileMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 border-b border-border shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="relative flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 max-w-[1600px] mx-auto">
        <HeaderLogo />
        <DesktopNavigation />
        <div className="hidden md:flex shrink-0 items-center ml-auto gap-1">
          <DesktopAuthSection />
        </div>
        <MobileMenu />
      </div>
    </header>
  );
}
