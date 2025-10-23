/**
 * Red Bull Racing - Step Progress Indicator
 * Multi-step progress indicator with Red Bull aesthetics
 */

'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number; // 1-indexed
  className?: string;
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center font-heading font-bold text-sm transition-all duration-300',
                    isCompleted &&
                      'bg-racing-gradient text-white shadow-racing-md',
                    isCurrent &&
                      'bg-rbr-red text-white shadow-racing-lg animate-pulse-glow ring-2 ring-rbr-red/50 ring-offset-2 ring-offset-rbr-dark',
                    isFuture &&
                      'bg-rbr-dark-elevated text-rbr-text-muted border-2 border-rbr-border'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-xs font-medium transition-colors',
                      (isCompleted || isCurrent)
                        ? 'text-rbr-text-primary'
                        : 'text-rbr-text-muted'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-rbr-text-muted mt-1 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-4 rounded-full transition-all duration-300',
                    stepNumber < currentStep
                      ? 'bg-racing-red-gradient shadow-racing-sm'
                      : 'bg-rbr-dark-elevated'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
