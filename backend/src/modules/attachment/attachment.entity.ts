import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@/modules/auth/auth.entity';
import { Task } from '@/modules/task/task.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  taskId!: string;

  @Column({ type: 'uuid', nullable: true })
  commentId!: string | null;

  @Column({ type: 'uuid' })
  uploaderId!: string;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'int' })
  fileSize!: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'varchar', length: 500 })
  storagePath!: string;

  @Column({ type: 'varchar', length: 10, default: 'local' })
  storageType!: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaderId' })
  uploader!: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;
}
