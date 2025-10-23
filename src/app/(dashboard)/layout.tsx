/**
 * Red Bull Racing - Dashboard Layout
 * Main application layout with Header, Sidebar, and Footer
 */

'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { CommandPalette } from '@/components/CommandPalette';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PageLoadingOverlay } from '@/components/ui/LoadingSpinner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  if (status === 'loading') {
    return <PageLoadingOverlay label="Loading dashboard..." />;
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const userRole = (session?.user as { role: string })?.role || 'END_USER';

  return (
    <div className="flex h-screen overflow-hidden bg-rbr-dark">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex">
        <Sidebar userRole={userRole} />
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          isSidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div
          className="absolute inset-0 bg-rbr-dark/80 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
        <div className="absolute left-0 top-0 bottom-0 w-64 animate-racing-slide-in">
          <Sidebar userRole={userRole} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-rbr-dark via-rbr-dark-lighter to-rbr-dark">
          {children}
        </main>

        <Footer />
      </div>

      <Toaster />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

