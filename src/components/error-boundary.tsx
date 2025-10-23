/**
 * Red Bull Racing - Global Error Boundary
 * Catches React errors and provides graceful fallback UI
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service (Sentry, etc.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service
    // if (typeof window !== 'undefined') {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-rbr-dark p-4">
          <Card className="w-full max-w-2xl racing-border shadow-2xl bg-rbr-dark-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-rbr-red/20 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-rbr-red" />
              </div>
              <CardTitle className="text-3xl font-heading font-bold text-rbr-text-primary">
                Oops! Si è verificato un errore
              </CardTitle>
              <CardDescription className="text-lg text-rbr-text-secondary mt-2">
                Qualcosa è andato storto durante l&apos;elaborazione della richiesta
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-lg bg-rbr-dark-elevated border border-rbr-border p-4">
                  <p className="text-sm font-semibold text-rbr-red mb-2">Error Details (Development Only):</p>
                  <div className="text-xs text-rbr-text-muted font-mono bg-rbr-dark p-3 rounded overflow-x-auto">
                    <p className="text-rbr-red font-bold mb-2">{this.state.error.toString()}</p>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap text-rbr-text-disabled">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-rbr-card-overlay rounded-lg p-4">
                <p className="text-sm text-rbr-text-secondary">
                  Il nostro team è stato automaticamente notificato. Nel frattempo puoi:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-rbr-text-muted">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rbr-accent-blue" />
                    Ricaricare la pagina
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rbr-accent-blue" />
                    Tornare alla home
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rbr-accent-blue" />
                    Contattare l&apos;assistenza se il problema persiste
                  </li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Riprova
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="bg-racing-red-gradient gap-2"
              >
                <Home className="h-4 w-4" />
                Torna alla Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based alternative for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { setError };
}
