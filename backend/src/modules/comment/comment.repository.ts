import { DataSource, Repository, IsNull } from 'typeorm';
import { Comment } from '@/modules/comment/comment.entity';
import { v4 as uuidv4 } from 'uuid';

export class CommentRepository {
  private readonly repo: Repository<Comment>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(Comment);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['author'],
    });
  }

  async findByIdWithReplies(id: string): Promise<Comment | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['author', 'replies', 'replies.author'],
    });
  }

  async findByTaskId(
    taskId: string,
    options?: { page?: number; limit?: number },
  ): Promise<{ comments: Comment[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    // Get top-level comments (no parent)
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.author', 'author')
      .leftJoinAndSelect('c.replies', 'replies')
      .leftJoinAndSelect('replies.author', 'repliesAuthor')
      .where('c.taskId = :taskId', { taskId })
      .andWhere('c.parentId IS NULL')
      .andWhere('c.deletedAt IS NULL')
      .orderBy('c.createdAt', 'ASC');

    const total = await qb.getCount();

    const comments = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { comments, total };
  }

  async create(data: {
    taskId: string;
    authorId: string;
    content: string;
    parentId?: string;
  }): Promise<Comment> {
    const comment = this.repo.create({
      id: uuidv4(),
      taskId: data.taskId,
      authorId: data.authorId,
      content: data.content,
      parentId: data.parentId || null,
    });
    return this.repo.save(comment);
  }

  async update(
    id: string,
    data: { content: string },
  ): Promise<Comment | null> {
    await this.repo.update(id, {
      content: data.content,
      editedAt: new Date(),
    });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async countByTaskId(taskId: string): Promise<number> {
    return this.repo.count({
      where: { taskId, deletedAt: IsNull() },
    });
  }
}
