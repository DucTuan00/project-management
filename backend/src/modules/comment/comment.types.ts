import { Comment } from '@/modules/comment/comment.entity';

export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CommentResponse {
  id: string;
  taskId: string;
  parentId: string | null;
  author: CommentAuthor;
  content: string;
  mentions: string[];
  createdAt: Date;
  editedAt: Date | null;
  isEdited: boolean;
  replies?: CommentResponse[];
}

export interface CommentWithDetails extends Comment {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  replies?: CommentWithDetails[];
}

export function toCommentResponse(comment: CommentWithDetails): CommentResponse {
  return {
    id: comment.id,
    taskId: comment.taskId,
    parentId: comment.parentId,
    author: {
      id: comment.author.id,
      displayName: comment.author.displayName,
      avatarUrl: comment.author.avatarUrl,
    },
    content: comment.content,
    mentions: comment.mentions || [],
    createdAt: comment.createdAt,
    editedAt: comment.editedAt,
    isEdited: !!comment.editedAt,
    replies: comment.replies?.map(toCommentResponse),
  };
}
