export interface VerifiedIdentity {
  userId: string;
  /** Active Clerk organization ID; null when the user has no organization selected. */
  workspaceId: string | null;
}
