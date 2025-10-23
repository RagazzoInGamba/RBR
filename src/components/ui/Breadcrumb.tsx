/**
 * Red Bull Racing - Breadcrumb Navigation
 * Accessible breadcrumb component with Red Bull aesthetics
 */

'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      {showHome && (
        <>
          <Link
            href="/"
            className="text-rbr-text-muted hover:text-rbr-red transition-colors duration-200 flex items-center gap-1"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
          {items.length > 0 && (
            <ChevronRight className="h-4 w-4 text-rbr-text-muted" />
          )}
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-rbr-text-muted hover:text-rbr-red transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-medium',
                  isLast ? 'text-rbr-text-primary' : 'text-rbr-text-muted'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}

            {!isLast && (
              <ChevronRight className="h-4 w-4 text-rbr-text-muted" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
