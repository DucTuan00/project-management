'use client';

import React, { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2, Reply } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
            icon: <Edit2 size={16} />,
            onClick: () => setIsEditing(true),
          },
        ]
      : []),
    ...(depth < maxDepth
      ? [
          {
            label: 'Reply',
            icon: <Reply size={16} />,
            onClick: () => setIsReplying(true),
          },
        ]
      : []),
    ...(isAuthor
      ? [
          {
            label: 'Delete',
            icon: <Trash2 size={16} />,
            onClick: handleDelete,
            danger: true,
          },
        ]
      : []),
  ];

  if (isEditing) {
    return (
      <Box sx={{ py: 1.5, ml: depth > 0 ? 4 : 0 }}>
        <CommentForm
          taskId={taskId}
          onCancel={() => setIsEditing(false)}
          placeholder="Edit your comment..."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1.5, ml: depth > 0 ? 4 : 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Avatar
          name={comment.author.displayName}
          src={comment.author.avatarUrl}
          size="sm"
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#201515', fontSize: '14px' }}>
              {comment.author.displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#939084', fontSize: '12px' }}>
              {formatDate(comment.createdAt)}
            </Typography>
            {comment.isEdited && (
              <Typography variant="caption" sx={{ color: '#c5c0b1', fontSize: '12px' }}>
                (edited)
              </Typography>
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: '#605d52',
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
            }}
          >
            {comment.content}
          </Typography>

          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            {depth < maxDepth && (
              <Box
                component="button"
                onClick={() => setIsReplying(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '12px',
                  color: '#939084',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': { color: '#605d52' },
                  p: 0,
                }}
              >
                <Reply style={{ fontSize: '12px' }} />
                Reply
              </Box>
            )}
          </Box>

          {isReplying && (
            <Box sx={{ mt: 1.5 }}>
              <CommentForm
                taskId={taskId}
                parentId={comment.id}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
              />
            </Box>
          )}
        </Box>

        {menuItems.length > 0 && (
          <Dropdown
            trigger={
              <Box
                component="button"
                sx={{
                  p: 0.5,
                  color: '#939084',
                  '&:hover': { color: '#605d52' },
                  transition: 'color 0.2s',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                <MoreHorizontal size={16} />
              </Box>
            }
            items={menuItems}
            align="right"
          />
        )}
      </Box>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              taskId={taskId}
              depth={depth + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
