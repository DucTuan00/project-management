import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentsAttachmentsNotifications1750000002000 implements MigrationInterface {
  name = 'CreateCommentsAttachmentsNotifications1750000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // COMMENTS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "taskId" UUID NOT NULL,
        "parentId" UUID,
        "authorId" UUID NOT NULL,
        content TEXT NOT NULL,
        mentions UUID[] DEFAULT '{}',
        "editedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT fk_comments_task FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_comments_parent FOREIGN KEY ("parentId") REFERENCES comments(id) ON DELETE SET NULL,
        CONSTRAINT fk_comments_author FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_comments_task ON comments ("taskId") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_comments_parent ON comments ("parentId") WHERE "deletedAt" IS NULL AND "parentId" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX idx_comments_author ON comments ("authorId") WHERE "deletedAt" IS NULL`);

    // ============================================
    // ATTACHMENTS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "taskId" UUID NOT NULL,
        "commentId" UUID,
        "uploaderId" UUID NOT NULL,
        "fileName" VARCHAR(255) NOT NULL,
        "fileSize" INT NOT NULL,
        "mimeType" VARCHAR(100) NOT NULL,
        "storagePath" VARCHAR(500) NOT NULL,
        "storageType" VARCHAR(10) DEFAULT 'local',
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT fk_attachments_task FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_attachments_uploader FOREIGN KEY ("uploaderId") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_attachments_task ON attachments ("taskId") WHERE "deletedAt" IS NULL`);

    // ============================================
    // NOTIFICATIONS
    // ============================================
    await queryRunner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        body TEXT,
        data JSONB DEFAULT '{}',
        "isRead" BOOLEAN DEFAULT false,
        "readAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_notifications_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_notifications_user_read ON notifications ("userId", "isRead")`);
    await queryRunner.query(`CREATE INDEX idx_notifications_created ON notifications ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS attachments`);
    await queryRunner.query(`DROP TABLE IF EXISTS comments`);
  }
}
