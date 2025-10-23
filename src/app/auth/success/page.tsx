/**
 * Red Bull Racing - Auth Success Page
 * Handles role-based redirect after successful login
 * This page is the callbackUrl for NextAuth signIn()
 *
 * CLIENT COMPONENT: Uses client-side redirect to avoid server-side redirect() issues
 * during NextAuth callback flow
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    // No session → redirect to login
    if (!session || !session.user) {
      console.log('[AuthSuccess] No session found - redirecting to login');
      router.replace('/login');
      return;
    }

    // Determine redirect URL based on role
    const roleRedirects: Record<string, string> = {
      'SUPER_ADMIN': '/super-admin',
      'KITCHEN_ADMIN': '/kitchen',
      'CUSTOMER_ADMIN': '/customer-admin',
      'END_USER': '/booking',
    };

    const redirectUrl = roleRedirects[session.user.role as string] || '/';

    console.log('[AuthSuccess] Redirecting to role-based dashboard', {
      role: session.user.role,
      userId: session.user.id,
      redirectUrl
    });

    // Client-side redirect (avoids server-side redirect issues)
    router.replace(redirectUrl);
  }, [session, status, router]);

  // Loading state durante il redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-rbr-dark">
      <div className="text-center">
        {/* Spinner animato */}
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rbr-red mb-4"></div>

        {/* Messaggio di loading */}
        <p className="text-rbr-text-primary text-lg">
          Reindirizzamento in corso...
        </p>

        {status === 'loading' && (
          <p className="text-rbr-text-secondary text-sm mt-2">
            Caricamento sessione...
          </p>
        )}
      </div>
    </div>
  );
}
