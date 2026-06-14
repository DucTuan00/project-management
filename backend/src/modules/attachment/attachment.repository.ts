import { DataSource, Repository, IsNull } from 'typeorm';
import { Attachment } from '@/modules/attachment/attachment.entity';
import { v4 as uuidv4 } from 'uuid';

export class AttachmentRepository {
  private readonly repo: Repository<Attachment>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(Attachment);
  }

  async findById(id: string): Promise<Attachment | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['uploader'],
    });
  }

  async findByTaskId(taskId: string): Promise<Attachment[]> {
    return this.repo.find({
      where: { taskId, deletedAt: IsNull() },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: {
    taskId: string;
    uploaderId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    storageType?: string;
    commentId?: string;
  }): Promise<Attachment> {
    const attachment = this.repo.create({
      id: uuidv4(),
      taskId: data.taskId,
      uploaderId: data.uploaderId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      storagePath: data.storagePath,
      storageType: data.storageType || 'local',
      commentId: data.commentId || null,
    });
    return this.repo.save(attachment);
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
