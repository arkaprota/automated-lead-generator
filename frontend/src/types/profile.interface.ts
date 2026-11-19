// Mirror of backend/src/types/profile-response.interface.ts (Rule 13 — mirrored, not shared)

export interface ProfileUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ProfileWorkspace {
  id: string;
  name: string;
  plan: string;
  creditsRemaining: number;
  aiProvider: string;
  role: string | null;
}

/** `user` / `workspace` are null until the backend's Clerk webhook has synced them. */
export interface ProfileResponse {
  user: ProfileUser | null;
  workspace: ProfileWorkspace | null;
}
