/** True when a Clerk publishable key is configured (ClerkProvider is mounted). */
export const clerkEnabled = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_') ?? false;
