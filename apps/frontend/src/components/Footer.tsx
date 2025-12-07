import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Mail, MapPin, Heart, Tv, User, Github, Users, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const { userData } = useContext(AuthContext);
  const { effectiveTheme } = useTheme();

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border bg-muted/30 py-8 sm:py-16 mt-auto"
      aria-label="Site footer"
    >
      {/* Mobile: Compact Footer */}
      <div className="sm:hidden max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            aria-label="ShowSync home"
          >
            <img
              src={effectiveTheme === 'dark' ? '/logo-white.svg' : '/logo.svg'}
              alt=""
              className="h-7 w-7 transition-transform group-hover:scale-110 duration-200"
              aria-hidden="true"
            />
            <h2 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">ShowSync</h2>
          </Link>
          <a
            href="mailto:contact@show-sync.com"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            contact@show-sync.com
          </a>
        </div>
      </div>

      {/* Desktop: Full Footer */}
      <div className="hidden sm:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-20">
          {/* Brand Section */}
          <div className="space-y-5">
            <Link
              to="/"
              className="flex items-center gap-3 group w-fit"
              aria-label="ShowSync home"
            >
              <img
                src={effectiveTheme === 'dark' ? '/logo-white.svg' : '/logo.svg'}
                alt=""
                className="h-9 w-9 transition-transform group-hover:scale-110 duration-200"
                aria-hidden="true"
              />
              <h2 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">ShowSync</h2>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t('footer.tagline')}</p>
          </div>

          {/* Navigation Section */}
          {userData && (
            <nav
              className="lg:mx-auto"
              aria-label="Footer navigation"
            >
              <h3 className="text-sm font-bold mb-5 text-foreground tracking-tight uppercase">
                {t('footer.navigation')}
              </h3>
              <ul className="space-y-3.5 text-sm">
                <li>
                  <Link
                    to="/series"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all group -ml-2 pl-2 pr-4 py-1.5 rounded-md hover:bg-accent/50"
                  >
                    <Tv
                      className="h-[18px] w-[18px] group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <span>{t('nav.tvShows')}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/watchlist"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all group -ml-2 pl-2 pr-4 py-1.5 rounded-md hover:bg-accent/50"
                  >
                    <Bookmark
                      className="h-[18px] w-[18px] group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <span>{t('nav.watchlist')}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/watchrooms"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all group -ml-2 pl-2 pr-4 py-1.5 rounded-md hover:bg-accent/50"
                  >
                    <Users
                      className="h-[18px] w-[18px] group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <span>{t('nav.watchRooms')}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-profile"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all group -ml-2 pl-2 pr-4 py-1.5 rounded-md hover:bg-accent/50"
                  >
                    <User
                      className="h-[18px] w-[18px] group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <span>{t('nav.profile')}</span>
                  </Link>
                </li>
              </ul>
            </nav>
          )}

          {/* Contact Section */}
          <div className={userData ? 'col-span-2 lg:col-span-1 lg:ml-auto' : 'col-start-2 lg:col-start-3 lg:ml-auto'}>
            <h3 className="text-sm font-bold mb-5 text-foreground tracking-tight uppercase">{t('footer.contact')}</h3>
            <address className="space-y-3.5 text-sm not-italic">
              <div className="flex items-start gap-3 text-muted-foreground group">
                <Mail
                  className="h-[18px] w-[18px] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <a
                  href="mailto:contact@show-sync.com"
                  className="hover:text-foreground transition-colors hover:underline underline-offset-4 break-all"
                >
                  {t('footer.contactEmail')}
                </a>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground group">
                <MapPin
                  className="h-[18px] w-[18px] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <a
                  href="https://maps.google.com/?q=Cracow,Poland"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors hover:underline underline-offset-4"
                >
                  {t('footer.location')}
                </a>
              </div>
            </address>
          </div>
        </div>
      </div>

      {/* TMDB Attribution */}
      <div className="border-t border-border mt-8 sm:mt-12 pt-6 sm:pt-8 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">{t('footer.poweredBy')}</span>
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="The Movie Database"
            >
              <img
                src="/tmdb-logo.svg"
                alt="TMDB"
                className="h-4 sm:h-5"
              />
            </a>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground max-w-md leading-relaxed">
            {t('footer.tmdbDisclaimer')}
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1.5 text-center sm:text-left">
            <span className="whitespace-nowrap font-medium">© {currentYear} ShowSync.</span>
            <span className="inline-flex items-center gap-1.5">
              <span>{t('footer.madeWith')}</span>
              <Heart
                className="h-3.5 w-3.5 inline fill-current text-red-500 animate-pulse"
                aria-label="love"
              />
              <span>{t('footer.by')}</span>
            </span>
            <a
              href="https://github.com/cieslarmichal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-semibold group whitespace-nowrap hover:underline underline-offset-4"
            >
              <Github
                className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform"
                aria-hidden="true"
              />
              <span>Michał Cieślar</span>
            </a>
          </div>
          <div className="text-center sm:text-right">
            <span className="whitespace-nowrap">{t('footer.rights')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
