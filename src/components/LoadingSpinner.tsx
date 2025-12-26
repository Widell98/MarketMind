import { Loader2 } from "lucide-react";

/**
 * Loading spinner component for Suspense fallbacks
 */
const LoadingSpinner = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Laddar...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

