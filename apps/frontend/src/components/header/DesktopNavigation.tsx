import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigationSections } from '../../hooks/useNavigationSections';
import { NavigationItem } from './NavigationItem';

export function DesktopNavigation() {
  const { userData } = useContext(AuthContext);
  const sections = useNavigationSections(userData);

  return (
    <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
      <div className="flex items-center space-x-6 lg:space-x-8">
        {sections.map((section) => (
          <NavigationItem
            key={section.href}
            section={section}
          />
        ))}
      </div>
    </nav>
  );
}
