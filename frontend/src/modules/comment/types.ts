export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  taskId: string;
  parentId: string | null;
  author: CommentAuthor;
  content: string;
  mentions: string[];
  createdAt: string;
  editedAt: string | null;
  isEdited: boolean;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}
