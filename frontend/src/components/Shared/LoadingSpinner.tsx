import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Carregando...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <Loader2 className="animate-spin text-blue-400 mb-4" size={48} />
      <p className="text-gray-400 text-lg">{message}</p>
    </div>
  );
}
