import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('project_counters')
export class ProjectCounter {
  @PrimaryColumn('uuid')
  projectId!: string;

  @Column({ type: 'int', default: 0 })
  lastSequentialId!: number;
}
