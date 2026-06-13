import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

export class SeedInitialData1750000001000 implements MigrationInterface {
  name = 'SeedInitialData1750000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. SEED PERMISSIONS
    // ============================================
    const permissions = [
      // Workspace permissions
      { id: uuidv4(), code: 'workspace.create', name: 'Create Workspace', group: 'workspace', description: 'Create new workspaces' },
      { id: uuidv4(), code: 'workspace.read', name: 'View Workspace', group: 'workspace', description: 'View workspace details' },
      { id: uuidv4(), code: 'workspace.update', name: 'Update Workspace', group: 'workspace', description: 'Update workspace settings' },
      { id: uuidv4(), code: 'workspace.delete', name: 'Delete Workspace', group: 'workspace', description: 'Delete workspaces' },
      { id: uuidv4(), code: 'workspace.manage_members', name: 'Manage Members', group: 'workspace', description: 'Invite, remove, and manage workspace members' },
      { id: uuidv4(), code: 'workspace.transfer_ownership', name: 'Transfer Ownership', group: 'workspace', description: 'Transfer workspace ownership' },

      // Project permissions
      { id: uuidv4(), code: 'project.create', name: 'Create Project', group: 'project', description: 'Create new projects' },
      { id: uuidv4(), code: 'project.read', name: 'View Project', group: 'project', description: 'View project details' },
      { id: uuidv4(), code: 'project.update', name: 'Update Project', group: 'project', description: 'Update project settings' },
      { id: uuidv4(), code: 'project.delete', name: 'Delete Project', group: 'project', description: 'Delete projects' },
      { id: uuidv4(), code: 'project.manage_members', name: 'Manage Project Members', group: 'project', description: 'Add and remove project members' },

      // Task permissions
      { id: uuidv4(), code: 'task.create', name: 'Create Tasks', group: 'task', description: 'Create new tasks' },
      { id: uuidv4(), code: 'task.read', name: 'View Tasks', group: 'task', description: 'View task details' },
      { id: uuidv4(), code: 'task.update', name: 'Update Tasks', group: 'task', description: 'Update task details' },
      { id: uuidv4(), code: 'task.delete', name: 'Delete Tasks', group: 'task', description: 'Delete tasks' },
      { id: uuidv4(), code: 'task.assign', name: 'Assign Tasks', group: 'task', description: 'Assign users to tasks' },
      { id: uuidv4(), code: 'task.change_status', name: 'Change Task Status', group: 'task', description: 'Change task status' },
      { id: uuidv4(), code: 'task.manage_dependencies', name: 'Manage Dependencies', group: 'task', description: 'Add and remove task dependencies' },

      // Sprint permissions
      { id: uuidv4(), code: 'sprint.create', name: 'Create Sprints', group: 'sprint', description: 'Create new sprints' },
      { id: uuidv4(), code: 'sprint.read', name: 'View Sprints', group: 'sprint', description: 'View sprint details' },
      { id: uuidv4(), code: 'sprint.update', name: 'Update Sprints', group: 'sprint', description: 'Update sprint settings' },
      { id: uuidv4(), code: 'sprint.delete', name: 'Delete Sprints', group: 'sprint', description: 'Delete sprints' },
      { id: uuidv4(), code: 'sprint.manage_backlog', name: 'Manage Backlog', group: 'sprint', description: 'Manage sprint backlog' },

      // Board permissions
      { id: uuidv4(), code: 'board.read', name: 'View Board', group: 'board', description: 'View kanban board' },
      { id: uuidv4(), code: 'board.update', name: 'Update Board', group: 'board', description: 'Update board positions' },

      // Comment permissions
      { id: uuidv4(), code: 'comment.create', name: 'Create Comments', group: 'comment', description: 'Create comments on tasks' },
      { id: uuidv4(), code: 'comment.read', name: 'View Comments', group: 'comment', description: 'View comments on tasks' },
      { id: uuidv4(), code: 'comment.update', name: 'Update Comments', group: 'comment', description: 'Update own comments' },
      { id: uuidv4(), code: 'comment.delete', name: 'Delete Comments', group: 'comment', description: 'Delete own comments' },

      // Analytics permissions
      { id: uuidv4(), code: 'analytics.view', name: 'View Analytics', group: 'analytics', description: 'View dashboard analytics' },
      { id: uuidv4(), code: 'analytics.export', name: 'Export Analytics', group: 'analytics', description: 'Export analytics data' },

      // Admin permissions
      { id: uuidv4(), code: 'admin.manage_users', name: 'Manage Users', group: 'admin', description: 'Manage system users' },
      { id: uuidv4(), code: 'admin.manage_roles', name: 'Manage Roles', group: 'admin', description: 'Manage system roles' },
      { id: uuidv4(), code: 'admin.view_logs', name: 'View Logs', group: 'admin', description: 'View system logs' },
      { id: uuidv4(), code: 'admin.manage_system', name: 'Manage System', group: 'admin', description: 'Manage system settings' },
    ];

