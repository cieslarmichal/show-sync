import { useNavigate, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Heart, BrainCircuit, PartyPopper, Users, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData, userDataInitialized } = useContext(AuthContext);

  useSEO({
    title: 'ShowSync - Stop Arguing About What to Watch',
    description:
      "End the endless scrolling and debate. Get personalized TV show recommendations that match your group's taste and watchlists. Factor in likes, dislikes, Want to Watch, and Not Interested to find shows everyone actually wants to watch.",
    keywords: [
      'tv show recommendations',
      'watch party',
      'group recommendations',
      'smart suggestions',
      'show matching',
      'tv shows',
      'watch together',
      'streaming recommendations',
      'what to watch',
      'watchlist',
      'your next show',
      'personalized recommendations',
      'group watchlists',
      'like and dislike',
      'want to watch',
      'series suggestions',
      'binge-worthy shows',
      'tv series',
      'streaming services',
      'show picker',
      'entertainment choices',
      'tv guide',
      'watchroom',
      'tv show finder',
    ],
  });

  // Show loading state while checking authentication
  if (!userDataInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (userData) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="animate-fade-in space-y-24 sm:space-y-32">
            {/* Hero Section */}
            <div className="text-center pt-8 sm:pt-12">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1] max-w-4xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {t('home.hero.title')}{' '}
                <span className="text-primary inline-block">{t('home.hero.titleHighlight')}</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8 text-sm px-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{t('home.hero.badge1')}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{t('home.hero.badge2')}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{t('home.hero.badge3')}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 mt-10">
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] w-full sm:w-auto text-base font-semibold px-8 h-12"
                >
                  {t('home.hero.cta')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="border-border hover:bg-accent w-full sm:w-auto text-base h-12"
                >
                  {t('home.hero.signIn')}
                </Button>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  {t('home.howItWorks.title')}
                </h2>
                <p className="text-lg text-muted-foreground">{t('home.howItWorks.subtitle')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-center">
                <div className="space-y-4 group">
                  <div className="flex justify-center">
                    <div className="p-5 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t('home.howItWorks.step1Title')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t('home.howItWorks.step1Desc')}</p>
                </div>
                <div className="space-y-4 group">
                  <div className="flex justify-center">
                    <div className="p-5 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t('home.howItWorks.step2Title')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t('home.howItWorks.step2Desc')}</p>
                </div>
                <div className="space-y-4 group">
                  <div className="flex justify-center">
                    <div className="p-5 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <PartyPopper className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t('home.howItWorks.step3Title')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t('home.howItWorks.step3Desc')}</p>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  {t('home.features.title')}
                </h2>
                <p className="text-lg text-muted-foreground">{t('home.features.subtitle')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <Card className="p-8 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <BrainCircuit className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{t('home.features.smartTitle')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.smartDesc')}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-8 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{t('home.features.groupsTitle')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.groupsDesc')}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-8 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{t('home.features.timeTitle')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.timeDesc')}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-8 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t('home.features.noCompromiseTitle')}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.noCompromiseDesc')}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center py-16 px-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">{t('home.cta.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('home.cta.description')}
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] text-base font-semibold px-8 h-12"
              >
                {t('home.cta.button')}
              </Button>
              <p className="text-sm text-muted-foreground mt-6">{t('home.cta.noCreditCard')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
