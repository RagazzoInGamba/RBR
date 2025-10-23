/**
 * Red Bull Racing - Empty State Component
 * Reusable component for displaying empty data states with calls to action
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {/* Icon with gradient background */}
      <div className="mb-6 relative">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-rbr-navy/20 to-rbr-red/20 flex items-center justify-center animate-racing-pulse">
          <Icon className="h-10 w-10 text-rbr-text-muted" />
        </div>
        <div className="absolute inset-0 rounded-full bg-racing-gradient opacity-10 blur-xl" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-heading font-bold text-rbr-text-primary mb-2">
        {title}
      </h3>
      <p className="text-rbr-text-secondary max-w-md mb-6">
        {description}
      </p>

      {/* Action or Custom Children */}
      {action && !children && (
        <Button
          onClick={action.onClick}
          className="bg-racing-red-gradient hover:opacity-90 gap-2"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}

      {children}
    </div>
  );
}
