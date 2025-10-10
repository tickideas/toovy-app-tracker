import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import GitHubProvider from "next-auth/providers/github";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If the callback URL is relative, redirect to baseUrl + callback URL
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // If the callback URL is on a different domain, redirect to baseUrl
      else if (new URL(url).origin !== baseUrl) return baseUrl
      return url
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
};
