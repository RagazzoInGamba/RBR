import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import bcrypt from 'bcryptjs';
import { z} from 'zod';
import { authLogger } from './logger';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig: NextAuthConfig = {
  // Enable debug mode to troubleshoot CSRF/JWT issues
  debug: true,

  // Explicit basePath for API routes
  basePath: '/api/auth',

  // Use insecure cookies for localhost HTTP
  useSecureCookies: false,

  // JWT session strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          authLogger.info('Starting authorization', { email: credentials?.email });
          const { email, password } = loginSchema.parse(credentials);

          // Find user
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user || !user.password) {
            authLogger.warn('User not found or no password', { email });
            return null;
          }

          authLogger.debug('User found', { email: user.email, role: user.role });

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            authLogger.warn('Invalid password', { email });
            return null;
          }

          authLogger.info('Password valid, updating last login', { userId: user.id });

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Log audit
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'user.login',
              entity: 'User',
              entityId: user.id,
              changes: {
                email: user.email,
                role: user.role,
              },
            },
          });

          const returnUser = {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          };

          authLogger.info('Login successful', { userId: returnUser.id, role: returnUser.role });
          return returnUser;
        } catch (error) {
          authLogger.error('Authorization error', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        authLogger.info('JWT callback - adding user to token', { userId: user.id });
        token.id = user.id as string;
        token.role = user.role as string;
      }
      return token;
    },
    async session({ session, token }) {
      authLogger.info('Session callback', { tokenId: token.id });
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      authLogger.info('Redirect callback - START', { url, baseUrl });

      try {
        // Parse the URL to extract pathname
        let targetPath = url;

        // Handle absolute URLs
        if (url.startsWith('http')) {
          const urlObj = new URL(url);

          // Only allow same-origin redirects for security
          if (urlObj.origin !== baseUrl) {
            authLogger.warn('Redirect callback - blocked external redirect', { url, baseUrl });
            return baseUrl;
          }

          targetPath = urlObj.pathname;
        }

        // Block redirect back to login page (prevents loop)
        if (targetPath === '/login' || targetPath.startsWith('/login?')) {
          authLogger.info('Redirect callback - blocked /login redirect, using baseUrl', { targetPath });
          return baseUrl;
        }

        // Allow all other paths (including /auth/success)
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${targetPath}`;
        authLogger.info('Redirect callback - allowing redirect', { fullUrl, targetPath });
        return fullUrl;
      } catch (error) {
        authLogger.error('Redirect callback error', error);
        return baseUrl;
      }
    },
  },
  // NextAuth v5 uses AUTH_SECRET as primary, fallback to NEXTAUTH_SECRET for compatibility
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

// NextAuth v5 exports
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

// Backward compatibility wrapper for API routes
export async function getServerSession(_config?: unknown) {
  return await auth();
}

