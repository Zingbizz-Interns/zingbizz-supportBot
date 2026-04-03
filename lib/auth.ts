import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { getUserByEmail, getOrCreateOAuthUser, getUserById } from "./db/queries/users";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
const githubConfigured = Boolean(
  process.env.GITHUB_ID && process.env.GITHUB_SECRET
);

const providers = [];

if (googleConfigured) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

if (githubConfigured) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    })
  );
}

providers.push(
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await getUserByEmail(credentials.email as string);
      if (!user) return null;

      // Reject OAuth-only accounts (no password set)
      if (!user.passwordHash) return null;

      const passwordMatch = await bcrypt.compare(
        credentials.password as string,
        user.passwordHash
      );
      if (!passwordMatch) return null;

      return { id: user.id, email: user.email };
    },
  })
);

export const oauthProviders = {
  google: googleConfigured,
  github: githubConfigured,
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Credentials: authorize() already handled validation
      if (!account || account.provider === "credentials") return true;

      // OAuth: upsert user and link account
      if (!user.email) return false;

      const dbUser = await getOrCreateOAuthUser(
        user.email,
        account.provider,
        account.providerAccountId
      );

      // Override with DB UUID so jwt callback gets the right id
      user.id = dbUser.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        return token;
      }

      if (typeof token.id !== "string") {
        delete token.id;
        delete token.email;
        return token;
      }

      const dbUser = await getUserById(token.id);
      if (!dbUser) {
        delete token.id;
        delete token.email;
        return token;
      }

      token.email = dbUser.email;
      return token;
    },
    async session({ session, token }) {
      if (!session.user || typeof token.id !== "string") {
        return session;
      }

      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
});
