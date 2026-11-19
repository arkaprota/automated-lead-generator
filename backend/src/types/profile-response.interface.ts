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
  /** Null when no membership row has been synced for this user yet. */
  role: string | null;
}

/** `user` / `workspace` are null until the Clerk webhook has synced them. */
export interface ProfileResponse {
  user: ProfileUser | null;
  workspace: ProfileWorkspace | null;
}
