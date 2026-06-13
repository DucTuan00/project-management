import { Workspace } from '@/modules/workspace/workspace.entity';
import { WorkspaceMember } from '@/modules/workspace/workspace-member.entity';

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  settings: Record<string, any>;
  createdAt: Date;
  memberCount?: number;
}

export interface WorkspaceMemberResponse {
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
  joinedAt: Date | null;
  createdAt: Date;
}

export function toWorkspaceResponse(workspace: Workspace): WorkspaceResponse {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    description: workspace.description,
    logoUrl: workspace.logoUrl,
    ownerId: workspace.ownerId,
    settings: workspace.settings,
    createdAt: workspace.createdAt,
  };
}
