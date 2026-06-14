import { EventEmitter } from 'events';
import { logger } from '@/shared/logger/logger';

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

class EventBus {
  private emitter: EventEmitter;
  private handlerCount: Map<string, number> = new Map();

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.emitter.on(event, handler as EventHandler);
    const count = (this.handlerCount.get(event) || 0) + 1;
    this.handlerCount.set(event, count);
    logger.debug({ event, handlerCount: count }, 'Event handler registered');
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.emitter.off(event, handler as EventHandler);
    const count = (this.handlerCount.get(event) || 1) - 1;
    this.handlerCount.set(event, count);
  }

  async emit<T = unknown>(event: string, payload: T): Promise<void> {
    logger.debug({ event }, 'Emitting event');
    this.emitter.emit(event, payload);
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.emitter.once(event, handler as EventHandler);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.emitter.removeAllListeners(event);
      this.handlerCount.delete(event);
    } else {
      this.emitter.removeAllListeners();
      this.handlerCount.clear();
    }
  }
}

export const eventBus = new EventBus();

// Event constants
export const Events = {
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_MEMBER_ADDED: 'workspace.member_added',
  WORKSPACE_MEMBER_REMOVED: 'workspace.member_removed',
  PROJECT_CREATED: 'project.created',
  PROJECT_MEMBER_ADDED: 'project.member_added',
  PROJECT_MEMBER_REMOVED: 'project.member_removed',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_ASSIGNED: 'task.assigned',
  TASK_UNASSIGNED: 'task.unassigned',
  TASK_DELETED: 'task.deleted',
  COMMENT_CREATED: 'comment.created',
  ATTACHMENT_UPLOADED: 'attachment.uploaded',
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
} as const;
