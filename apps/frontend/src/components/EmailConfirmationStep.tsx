import { Button } from './ui/Button';
import { Mail, CheckCircle } from 'lucide-react';

interface EmailConfirmationStepProps {
  title: string;
  message: string;
  buttonText: string;
  onButtonClick: () => void;
  icon?: 'email' | 'check';
}

export default function EmailConfirmationStep({
  title,
  message,
  buttonText,
  onButtonClick,
  icon = 'email',
}: EmailConfirmationStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
          {icon === 'check' ? (
            <CheckCircle className="h-6 w-6 text-foreground" />
          ) : (
            <Mail className="h-6 w-6 text-foreground" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
      </div>
      <p className="text-muted-foreground">{message}</p>
      <Button
        onClick={onButtonClick}
        className="w-full h-12 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all"
      >
        {buttonText}
      </Button>
    </div>
  );
}
