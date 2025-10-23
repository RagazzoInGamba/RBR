import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rbr-dark via-rbr-dark-lighter to-rbr-navy-dark p-4">
      <Card className="max-w-md w-full p-8 text-center racing-card animate-racing-slide-up shadow-racing-lg">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-rbr-red/20 animate-pulse-glow" />
          <div className="relative flex items-center justify-center h-full">
            <ShieldAlert className="h-12 w-12 text-rbr-red" />
          </div>
        </div>
        <h1 className="text-4xl font-display font-bold mb-3 text-rbr-text-primary">
          Access Denied
        </h1>
        <p className="text-rbr-text-secondary mb-8 text-lg">
          You don&apos;t have permission to access this page. Please contact your administrator if you
          believe this is an error.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-racing-red-gradient hover:opacity-90">
            <Link href="/">Go Home</Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            className="border-rbr-navy text-rbr-navy hover:bg-rbr-navy hover:text-white"
          >
            <Link href="/login">Sign Out</Link>
          </Button>
        </div>
        
        {/* Racing line decoration */}
        <div className="mt-8 pt-8 border-t border-rbr-red/20">
          <p className="text-sm text-rbr-text-muted">
            Error Code: 403 - Forbidden
          </p>
        </div>
      </Card>
    </div>
  );
}



