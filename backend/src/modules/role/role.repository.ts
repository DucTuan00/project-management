import { AppDataSource } from '@/config/database';
import { Role } from '@/modules/role/role.entity';
import { Permission } from '@/modules/role/permission.entity';
import { RolePermission } from '@/modules/role/role-permission.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export const roleRepository = AppDataSource.getRepository(Role);
export const permissionRepository = AppDataSource.getRepository(Permission);
export const rolePermissionRepository = AppDataSource.getRepository(RolePermission);

export class RoleRepository {
  static async findByName(name: string, workspaceId?: string): Promise<Role | null> {
    return roleRepository.findOne({
      where: {
        name,
        workspaceId: workspaceId || IsNull(),
        deletedAt: IsNull(),
      },
    });
  }

  static async findById(id: string): Promise<Role | null> {
    return roleRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  static async findByWorkspaceId(workspaceId: string): Promise<Role[]> {
    return roleRepository.find({
      where: {
        workspaceId,
        deletedAt: IsNull(),
      },
      order: { level: 'DESC' },
    });
  }

  static async getSystemRoles(): Promise<Role[]> {
    return roleRepository.find({
      where: { isSystem: true, deletedAt: IsNull() },
      order: { level: 'DESC' },
    });
  }

  static async createRole(data: Partial<Role>): Promise<Role> {
    const role = roleRepository.create({
      id: uuidv4(),
      ...data,
    });
    return roleRepository.save(role);
  }

  static async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rolePermissions = await rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });
    return rolePermissions.map((rp) => rp.permission);
  }

  static async assignPermission(roleId: string, permissionId: string): Promise<RolePermission> {
    const existing = await rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (existing) {
      return existing;
    }

    const rp = rolePermissionRepository.create({
      id: uuidv4(),
      roleId,
      permissionId,
    });
    return rolePermissionRepository.save(rp);
  }

  static async bulkAssignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const permissionId of permissionIds) {
        const existing = await queryRunner.manager.findOne(RolePermission, {
          where: { roleId, permissionId },
        });

        if (!existing) {
          await queryRunner.manager.save(RolePermission, {
            id: uuidv4(),
            roleId,
            permissionId,
          });
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  static async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const result = await rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('rp.permission', 'p', 'p.code = :code', { code: permissionCode })
      .innerJoin('rp.role', 'r')
      .innerJoin(
        'workspace_members',
        'wm',
        'wm.roleId = r.id AND wm.userId = :userId AND wm.deletedAt IS NULL',
        { userId },
      )
      .getCount();

    return result > 0;
  }
}
