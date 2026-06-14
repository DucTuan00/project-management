import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '@/modules/auth/auth.entity';
import { Task } from '@/modules/task/task.entity';

@Entity('comments')
export class Comment {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  taskId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ type: 'uuid' })
  authorId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  mentions!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt!: Date | null;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @ManyToOne(() => Comment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent!: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies!: Comment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;
}
