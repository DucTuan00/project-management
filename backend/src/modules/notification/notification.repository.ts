import { DataSource, Repository, IsNull } from 'typeorm';
import { Notification } from '@/modules/notification/notification.entity';
import { v4 as uuidv4 } from 'uuid';

export class NotificationRepository {
  private readonly repo: Repository<Notification>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(Notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.repo.findOne({
      where: { id },
    });
  }

  async findByUserId(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    },
  ): Promise<{ notifications: Notification[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC');

    if (options?.unreadOnly) {
      qb.andWhere('n.isRead = false');
    }

    const total = await qb.getCount();

    const notifications = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({
      where: { userId, isRead: false },
    });
  }

  async create(data: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, any>;
  }): Promise<Notification> {
    const notification = this.repo.create({
      id: uuidv4(),
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body || null,
      data: data.data || {},
    });
    return this.repo.save(notification);
  }

  async createBulk(
    notifications: Array<{
      userId: string;
      type: string;
      title: string;
      body?: string;
      data?: Record<string, any>;
    }>,
  ): Promise<Notification[]> {
    const entities = notifications.map((n) =>
      this.repo.create({
        id: uuidv4(),
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body || null,
        data: n.data || {},
      }),
    );
    return this.repo.save(entities);
  }

  async markAsRead(id: string): Promise<void> {
    await this.repo.update(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAsUnread(id: string): Promise<void> {
    await this.repo.update(id, {
      isRead: false,
      readAt: null,
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async markBulkAsRead(ids: string[]): Promise<void> {
    await this.repo.update(ids, {
      isRead: true,
      readAt: new Date(),
    });
  }
}
