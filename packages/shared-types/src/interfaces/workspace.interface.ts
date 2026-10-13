export interface IWorkspace {
  id: string;
  name: string;
  clerkOrgId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISenderProfile {
  id: string;
  workspaceId: string;
  senderName: string;
  senderEmail: string;
  companyName: string;
  logoUrl?: string | null;
  portfolioUrl?: string | null;
  pitchAngle?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
