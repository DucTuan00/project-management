'use client';

import React, { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2, Reply } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { useAuth } from '@/providers/auth-provider';
import { Comment } from '../types';
import { useUpdateComment, useDeleteComment } from '../queries';
import { CommentForm } from './comment-form';
import { useToast } from '@/components/ui/toast';
import { formatDate, cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  taskId: string;
  depth?: number;
}

export function CommentItem({ comment, taskId, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const isAuthor = user?.id === comment.author.id;
  const maxDepth = 1;

  const handleEdit = async (content: string) => {
    try {
      await updateComment.mutateAsync({
        commentId: comment.id,
        data: { content },
      });
      setIsEditing(false);
      toast('Comment updated', 'success');
    } catch (error) {
      toast('Failed to update comment', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment.mutateAsync(comment.id);
        toast('Comment deleted', 'success');
      } catch (error) {
        toast('Failed to delete comment', 'error');
      }
    }
  };

  const menuItems = [
    ...(isAuthor
      ? [
          {
            label: 'Edit',
            icon: <Edit2 className="h-4 w-4" />,
            onClick: () => setIsEditing(true),
          },
        ]
      : []),
    ...(depth < maxDepth
      ? [
          {
            label: 'Reply',
            icon: <Reply className="h-4 w-4" />,
            onClick: () => setIsReplying(true),
          },
        ]
      : []),
    ...(isAuthor
      ? [
          {
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: handleDelete,
            danger: true,
          },
        ]
      : []),
  ];

  if (isEditing) {
    return (
      <div className={cn('py-3', depth > 0 && 'ml-8')}>
        <CommentForm
          taskId={taskId}
          onCancel={() => setIsEditing(false)}
          placeholder="Edit your comment..."
        />
      </div>
    );
  }

  return (
    <div className={cn('py-3', depth > 0 && 'ml-8')}>
      <div className="flex items-start gap-3">
        <Avatar
          name={comment.author.displayName}
          src={comment.author.avatarUrl}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {comment.author.displayName}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </div>

          <div className="mt-2 flex items-center gap-4">
            {depth < maxDepth && (
              <button
                onClick={() => setIsReplying(true)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
          </div>

          {isReplying && (
            <div className="mt-3">
              <CommentForm
                taskId={taskId}
                parentId={comment.id}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}
        </div>

        {menuItems.length > 0 && (
          <Dropdown
            trigger={
              <button className="rounded p-1 text-gray-400 hover:text-gray-500">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
            items={menuItems}
            align="right"
          />
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              taskId={taskId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
