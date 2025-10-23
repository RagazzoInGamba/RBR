/**
 * Red Bull Racing - Error Boundary
 * Custom error page for runtime errors
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (client-side)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rbr-dark via-rbr-dark-lighter to-rbr-dark p-4">
      <div className="max-w-2xl w-full text-center space-y-8 animate-racing-slide-up">
        {/* Error Icon */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-rbr-red/20 animate-pulse-glow" />
          <div className="relative flex items-center justify-center h-full">
            <AlertTriangle className="h-16 w-16 text-rbr-red" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-display font-bold text-rbr-text-primary">
            Something Went Wrong
          </h1>
          <p className="text-lg text-rbr-text-secondary max-w-md mx-auto">
            We encountered an unexpected error. Our team has been notified and is working on it.
          </p>
        </div>

        {/* Error details */}
        <div className="racing-card text-left max-w-xl mx-auto">
          <div className="space-y-2">
            <p className="text-sm font-medium text-rbr-text-primary">Error Details:</p>
            <p className="text-sm text-rbr-text-secondary font-mono break-all">
              {error.message || 'An unknown error occurred'}
            </p>
            {error.digest && (
              <p className="text-xs text-rbr-text-muted">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={reset}
            className="bg-racing-red-gradient hover:opacity-90 min-w-[180px]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white min-w-[180px]"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Support info */}
        <div className="pt-8 border-t border-rbr-red/20">
          <p className="text-sm text-rbr-text-muted">
            Need help? Contact{' '}
            <a
              href="mailto:support@redbullracing.com"
              className="text-rbr-red hover:text-rbr-red-bright transition-colors underline"
            >
              support@redbullracing.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

