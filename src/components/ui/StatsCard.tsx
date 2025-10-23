/**
 * Red Bull Racing - Stats Card Component
 * Dashboard statistics display with racing aesthetics
 */

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  description?: string;
  variant?: 'default' | 'red' | 'navy' | 'accent';
  className?: string;
  isLoading?: boolean;
}

const variantStyles = {
  default: 'from-rbr-dark-card to-rbr-dark-elevated',
  red: 'from-rbr-red/10 to-rbr-dark-card border-rbr-red/20',
  navy: 'from-rbr-navy/10 to-rbr-dark-card border-rbr-navy/20',
  accent: 'from-rbr-accent-blue/10 to-rbr-dark-card border-rbr-accent-blue/20',
};

const iconVariantStyles = {
  default: 'bg-rbr-dark-elevated text-rbr-accent-blue',
  red: 'bg-rbr-red/20 text-rbr-red-bright',
  navy: 'bg-rbr-navy/20 text-rbr-navy',
  accent: 'bg-rbr-accent-blue/20 text-rbr-accent-blue',
};

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  description,
  variant = 'default',
  className,
  isLoading,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className={cn('racing-card animate-racing-pulse', className)}>
        <div className="space-y-3">
          <div className="h-12 w-12 rounded-lg bg-rbr-dark-elevated animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-rbr-dark-elevated rounded animate-pulse" />
            <div className="h-8 w-32 bg-rbr-dark-elevated rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'racing-card bg-gradient-to-br transition-all duration-300 hover:scale-[1.02]',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          {/* Icon */}
          <div
            className={cn(
              'inline-flex p-3 rounded-lg',
              iconVariantStyles[variant]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-rbr-text-muted uppercase tracking-wider">
              {label}
            </p>
            <p className="text-3xl font-heading font-bold text-rbr-text-primary">
              {value}
            </p>
            {description && (
              <p className="text-sm text-rbr-text-secondary">{description}</p>
            )}
          </div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              trend.direction === 'up'
                ? 'bg-rbr-accent-green/20 text-rbr-accent-green'
                : 'bg-rbr-red/20 text-rbr-red-light'
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

