import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from '@/modules/task/task.entity';

@Entity('task_dependencies')
export class TaskDependency {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  taskId!: string;

  @Column({ type: 'uuid' })
  dependsOnTaskId!: string;

  @Column({ type: 'varchar', length: 20, default: 'blocks' })
  type!: string;

  @ManyToOne(() => Task, (task) => task.dependencies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @ManyToOne(() => Task, (task) => task.dependents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dependsOnTaskId' })
  dependsOnTask!: Task;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
