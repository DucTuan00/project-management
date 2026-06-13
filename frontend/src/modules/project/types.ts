export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string | null;
  leadId: string;
  status: 'active' | 'archived' | 'frozen';
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
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
  createdAt: string;
}

export interface ProjectSettings {
  columns: ProjectColumn[];
}

export interface ProjectColumn {
  id: string;
  name: string;
  order: number;
  color?: string;
  wipLimit?: number;
}

export interface CreateProjectRequest {
  name: string;
  key?: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'archived' | 'frozen';
}

export interface UpdateProjectSettingsRequest {
  columns?: ProjectColumn[];
}
