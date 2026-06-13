import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1750000000000 implements MigrationInterface {
  name = 'CreateInitialSchema1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ============================================
    // USERS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        "passwordHash" VARCHAR(255) NOT NULL,
        "displayName" VARCHAR(100) NOT NULL,
        "avatarUrl" VARCHAR(500),
        "isEmailVerified" BOOLEAN DEFAULT false,
        "emailVerifiedAt" TIMESTAMPTZ,
        "lastLoginAt" TIMESTAMPTZ,
        "refreshTokenHash" VARCHAR(255),
        "passwordResetToken" VARCHAR(255),
        "passwordResetExpires" TIMESTAMPTZ,
        "verificationToken" VARCHAR(255),
        "verificationTokenExpires" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_users_email ON users (email) WHERE "deletedAt" IS NULL`);

    // ============================================
    // ROLES
    // ============================================
    await queryRunner.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        "isSystem" BOOLEAN DEFAULT false,
        "workspaceId" UUID,
        level INT DEFAULT 0,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_roles_name_workspace
      ON roles (name, "workspaceId")
      WHERE "deletedAt" IS NULL
    `);

    // ============================================
    // PERMISSIONS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        "group" VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // ROLE_PERMISSIONS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "roleId" UUID NOT NULL,
        "permissionId" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_role_permissions_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT fk_role_permissions_permission FOREIGN KEY ("permissionId") REFERENCES permissions(id) ON DELETE CASCADE,
        CONSTRAINT uq_role_permission UNIQUE ("roleId", "permissionId")
      )
    `);

    // ============================================
    // WORKSPACES
    // ============================================
    await queryRunner.query(`
      CREATE TABLE workspaces (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) NOT NULL UNIQUE,
        description TEXT,
        "logoUrl" VARCHAR(500),
        "ownerId" UUID NOT NULL,
        settings JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT fk_workspaces_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_workspaces_slug ON workspaces (slug) WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_workspaces_owner ON workspaces ("ownerId") WHERE "deletedAt" IS NULL`);

    // ============================================
    // WORKSPACE_MEMBERS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE workspace_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "workspaceId" UUID NOT NULL,
        "userId" UUID NOT NULL,
        "roleId" UUID NOT NULL,
        "invitedById" UUID,
        "joinedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT fk_workspace_members_workspace FOREIGN KEY ("workspaceId") REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_workspace_members_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_workspace_members_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE RESTRICT,
        CONSTRAINT fk_workspace_members_invited FOREIGN KEY ("invitedById") REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT uq_workspace_member UNIQUE ("workspaceId", "userId")
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_workspace_members_workspace ON workspace_members ("workspaceId") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_workspace_members_user ON workspace_members ("userId") WHERE "deletedAt" IS NULL`);

    // ============================================
    // PROJECTS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "workspaceId" UUID NOT NULL,
        name VARCHAR(200) NOT NULL,
        key VARCHAR(10) NOT NULL,
        description TEXT,
        "leadId" UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT fk_projects_workspace FOREIGN KEY ("workspaceId") REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_projects_lead FOREIGN KEY ("leadId") REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT uq_project_key_workspace UNIQUE (key, "workspaceId")
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_projects_workspace ON projects ("workspaceId") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_projects_lead ON projects ("leadId") WHERE "deletedAt" IS NULL`);

    // ============================================
    // PROJECT_MEMBERS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE project_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "projectId" UUID NOT NULL,
        "userId" UUID NOT NULL,
        "roleId" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT fk_project_members_project FOREIGN KEY ("projectId") REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_project_members_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_project_members_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE RESTRICT,
        CONSTRAINT uq_project_member UNIQUE ("projectId", "userId")
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_project_members_project ON project_members ("projectId") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_project_members_user ON project_members ("userId") WHERE "deletedAt" IS NULL`);

    // ============================================
    // PROJECT_COUNTERS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE project_counters (
        "projectId" UUID PRIMARY KEY,
        "lastSequentialId" INT DEFAULT 0,
        CONSTRAINT fk_project_counters_project FOREIGN KEY ("projectId") REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // TASKS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "projectId" UUID NOT NULL,
        "sprintId" UUID,
        "parentTaskId" UUID,
        "sequentialId" INT NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(30) DEFAULT 'backlog',
        priority VARCHAR(10) DEFAULT 'medium',
        type VARCHAR(20) DEFAULT 'task',
        "storyPoints" INT,
        "dueDate" TIMESTAMPTZ,
        "estimatedHours" DECIMAL(8,2),
        "actualHours" DECIMAL(8,2),
        position DECIMAL(12,2) DEFAULT 0,
        "boardColumnId" VARCHAR(30) DEFAULT 'backlog',
        metadata JSONB DEFAULT '{}',
        "createdById" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT fk_tasks_project FOREIGN KEY ("projectId") REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_tasks_parent FOREIGN KEY ("parentTaskId") REFERENCES tasks(id) ON DELETE SET NULL,
        CONSTRAINT fk_tasks_created_by FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_tasks_project ON tasks ("projectId") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_tasks_status ON tasks (status) WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_tasks_board_column ON tasks ("boardColumnId", position) WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_tasks_sprint ON tasks ("sprintId") WHERE "deletedAt" IS NULL AND "sprintId" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_tasks_parent ON tasks ("parentTaskId") WHERE "deletedAt" IS NULL AND "parentTaskId" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_tasks_created_by ON tasks ("createdById") WHERE "deletedAt" IS NULL`);

    // ============================================
    // TASK_ASSIGNEES
    // ============================================
    await queryRunner.query(`
      CREATE TABLE task_assignees (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "taskId" UUID NOT NULL,
        "userId" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_task_assignees_task FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_assignees_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT uq_task_assignee UNIQUE ("taskId", "userId")
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_task_assignees_task ON task_assignees ("taskId")`);
    await queryRunner.query(`CREATE INDEX idx_task_assignees_user ON task_assignees ("userId")`);

    // ============================================
    // TASK_DEPENDENCIES
    // ============================================
    await queryRunner.query(`
      CREATE TABLE task_dependencies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "taskId" UUID NOT NULL,
        "dependsOnTaskId" UUID NOT NULL,
        type VARCHAR(20) DEFAULT 'blocks',
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_task_dependencies_task FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_dependencies_depends_on FOREIGN KEY ("dependsOnTaskId") REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_task_dependencies_task ON task_dependencies ("taskId")`);
    await queryRunner.query(`CREATE INDEX idx_task_dependencies_depends ON task_dependencies ("dependsOnTaskId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS task_dependencies`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_assignees`);
    await queryRunner.query(`DROP TABLE IF EXISTS tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_counters`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects`);
    await queryRunner.query(`DROP TABLE IF EXISTS workspace_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS workspaces`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
