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
import { Project } from '@/modules/project/project.entity';
import { TaskAssignee } from '@/modules/task/task-assignee.entity';
import { TaskDependency } from '@/modules/task/task-dependency.entity';

@Entity('tasks')
export class Task {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  projectId!: string;

  @Column({ type: 'uuid', nullable: true })
  sprintId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  parentTaskId!: string | null;

  @Column({ type: 'int', nullable: false })
  sequentialId!: number;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'backlog' })
  status!: string;

  @Column({ type: 'varchar', length: 10, default: 'medium' })
  priority!: string;

  @Column({ type: 'varchar', length: 20, default: 'task' })
  type!: string;

  @Column({ type: 'int', nullable: true })
  storyPoints!: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  estimatedHours!: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  actualHours!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  position!: number;

  @Column({ type: 'varchar', length: 30, default: 'backlog' })
  boardColumnId!: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, any>;

  @Column({ type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @ManyToOne(() => Task, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask!: Task | null;

  @OneToMany(() => TaskAssignee, (assignee) => assignee.task)
  assignees!: TaskAssignee[];

  @OneToMany(() => TaskDependency, (dep) => dep.task)
  dependencies!: TaskDependency[];

  @OneToMany(() => TaskDependency, (dep) => dep.dependsOnTask)
  dependents!: TaskDependency[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;
}
