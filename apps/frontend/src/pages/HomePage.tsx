import { useNavigate, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Heart, BrainCircuit, PartyPopper, Users, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { AuthContext } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { userData, userDataInitialized } = useContext(AuthContext);

  useSEO({
    title: 'ShowSync - Stop Arguing About What to Watch',
    description:
      "End the endless scrolling and debate. Get personalized TV show recommendations that match your group's taste. Find shows everyone actually wants to watch.",
    keywords: [
      'tv show recommendations',
      'watch party',
      'group recommendations',
      'smart suggestions',
      'show matching',
      'tv shows',
      'watch together',
      'streaming recommendations',
    ],
  });

  // Show loading state while checking authentication
  if (!userDataInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
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
                Stop arguing about <span className="text-primary inline-block">what to watch</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                Get personalized recommendations that everyone agrees on.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8 text-sm px-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">Free to start</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">No credit card needed</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">Setup in 2 minutes</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 mt-10">
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] w-full sm:w-auto text-base font-semibold px-8 h-12"
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="border-border hover:bg-accent w-full sm:w-auto text-base h-12"
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">How It Works</h2>
                <p className="text-lg text-muted-foreground">Three simple steps. Zero arguments about what to watch.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-center">
                <div className="space-y-4 group">
                  <div className="flex justify-center">
                    <div className="p-5 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">1. Rate Your Favorites</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Quickly rate shows you've watched. Love it, like it, or skip it. Takes less than a minute to build
                    your taste profile.
                  </p>
                </div>
                <div className="space-y-4 group">
                  <div className="flex justify-center">
                    <div className="p-5 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">2. Invite Your Crew</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Create a watch room and share it with friends, family, or your partner. Or keep it solo—your choice!
                  </p>
                </div>
                <div className="space-y-4 group">
                  <div className="flex justify-center">
                    <div className="p-5 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <PartyPopper className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">3. Watch the Magic Happen</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get instant recommendations that balance everyone's taste. No scrolling for hours. No compromising.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  Why People Love ShowSync
                </h2>
                <p className="text-lg text-muted-foreground">The smartest way to decide what to watch next.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <Card className="p-8 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <BrainCircuit className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Actually Smart Recommendations</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        We analyze your unique taste and find hidden gems you'll love — not just the same popular shows
                        everyone recommends.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-8 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Perfect for Groups or Solo</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Whether it's date night, family time, or just you on the couch — get recommendations that work
                        for any situation.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-8 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Save Hours of Scrolling</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Stop spending more time choosing than watching. Get your perfect match in seconds, not hours.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-8 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No More Compromises</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Find shows that genuinely appeal to everyone. No settling for something half your group doesn't
                        want to watch.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center py-16 px-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Ready to end the "what should we watch?" debate?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Join thousands of people who've already stopped wasting time scrolling. Get your first recommendation in
                under 2 minutes.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] text-base font-semibold px-8 h-12"
              >
                Get Started Free
              </Button>
              <p className="text-sm text-muted-foreground mt-6">No credit card required • Free trial included</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
