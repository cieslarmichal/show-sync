import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-2 text-9xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-3xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mb-8 text-lg text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button
              variant="default"
              size="lg"
            >
              Go to Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant="outline"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
