import { getSession } from "@/lib/auth";
import { os as baseOS } from "@orpc/server";

// Define auth middleware that injects user into context
const authMiddleware = baseOS.middleware(async ({ next }) => {
  const session = await getSession();

  return next({
    context: {
      user: session?.user || null,
      session: session || null,
    },
  });
});

// Create authenticated OS instance with user in context
export const authedOS = baseOS.use(authMiddleware);

// Create protected OS that requires authentication
export const protectedOS = authedOS.use(async ({ context, next }) => {
  if (!context.user?.id) {
    throw new Error("Unauthorized");
  }

  // TypeScript now knows user is not null after this check
  return next({
    context: {
      user: context.user, // Now guaranteed to be non-null
    },
  });
});

// Export base OS for public routes
export { baseOS as os };
