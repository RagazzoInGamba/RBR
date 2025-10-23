/**
 * Red Bull Racing - Loading Spinner Component
 * F1-inspired loading animation
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', label, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Outer Ring - Red Bull Red */}
        <div className="absolute inset-0 rounded-full border-4 border-rbr-red/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-rbr-red animate-spin" />
        
        {/* Inner Ring - Navy */}
        <div className="absolute inset-2 rounded-full border-4 border-rbr-navy/20" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-rbr-navy animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }} />
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-rbr-accent-blue animate-pulse" />
        </div>
      </div>
      
      {label && (
        <p className="text-sm font-medium text-rbr-text-secondary animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

export function PageLoadingOverlay({ label = 'Caricamento...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rbr-dark/95 backdrop-blur-sm">
      <LoadingSpinner size="xl" label={label} />
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className="relative h-4 w-4">
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-rbr-red animate-spin" />
      </div>
      <span className="text-sm text-rbr-text-muted animate-pulse">Caricamento...</span>
    </div>
  );
}
