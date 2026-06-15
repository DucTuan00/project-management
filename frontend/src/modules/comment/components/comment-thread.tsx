'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useComments } from '../queries';
import { CommentItem } from './comment-item';
import { CommentForm } from './comment-form';
import { TypingIndicator } from '@/components/shared/typing-indicator';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useSocket } from '@/providers/socket-provider';

interface TypingUser {
  userId: string;
  displayName: string;
}

interface CommentThreadProps {
  taskId: string;
}

export function CommentThread({ taskId }: CommentThreadProps) {
  const { data: comments, isLoading } = useComments(taskId);
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleTypingIndicator = (data: { taskId: string; userId: string; displayName: string }) => {
      if (data.taskId !== taskId) return;

      if (data.displayName) {
        // User started typing
        setTypingUsers((prev) => {
          const exists = prev.some((u) => u.userId === data.userId);
          if (exists) return prev;
          return [...prev, { userId: data.userId, displayName: data.displayName }];
        });
      } else {
        // User stopped typing
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
    };

    socket.on('typing:indicator', handleTypingIndicator);

    return () => {
      socket.off('typing:indicator', handleTypingIndicator);
    };
  }, [socket, taskId]);

  return (
    <Box
      sx={{
        borderRadius: '12px',
        border: '1px solid #c5c0b1',
        backgroundColor: '#fffefb',
      }}
    >
      <Box
        sx={{
          borderBottom: '1px solid #c5c0b1',
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MessageSquare style={{ fontSize: '16px', color: '#939084' }} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#201515', fontSize: '14px' }}>
            Comments ({comments?.length || 0})
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Comment form */}
        <Box sx={{ mb: 2 }}>
          <CommentForm taskId={taskId} />
        </Box>

        {/* Typing indicator */}
        <TypingIndicator users={typingUsers} sx={{ mb: 1.5 }} />

        {/* Comments list */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LoadingSpinner size="sm" />
          </Box>
        ) : comments && comments.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                taskId={taskId}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
              No comments yet. Be the first to comment!
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
