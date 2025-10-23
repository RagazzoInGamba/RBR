/**
 * Red Bull Racing - Error Alert Component
 * Inline error feedback with racing aesthetics
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  className?: string;
  onDismiss?: () => void;
}

export function ErrorAlert({
  title,
  message,
  variant = 'error',
  dismissible = true,
  className,
  onDismiss,
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const variantStyles = {
    error: 'border-rbr-red/30 bg-rbr-red/10 text-rbr-red-light',
    warning: 'border-rbr-accent-yellow/30 bg-rbr-accent-yellow/10 text-rbr-accent-yellow',
    info: 'border-rbr-accent-blue/30 bg-rbr-accent-blue/10 text-rbr-accent-blue',
  };

  return (
    <Alert className={cn('relative', variantStyles[variant], className)}>
      <AlertTriangle className="h-5 w-5" />
      <div className="flex-1">
        {title && <AlertTitle className="font-heading">{title}</AlertTitle>}
        <AlertDescription className="text-rbr-text-secondary">{message}</AlertDescription>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-current hover:opacity-70 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
}

