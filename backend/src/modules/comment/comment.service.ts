import { CommentRepository } from '@/modules/comment/comment.repository';
import { TaskRepository } from '@/modules/task/task.repository';
import { ProjectRepository } from '@/modules/project/project.repository';
import { CreateCommentDto, UpdateCommentDto, ListCommentsQuery } from '@/modules/comment/comment.dto';
import { CommentResponse, toCommentResponse } from '@/modules/comment/comment.types';
import { NotFoundError } from '@/shared/errors/not-found';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { eventBus, Events } from '@/shared/event-bus/event-bus';
import { logger } from '@/shared/logger/logger';
import { createPaginatedResponse, PaginatedResult } from '@/shared/dto/pagination.dto';

// Regex to match [@displayName](user:uuid) mentions
const MENTION_REGEX = /\[@([^\]]+)\]\(user:([a-f0-9-]+)\)/g;

export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly taskRepository: TaskRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async create(
    taskId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    // Verify task exists
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    // Verify user is a project member
    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    // Validate parent comment if provided
    if (dto.parentId) {
      const parentComment = await this.commentRepository.findById(dto.parentId);
      if (!parentComment || parentComment.taskId !== taskId) {
        throw new NotFoundError('Parent comment');
      }
    }

    // Parse @mentions from content
    const mentions = this.extractMentions(dto.content);

    const comment = await this.commentRepository.create({
      taskId,
      authorId: userId,
      content: dto.content,
      parentId: dto.parentId,
    });

    const fullComment = await this.commentRepository.findByIdWithReplies(comment.id);

    logger.info({ commentId: comment.id, taskId, userId }, 'Comment created');

    eventBus.emit(Events.COMMENT_CREATED, {
      commentId: comment.id,
      taskId,
      projectId: task.projectId,
      userId,
      mentions,
    });

    return toCommentResponse(fullComment as any);
  }

  async listByTask(
    taskId: string,
    userId: string,
    query: ListCommentsQuery,
  ): Promise<PaginatedResult<CommentResponse>> {
    // Verify task exists
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    // Verify user is a project member
    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const { comments, total } = await this.commentRepository.findByTaskId(taskId, {
      page: query.page,
      limit: query.limit,
    });

    const data = comments.map(toCommentResponse);

    return createPaginatedResponse(data, total, query.page, query.limit);
  }

  async update(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponse> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment');
    }

    // Only author can edit their own comments
    if (comment.authorId !== userId) {
      throw new ForbiddenError('You can only edit your own comments');
    }

    // Parse new mentions
    const mentions = this.extractMentions(dto.content);

    const updated = await this.commentRepository.update(commentId, {
      content: dto.content,
    });

    const fullComment = await this.commentRepository.findByIdWithReplies(commentId);

    logger.info({ commentId, userId }, 'Comment updated');

    return toCommentResponse(fullComment as any);
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment');
    }

    // Only author can delete their own comments
    if (comment.authorId !== userId) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await this.commentRepository.delete(commentId);

    logger.info({ commentId, userId }, 'Comment deleted');
  }

  private extractMentions(content: string): string[] {
    const mentions: string[] = [];
    let match;
    while ((match = MENTION_REGEX.exec(content)) !== null) {
      const userId = match[2];
      if (!mentions.includes(userId)) {
        mentions.push(userId);
      }
    }
    return mentions;
  }
}
