/**
 * Red Bull Racing - Skeleton Loading Component
 * F1-themed skeleton loaders
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'racing';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-rbr-dark-elevated',
        variant === 'racing' ? 'animate-shimmer' : 'animate-pulse',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="racing-card space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" variant="racing" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" variant="racing" />
          <Skeleton className="h-3 w-1/2" variant="racing" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" variant="racing" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" variant="racing" />
        <Skeleton className="h-9 flex-1" variant="racing" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="racing-card">
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" variant="racing" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" variant="racing" />
        ))}
      </div>
    </div>
  );
}





