// lib/auth.ts
// Shared NextAuth configuration exported for use in API route handlers.
// The actual route handler lives in app/api/auth/[...nextauth]/route.ts.

import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Admin emails that can access /admin routes and confirm paid actions.
// These must also match the Google accounts used to sign in.
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

// Fallback: include the hardcoded emails from existing auth if ADMIN_EMAILS not set
const ALLOWED_EMAILS = ADMIN_EMAILS.length > 0
  ? ADMIN_EMAILS
  : [
      "hea.trades@gmail.com",
      "jdmheff@gmail.com",
      "sbjma.alexisflores@gmail.com",
    ]

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return ALLOWED_EMAILS.includes(user.email ?? "")
    },
    async session({ session }) {
      return session
    },
    async jwt({ token }) {
      return token
    },
  },
  pages: {
    signIn: "/dashboard/login",
    error: "/dashboard/login",
  },
  session: {
    strategy: "jwt",
  },
}

/** Returns true if the given email is allowed to access admin functions */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ALLOWED_EMAILS.includes(email)
}
