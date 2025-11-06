import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Mail, Phone, MapPin, Heart, Tv, User } from 'lucide-react';

export default function Footer() {
  const { userData } = useContext(AuthContext);

  return (
    <footer
      className="border-t border-border bg-background py-12 mt-auto"
      aria-label="Footer"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          <div>
            <Link
              to="/"
              className="flex items-center gap-3 mb-4 group"
            >
              <img
                src="/logo.svg"
                alt="ShowSync Logo"
                className="h-8 w-8 transition-transform group-hover:scale-105"
              />
              <h2 className="text-lg font-semibold tracking-tight">ShowSync</h2>
            </Link>
            <p className="text-sm text-muted-foreground">
              Find the perfect series for your group. Get personalized recommendations based on everyone's tastes.
            </p>
          </div>

          {/* Navigation Section */}
          {userData && (
            <div className="md:mx-auto">
              <h3 className="text-sm font-semibold mb-4 text-foreground tracking-tight">Your Account</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <Link
                    to="/series"
                    className="hover:text-foreground transition-colors"
                  >
                    Series
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Tv className="h-4 w-4" />
                  <Link
                    to="/watchrooms"
                    className="hover:text-foreground transition-colors"
                  >
                    Watch Rooms
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <Link
                    to="/my-profile"
                    className="hover:text-foreground transition-colors"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className={userData ? 'md:ml-auto' : 'md:col-start-3 md:ml-auto'}>
            <h3 className="text-sm font-semibold mb-4 text-foreground tracking-tight">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:contact@showsync.com"
                  className="hover:text-foreground transition-colors"
                >
                  contact@showsync.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a
                  href="tel:+48792448282"
                  className="hover:text-foreground transition-colors"
                >
                  +48 792 448 282
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <a
                  href="https://maps.google.com/?q=Cracow, Poland"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Cracow, Poland
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border mt-10 pt-6 text-center max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap items-baseline justify-center gap-x-1 gap-y-1 text-muted-foreground text-xs">
          <span>© 2025 ShowSync. Made with</span>
          <Heart className="h-3 w-3 inline fill-current" />
          <span>by</span>
          <a
            href="https://github.com/cieslarmichal"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors font-medium"
            aria-label="Michał Cieślar on GitHub"
          >
            Michał Cieślar
          </a>
        </div>
      </div>
    </footer>
  );
}
