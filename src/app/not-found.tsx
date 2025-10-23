/**
 * Red Bull Racing - 404 Not Found Page
 * Custom error page with racing aesthetics
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rbr-dark via-rbr-dark-lighter to-rbr-dark p-4">
      <div className="max-w-2xl w-full text-center space-y-8 animate-racing-slide-up">
        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-[200px] font-display font-black bg-racing-red-gradient bg-clip-text text-transparent leading-none select-none">
            404
          </h1>
          {/* Speed lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-rbr-accent-blue/50 to-transparent animate-speed-line" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-heading font-bold text-rbr-text-primary">
            Page Not Found
          </h2>
          <p className="text-lg text-rbr-text-secondary max-w-md mx-auto">
            Looks like you&apos;ve hit the barriers. This page doesn&apos;t exist on our circuit.
          </p>
        </div>

        {/* Racing card with icon */}
        <div className="racing-card inline-block">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-racing-red-gradient flex items-center justify-center animate-pulse-glow">
              <span className="text-3xl font-display text-white">!</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-rbr-text-primary">
                The page you&apos;re looking for doesn&apos;t exist
              </p>
              <p className="text-xs text-rbr-text-muted">
                Error Code: 404 - Resource Not Found
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            className="bg-racing-red-gradient hover:opacity-90 min-w-[180px]"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white min-w-[180px]"
            onClick={() => window.history.back()}
          >
            <button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </button>
          </Button>
        </div>

        {/* F1 Quote */}
        <div className="pt-8 border-t border-rbr-red/20">
          <p className="text-sm text-rbr-text-muted italic">
            &quot;Sometimes you need to push the limits, but this time you went off-track.&quot;
          </p>
          <p className="text-xs text-rbr-text-muted mt-2">- Red Bull Racing Team</p>
        </div>
      </div>
    </div>
  );
}

