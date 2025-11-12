import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Mail, Phone, MapPin, Heart, Tv, User, Github, Users } from 'lucide-react';

export default function Footer() {
  const { userData } = useContext(AuthContext);

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border bg-background py-12 mt-auto"
      aria-label="Site footer"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center gap-3 group w-fit"
              aria-label="ShowSync home"
            >
              <img
                src="/logo.svg"
                alt=""
                className="h-8 w-8 transition-transform group-hover:scale-110 duration-200"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                ShowSync
              </h2>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover TV shows everyone will love. Smart recommendations powered by what your group actually watches.
            </p>
          </div>

          {/* Navigation Section */}
          {userData && (
            <nav
              className="md:mx-auto"
              aria-label="Footer navigation"
            >
              <h3 className="text-sm font-semibold mb-4 text-foreground tracking-tight">Your Account</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/series"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Tv
                      className="h-4 w-4 group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <span>TV Shows</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/watchrooms"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Users
                      className="h-4 w-4 group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <span>Watch Rooms</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-profile"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <User
                      className="h-4 w-4 group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <span>Profile</span>
                  </Link>
                </li>
              </ul>
            </nav>
          )}

          {/* Contact Section */}
          <div className={userData ? 'md:ml-auto' : 'md:col-start-3 md:ml-auto'}>
            <h3 className="text-sm font-semibold mb-4 text-foreground tracking-tight">Contact</h3>
            <address className="space-y-3 text-sm not-italic">
              <div className="flex items-center gap-3 text-muted-foreground group">
                <Mail
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <a
                  href="mailto:contact@show-sync.com"
                  className="hover:text-foreground transition-colors hover:underline underline-offset-4"
                >
                  contact@show-sync.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground group">
                <Phone
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <a
                  href="tel:+48792448282"
                  className="hover:text-foreground transition-colors hover:underline underline-offset-4"
                >
                  +48 792 448 282
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground group">
                <MapPin
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <a
                  href="https://maps.google.com/?q=Cracow,Poland"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors hover:underline underline-offset-4"
                >
                  Cracow, Poland
                </a>
              </div>
            </address>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border mt-10 pt-6 max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-1.5 gap-y-1">
            <span>© {currentYear} ShowSync. Made with</span>
            <Heart
              className="h-3 w-3 inline fill-current text-red-500 animate-pulse"
              aria-label="love"
            />
            <span>by</span>
            <a
              href="https://github.com/cieslarmichal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium group"
            >
              <Github
                className="h-3 w-3 group-hover:rotate-12 transition-transform"
                aria-hidden="true"
              />
              <span>Michał Cieślar</span>
            </a>
          </div>
          <div className="text-center sm:text-right">
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
