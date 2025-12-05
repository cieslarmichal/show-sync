import { useNavigate, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  Heart,
  BrainCircuit,
  PartyPopper,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  Star,
  ListChecks,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData, userDataInitialized } = useContext(AuthContext);

  useSEO('home');

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
                <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block">
                  {t('home.hero.titleHighlight')}
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 text-sm px-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{t('home.hero.badge2')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{t('home.hero.badge3')}</span>
                </div>
              </div>

              {/* Hero Visual Placeholder */}
              <div className="max-w-5xl mx-auto mb-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-linear-to-br from-primary/5 to-primary/10">
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <BrainCircuit className="h-16 w-16 text-primary mx-auto opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        [Hero Demo Image/GIF]
                        <br />
                        <span className="text-xs">Show app interface with recommendations</span>
                      </p>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-primary/20 rounded-full blur-2xl" />
                  <div className="absolute bottom-4 left-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
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

            {/* Social Proof - Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-border">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">
                  <Sparkles className="h-10 w-10 inline-block text-primary" />
                </div>
                <div className="text-sm text-muted-foreground mt-2">{t('home.socialProof.activeUsers')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">5,000+</div>
                <div className="text-sm text-muted-foreground mt-2">{t('home.socialProof.recommendations')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">95%</div>
                <div className="text-sm text-muted-foreground mt-2">{t('home.socialProof.accuracy')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">2 min</div>
                <div className="text-sm text-muted-foreground mt-2">{t('home.socialProof.setupTime')}</div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 py-8 opacity-60">
              <div className="text-xs text-muted-foreground font-medium">{t('home.trustBadges.poweredBy')}</div>
              <div className="text-sm font-semibold text-muted-foreground">OpenAI</div>
              <div className="w-px h-6 bg-border" />
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img
                  src="/tmdb-logo.svg"
                  alt="TMDB"
                  className="h-4"
                />
              </a>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">{t('home.trustBadges.secure')}</span>
              </div>
            </div>

            {/* Problem Statement */}
            <div className="text-center max-w-5xl mx-auto space-y-8 py-12">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                  {t('home.problemStatement.title')}
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t('home.problemStatement.subtitle')}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 text-left">
                <Card className="p-8 border-2 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">{t('home.problemStatement.solo')}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {t('home.problemStatement.soloDesc')}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-8 border-2 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">{t('home.problemStatement.groups')}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {t('home.problemStatement.groupsDesc')}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-8 border-2 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">{t('home.problemStatement.everyone')}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {t('home.problemStatement.everyoneDesc')}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Benefits Section - Individual vs Groups */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  {t('home.perfectForEveryone.title')}
                </h2>
                <p className="text-muted-foreground">{t('home.perfectForEveryone.subtitle')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {/* For You Card */}
                <Card className="p-8 border-2 border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-300 bg-linear-to-br from-primary/5 to-transparent">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        <Star className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{t('home.benefits.forYouTitle')}</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{t('home.benefits.forYouBenefit1')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{t('home.benefits.forYouBenefit2')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{t('home.benefits.forYouBenefit3')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{t('home.benefits.forYouBenefit4')}</span>
                      </li>
                    </ul>
                  </div>
                </Card>

                {/* For Groups Card */}
                <Card className="p-8 border-2 border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-300 bg-linear-to-br from-primary/5 to-transparent">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{t('home.benefits.forGroupsTitle')}</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{t('home.benefits.forGroupsBenefit1')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{t('home.benefits.forGroupsBenefit2')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{t('home.benefits.forGroupsBenefit3')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{t('home.benefits.forGroupsBenefit4')}</span>
                      </li>
                    </ul>
                  </div>
                </Card>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                {/* Step 1 with visual */}
                <div className="flex flex-col group text-center h-full">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="p-6 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-105">
                        <Heart className="h-10 w-10 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                        1
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6 min-h-[140px]">
                    <h3 className="text-xl font-bold text-foreground">{t('home.howItWorks.step1Title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t('home.howItWorks.step1Desc')}</p>
                  </div>
                  {/* Visual placeholder */}
                  <div className="rounded-xl overflow-hidden border border-border bg-muted/30 aspect-4/3 flex items-center justify-center mt-auto">
                    <div className="text-xs text-muted-foreground text-center p-4">
                      <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      [Rating Interface GIF]
                    </div>
                  </div>
                </div>

                {/* Step 2 with visual */}
                <div className="flex flex-col group text-center h-full">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="p-6 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-105">
                        <BrainCircuit className="h-10 w-10 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                        2
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6 min-h-[140px]">
                    <h3 className="text-xl font-bold text-foreground">{t('home.howItWorks.step2Title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t('home.howItWorks.step2Desc')}</p>
                  </div>
                  {/* Visual placeholder */}
                  <div className="rounded-xl overflow-hidden border border-border bg-muted/30 aspect-4/3 flex items-center justify-center mt-auto">
                    <div className="text-xs text-muted-foreground text-center p-4">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      [Recommendations GIF]
                    </div>
                  </div>
                </div>

                {/* Step 3 with visual */}
                <div className="flex flex-col group text-center h-full">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="p-6 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-105">
                        <PartyPopper className="h-10 w-10 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                        3
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6 min-h-[140px]">
                    <h3 className="text-xl font-bold text-foreground">{t('home.howItWorks.step3Title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t('home.howItWorks.step3Desc')}</p>
                  </div>
                  {/* Visual placeholder */}
                  <div className="rounded-xl overflow-hidden border border-border bg-muted/30 aspect-4/3 flex items-center justify-center mt-auto">
                    <div className="text-xs text-muted-foreground text-center p-4">
                      <PartyPopper className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      [Watch Room GIF]
                    </div>
                  </div>
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
                <Card className="group p-8 border-2 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-start gap-4">
                    <div className="p-4 bg-primary/10 rounded-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                      <BrainCircuit className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">{t('home.features.smartTitle')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.smartDesc')}</p>
                    </div>
                  </div>
                </Card>
                <Card className="group p-8 border-2 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-start gap-4">
                    <div className="p-4 bg-primary/10 rounded-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">{t('home.features.customPrefsTitle')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.customPrefsDesc')}</p>
                    </div>
                  </div>
                </Card>
                <Card className="group p-8 border-2 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-start gap-4">
                    <div className="p-4 bg-primary/10 rounded-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Users className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">{t('home.features.groupsTitle')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.groupsDesc')}</p>
                    </div>
                  </div>
                </Card>
                <Card className="group p-8 border-2 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-start gap-4">
                    <div className="p-4 bg-primary/10 rounded-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Zap className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">{t('home.features.noCompromiseTitle')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.noCompromiseDesc')}</p>
                    </div>
                  </div>
                </Card>
                <Card className="group p-8 border-2 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 relative overflow-hidden md:col-span-2">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-start gap-4">
                    <div className="p-4 bg-primary/10 rounded-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">{t('home.features.timeTitle')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{t('home.features.timeDesc')}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('home.comparison.title')}</h2>
              </div>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 sm:p-4 font-semibold text-foreground min-w-[180px]"></th>
                        <th className="text-center p-3 sm:p-4 font-semibold text-muted-foreground whitespace-nowrap">
                          {t('home.comparison.netflix')}
                        </th>
                        <th className="text-center p-3 sm:p-4 font-semibold text-muted-foreground whitespace-nowrap">
                          {t('home.comparison.imdb')}
                        </th>
                        <th className="text-center p-3 sm:p-4 font-semibold text-muted-foreground whitespace-nowrap">
                          {t('home.comparison.filmweb')}
                        </th>
                        <th className="text-center p-3 sm:p-4 font-semibold text-primary bg-primary/5 whitespace-nowrap">
                          {t('home.comparison.showSync')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-foreground">
                          {t('home.comparison.personalAI')}
                        </td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">✅</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl bg-primary/5">✅</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-foreground">
                          {t('home.comparison.groupRecs')}
                        </td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl bg-primary/5">✅</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-foreground">
                          {t('home.comparison.customPreferences')}
                        </td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl bg-primary/5">✅</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-foreground">
                          {t('home.comparison.regenerate')}
                        </td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl bg-primary/5">✅</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-foreground">
                          {t('home.comparison.free')}
                        </td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">❌</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">✅</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl">✅</td>
                        <td className="p-3 sm:p-4 text-center text-xl sm:text-2xl bg-primary/5">✅</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-8">{t('home.faq.title')}</h2>
              <div className="space-y-4">
                <Card className="p-6">
                  <h3 className="font-bold text-foreground mb-2">{t('home.faq.q1')}</h3>
                  <p className="text-muted-foreground text-sm">{t('home.faq.a1')}</p>
                </Card>
                <Card className="p-6">
                  <h3 className="font-bold text-foreground mb-2">{t('home.faq.q2')}</h3>
                  <p className="text-muted-foreground text-sm">{t('home.faq.a2')}</p>
                </Card>
                <Card className="p-6">
                  <h3 className="font-bold text-foreground mb-2">{t('home.faq.q3')}</h3>
                  <p className="text-muted-foreground text-sm">{t('home.faq.a3')}</p>
                </Card>
                <Card className="p-6">
                  <h3 className="font-bold text-foreground mb-2">{t('home.faq.q4')}</h3>
                  <p className="text-muted-foreground text-sm">{t('home.faq.a4')}</p>
                </Card>
                <Card className="p-6">
                  <h3 className="font-bold text-foreground mb-2">{t('home.faq.q5')}</h3>
                  <p className="text-muted-foreground text-sm">{t('home.faq.a5')}</p>
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
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t('home.ctaExtras.setup')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t('home.ctaExtras.noCard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t('home.ctaExtras.cancel')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
