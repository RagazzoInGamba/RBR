/**
 * Red Bull Racing - Page Header Component
 * Consistent page header with racing aesthetics
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({ title, subtitle, action, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 pb-6', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-rbr-text-muted">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-rbr-red transition-colors duration-200"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-rbr-text-primary">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title section with action */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h1 className="text-4xl font-display text-rbr-text-primary relative inline-block">
            {title}
            {/* Racing underline effect */}
            <span className="absolute -bottom-2 left-0 h-1 w-16 bg-racing-red-gradient rounded-full" />
          </h1>
          {subtitle && (
            <p className="text-lg text-rbr-text-secondary max-w-3xl">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Speed line animation */}
      <div className="relative h-px bg-gradient-to-r from-rbr-red/0 via-rbr-red/50 to-rbr-red/0">
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full w-20 bg-gradient-to-r from-transparent via-rbr-accent-blue to-transparent animate-speed-line" />
        </div>
      </div>
    </div>
  );
}

