import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Manage staff access via Vercel env var ALLOWED_EMAILS (comma-separated).
// Falls back to the original list if the env var is not set.
const ALLOWED_EMAILS = (
  process.env.ALLOWED_EMAILS ||
  'hea.trades@gmail.com,jdmheff@gmail.com,sbjma.alexisflores@gmail.com'
).split(',').map((e) => e.trim()).filter(Boolean);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return ALLOWED_EMAILS.includes(user.email ?? '');
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
  pages: {
    signIn: '/dashboard/login',
    error: '/dashboard/login',
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };
