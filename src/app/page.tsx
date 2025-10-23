import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rbr-dark via-rbr-dark-lighter to-rbr-navy-dark p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-rbr-red/5 rounded-full blur-3xl animate-racing-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-rbr-navy/5 rounded-full blur-3xl animate-racing-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="text-center relative z-10 max-w-4xl mx-auto space-y-12 animate-racing-slide-up">
        {/* Logo */}
        <div className="inline-flex h-32 w-32 rounded-2xl bg-racing-red-gradient items-center justify-center shadow-racing-glow mb-8">
          <span className="text-5xl font-display text-white">RBR</span>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-7xl font-display font-black gradient-text leading-tight">
            Red Bull Racing
          </h1>
          <p className="text-3xl text-rbr-text-secondary font-heading">
            Meal Booking Platform
          </p>
          {/* Speed line */}
          <div className="relative h-1 bg-gradient-to-r from-transparent via-rbr-red to-transparent max-w-md mx-auto rounded-full">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-full w-32 bg-gradient-to-r from-transparent via-rbr-accent-blue to-transparent animate-speed-line" />
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xl text-rbr-text-muted max-w-2xl mx-auto">
          Enterprise meal management platform for Oracle Red Bull Racing team members.
          Book meals, manage orders, and stay fueled for peak performance.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            asChild 
            className="bg-racing-red-gradient hover:opacity-90 text-lg px-8 py-6 min-w-[200px] shadow-racing-lg"
          >
            <Link href="/login">
              Sign In
            </Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            className="border-2 border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white text-lg px-8 py-6 min-w-[200px]"
          >
            <Link href="/login">
              Get Started
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12">
          <div className="racing-card">
            <p className="text-3xl font-display font-bold text-rbr-red mb-2">1000+</p>
            <p className="text-sm text-rbr-text-muted">Daily Meals</p>
          </div>
          <div className="racing-card">
            <p className="text-3xl font-display font-bold text-rbr-navy mb-2">24/7</p>
            <p className="text-sm text-rbr-text-muted">Service</p>
          </div>
          <div className="racing-card">
            <p className="text-3xl font-display font-bold text-rbr-accent-blue mb-2">4</p>
            <p className="text-sm text-rbr-text-muted">Payment Methods</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-rbr-text-muted pt-8">
          © 2025 Oracle Red Bull Racing. All rights reserved.
        </p>
      </div>
    </div>
  );
}
