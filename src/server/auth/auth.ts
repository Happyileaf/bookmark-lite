import { prisma } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import { getNextAuthSecret } from "@/server/auth/secret";
import type { Role } from "@prisma/client";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

const credentialSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  secret: getNextAuthSecret(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const matched = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!matched) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role as Role | undefined) ?? "user";
        token.name = user.name ?? null;
        return token;
      }
      // 昵称等资料可在设置页随时更新，每次解析会话时从库中刷新，避免旧 JWT 长期持有过期资料
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, role: true },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = (token.role as Role | undefined) ?? "user";
        session.user.name = token.name ?? null;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
