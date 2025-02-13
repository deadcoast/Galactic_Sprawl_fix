import { Loader } from "lucide-react";

interface VPRLoadingFallbackProps {
  moduleType: string;
}

export function VPRLoadingFallback({ moduleType }: VPRLoadingFallbackProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-400">Loading {moduleType} module...</p>
      </div>
    </div>
  );
}
