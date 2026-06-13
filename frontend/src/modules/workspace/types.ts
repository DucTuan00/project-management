export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  ownerId: string;
  settings: Record<string, any>;
  createdAt: string;
  memberCount?: number;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  roleId: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  role: {
    id: string;
    name: string;
    level: number;
  };
  joinedAt: string | null;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  roleId: string;
}

export interface UpdateMemberRoleRequest {
  roleId: string;
}
