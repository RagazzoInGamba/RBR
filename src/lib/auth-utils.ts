import NextAuth from 'next-auth';
import { authConfig } from './auth';
import { redirect } from 'next/navigation';

const { auth } = NextAuth(authConfig);

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(role: string | string[]) {
  const session = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];
  
  if (!roles.includes(session.user.role)) {
    redirect('/unauthorized');
  }
  
  return session;
}

export async function requireSuperAdmin() {
  return requireRole('SUPER_ADMIN');
}

export async function requireKitchenAdmin() {
  return requireRole(['SUPER_ADMIN', 'KITCHEN_ADMIN']);
}

export async function requireCustomerAdmin() {
  return requireRole(['SUPER_ADMIN', 'CUSTOMER_ADMIN']);
}



