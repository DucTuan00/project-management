import { DataSource, Repository } from 'typeorm';
import { Role } from '@/modules/role/role.entity';
import { Permission } from '@/modules/role/permission.entity';
import { RolePermission } from '@/modules/role/role-permission.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class RoleRepository {
  private readonly roleRepo: Repository<Role>;
  private readonly permissionRepo: Repository<Permission>;
  private readonly rolePermissionRepo: Repository<RolePermission>;

  constructor(private readonly dataSource: DataSource) {
    this.roleRepo = dataSource.getRepository(Role);
    this.permissionRepo = dataSource.getRepository(Permission);
    this.rolePermissionRepo = dataSource.getRepository(RolePermission);
  }

  async findByName(name: string, workspaceId?: string): Promise<Role | null> {
    return this.roleRepo.findOne({
      where: {
        name,
        workspaceId: workspaceId || IsNull(),
        deletedAt: IsNull(),
      },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.roleRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByWorkspaceId(workspaceId: string): Promise<Role[]> {
    return this.roleRepo.find({
      where: {
        workspaceId,
        deletedAt: IsNull(),
      },
      order: { level: 'DESC' },
    });
  }

  async getSystemRoles(): Promise<Role[]> {
    return this.roleRepo.find({
      where: { isSystem: true, deletedAt: IsNull() },
      order: { level: 'DESC' },
    });
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    const role = this.roleRepo.create({
      id: uuidv4(),
      ...data,
    });
    return this.roleRepo.save(role);
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepo.find({
      where: { roleId },
      relations: ['permission'],
    });
    return rolePermissions.map((rp) => rp.permission);
  }

  async assignPermission(roleId: string, permissionId: string): Promise<RolePermission> {
    const existing = await this.rolePermissionRepo.findOne({
      where: { roleId, permissionId },
    });

    if (existing) {
      return existing;
    }

    const rp = this.rolePermissionRepo.create({
      id: uuidv4(),
      roleId,
      permissionId,
    });
    return this.rolePermissionRepo.save(rp);
  }

  async bulkAssignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
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

  async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const result = await this.rolePermissionRepo
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
