import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "./prisma";
import { headers } from "next/headers";

export const auth = betterAuth({
  trustedOrigins: ["http://localhost:3001"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    modelName: "users",
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      avatar: {
        type: "string",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    },
  },
  account: {
    modelName: "accounts"
  },
  session: {
    modelName: "sessions"
  },
  verification: {
    modelName: "verifications"
  },
  plugins: [nextCookies()],
});

// Get the current user session from request headers
export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
