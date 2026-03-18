import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        documento: { label: "Documento", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.documento || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { documento: credentials.documento as string },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.documento, // NextAuth requiere email field, usamos documento
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isAuthPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
      const isApi = nextUrl.pathname.startsWith("/api/");

      // Allow all API routes (auth is handled per-route)
      if (isApi) return true;

      // If on auth page and logged in, redirect to dashboard
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // If not logged in and not on auth page, redirect to login
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
      return true;
    },
  },
});
