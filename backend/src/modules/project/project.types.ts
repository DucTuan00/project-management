import { Project } from '@/modules/project/project.entity';

export interface ProjectResponse {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string | null;
  leadId: string;
  status: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMemberResponse {
  id: string;
  projectId: string;
  userId: string;
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
  };
  createdAt: Date;
}

export function toProjectResponse(project: Project): ProjectResponse {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    key: project.key,
    description: project.description,
    leadId: project.leadId,
    status: project.status,
    settings: project.settings,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
