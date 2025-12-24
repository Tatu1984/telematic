import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";
import type { SessionUser, UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
  interface User {
    id: string;
    role: UserRole;
    organizationId?: string;
    organizationName?: string;
    firstName: string;
    lastName: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    organizationId?: string;
    organizationName?: string;
    firstName: string;
    lastName: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            organization: true,
          },
        });

        if (!user || user.status !== "active") {
          return null;
        }

        const passwordMatch = await compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          organizationId: user.organizationId || undefined,
          organizationName: user.organization?.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as SessionUser).id = token.id;
        (session.user as SessionUser).firstName = token.firstName;
        (session.user as SessionUser).lastName = token.lastName;
        (session.user as SessionUser).role = token.role;
        (session.user as SessionUser).organizationId = token.organizationId;
        (session.user as SessionUser).organizationName = token.organizationName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
});

// Role-based access helpers
export const isSaaSUser = (role: UserRole): boolean => {
  return ["saas_admin", "saas_subscriber_manager", "saas_support", "saas_developer"].includes(role);
};

export const isCompanyUser = (role: UserRole): boolean => {
  return ["company_admin", "fleet_manager", "driver", "company_support"].includes(role);
};

export const canManageUsers = (role: UserRole): boolean => {
  return ["saas_admin", "saas_subscriber_manager", "company_admin"].includes(role);
};

export const canManageFleet = (role: UserRole): boolean => {
  return ["saas_admin", "company_admin", "fleet_manager"].includes(role);
};

export const canViewAnalytics = (role: UserRole): boolean => {
  return ["saas_admin", "saas_subscriber_manager", "company_admin", "fleet_manager"].includes(role);
};
