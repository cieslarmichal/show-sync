import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Heart, BrainCircuit, PartyPopper, Tv, Users } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export default function HomePage() {
  const navigate = useNavigate();

  useSEO({
    title: 'ShowSync - Smart TV Show Suggestions for Groups',
    description:
      'Find the perfect TV show for your watch party. Get smart suggestions based on group preferences. Create watch rooms and discover shows everyone will love.',
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

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="animate-fade-in space-y-20 sm:space-y-32">
            {/* Hero Section */}
            <div className="text-center pt-12">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tighter">
                Find great TV shows to watch together
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground font-light tracking-tight max-w-4xl mx-auto mb-10">
                Tell us which TV shows you like, invite your friends, and we'll suggest shows everyone will enjoy
                watching together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto"
                >
                  Get Started for Free
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="border-border hover:bg-accent w-full sm:w-auto"
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How It Works</h2>
                <p className="text-lg text-muted-foreground mt-3">
                  Just 3 simple steps to find your next favorite show.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">1. Tell Us What You Like</h3>
                  <p className="text-muted-foreground">
                    Rate TV shows you've watched - mark which ones you loved or liked.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Tv className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">2. Create a Watch Room</h3>
                  <p className="text-muted-foreground">
                    Make a watch room and invite your friends - or just use it for yourself!
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <PartyPopper className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">3. Get Suggestions</h3>
                  <p className="text-muted-foreground">
                    We'll suggest TV shows that match what everyone in your group likes.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Why You'll Love It</h2>
                <p className="text-lg text-muted-foreground mt-3">Simple features that make choosing a show easy.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-6 border-2">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <BrainCircuit className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Smart Suggestions</h3>
                      <p className="text-muted-foreground mt-1">
                        Our smart system learns what you like and suggests shows you'll probably enjoy.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 border-2">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Watch Alone or With Friends</h3>
                      <p className="text-muted-foreground mt-1">
                        Use it just for yourself, or invite friends and family to find shows everyone will like.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center py-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Ready to discover great shows?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Sign up for free and stop wasting time arguing about what to watch.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started for Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
