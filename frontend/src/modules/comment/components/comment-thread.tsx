'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
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
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">
            Comments ({comments?.length || 0})
          </h3>
        </div>
      </div>

      <div className="p-4">
        {/* Comment form */}
        <div className="mb-4">
          <CommentForm taskId={taskId} />
        </div>

        {/* Typing indicator */}
        <TypingIndicator users={typingUsers} className="mb-3" />

        {/* Comments list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                taskId={taskId}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
