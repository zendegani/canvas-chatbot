import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Defaults to current origin — works for both Vercel production
  // and local `vercel dev` (same-origin API at /api/auth/*).
});

export const { signIn, signUp, signOut, useSession } = authClient;