    for (const perm of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions (id, code, name, "group", description, "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (code) DO NOTHING`,
        [perm.id, perm.code, perm.name, perm.group, perm.description],
      );
    }

    // ============================================
    // 2. SEED ROLES
    // ============================================
    const roles = [
      { id: uuidv4(), name: 'Super Admin', description: 'Full system access', isSystem: true, level: 100 },
      { id: uuidv4(), name: 'Workspace Owner', description: 'Full workspace access', isSystem: true, level: 80 },
      { id: uuidv4(), name: 'Workspace Admin', description: 'Workspace administration', isSystem: true, level: 60 },
      { id: uuidv4(), name: 'Project Manager', description: 'Project management access', isSystem: true, level: 40 },
      { id: uuidv4(), name: 'Member', description: 'Standard member access', isSystem: true, level: 20 },
      { id: uuidv4(), name: 'Guest', description: 'Limited read access', isSystem: true, level: 10 },
    ];

    for (const role of roles) {
      await queryRunner.query(
        `INSERT INTO roles (id, name, description, "isSystem", "workspaceId", level, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NULL, $5, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [role.id, role.name, role.description, role.isSystem, role.level],
      );
    }

    // ============================================
    // 3. SEED ROLE-PERMISSION MAPPINGS
    // ============================================
    const allPermissions = await queryRunner.query(`SELECT id, code FROM permissions`);
    const allRoles = await queryRunner.query(`SELECT id, name FROM roles WHERE "isSystem" = true`);

    const roleMap: Record<string, string> = {};
    for (const role of allRoles) {
      roleMap[role.name] = role.id;
    }

    const permMap: Record<string, string> = {};
    for (const perm of allPermissions) {
      permMap[perm.code] = perm.id;
    }

    // Super Admin - all permissions
    const superAdminPerms = allPermissions.map((p: any) => p.code);

    // Workspace Owner - all workspace, project, task, sprint, board, comment, analytics permissions
    const ownerPerms = allPermissions
      .filter((p: any) => !p.code.startsWith('admin.'))
      .map((p: any) => p.code);

    // Workspace Admin - workspace, project, task, sprint, board, comment, analytics (except delete workspace)
    const adminPerms = allPermissions
      .filter((p: any) => !p.code.startsWith('admin.') && p.code !== 'workspace.delete' && p.code !== 'workspace.transfer_ownership')
      .map((p: any) => p.code);

    // Project Manager - project, task, sprint, board, comment, analytics
    const pmPerms = allPermissions
      .filter((p: any) =>
        p.code.startsWith('project.') ||
        p.code.startsWith('task.') ||
        p.code.startsWith('sprint.') ||
        p.code.startsWith('board.') ||
        p.code.startsWith('comment.') ||
        p.code.startsWith('analytics.'),
      )
      .map((p: any) => p.code);

    // Member - task, board, comment, read project, read sprint
    const memberPerms = allPermissions
      .filter((p: any) =>
        p.code.startsWith('task.') ||
        p.code.startsWith('board.') ||
        p.code.startsWith('comment.') ||
        p.code === 'project.read' ||
        p.code === 'sprint.read' ||
        p.code === 'workspace.read',
      )
      .map((p: any) => p.code);

    // Guest - read only
    const guestPerms = allPermissions
      .filter((p: any) => p.code.endsWith('.read'))
      .map((p: any) => p.code);

    const rolePermissionsMap: Record<string, string[]> = {
      'Super Admin': superAdminPerms,
      'Workspace Owner': ownerPerms,
      'Workspace Admin': adminPerms,
      'Project Manager': pmPerms,
      'Member': memberPerms,
      'Guest': guestPerms,
    };

    for (const [roleName, permCodes] of Object.entries(rolePermissionsMap)) {
      const roleId = roleMap[roleName];
      if (!roleId) continue;

      for (const permCode of permCodes) {
        const permId = permMap[permCode];
        if (!permId) continue;

        await queryRunner.query(
          `INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT ("roleId", "permissionId") DO NOTHING`,
          [uuidv4(), roleId, permId],
        );
      }
    }

    // ============================================
    // 4. SEED ADMIN USER
    // ============================================
    const adminId = uuidv4();
    const passwordHash = await bcrypt.hash('Admin123!', 12);

    await queryRunner.query(
      `INSERT INTO users (id, email, "passwordHash", "displayName", "isEmailVerified", "emailVerifiedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [adminId, 'admin@pmplatform.com', passwordHash, 'System Admin'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM role_permissions`);
    await queryRunner.query(`DELETE FROM permissions`);
    await queryRunner.query(`DELETE FROM roles WHERE "isSystem" = true`);
    await queryRunner.query(`DELETE FROM users WHERE email = 'admin@pmplatform.com'`);
  }
}
