import { Loader } from 'lucide-react';

interface VPRLoadingFallbackProps {
  moduleType: string;
}

export function VPRLoadingFallback({ moduleType }: VPRLoadingFallbackProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm text-gray-400">Loading {moduleType} module...</p>
      </div>
    </div>
  );
}
