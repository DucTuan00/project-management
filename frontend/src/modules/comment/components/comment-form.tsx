'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateComment } from '../queries';
import { createCommentSchema, CreateCommentFormData } from '../schemas';
import { useToast } from '@/components/ui/toast';
import { useSocket } from '@/providers/socket-provider';

interface CommentFormProps {
  taskId: string;
  parentId?: string;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  taskId,
  parentId,
  onCancel,
  placeholder = 'Write a comment...',
}: CommentFormProps) {
  const { toast } = useToast();
  const { startTyping, stopTyping } = useSocket();
  const createComment = useCreateComment(taskId);
  const [isFocused, setIsFocused] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateCommentFormData>({
    resolver: zodResolver(createCommentSchema),
  });

  const content = watch('content');

  const handleTyping = useCallback(() => {
    startTyping(taskId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(taskId);
    }, 3000);
  }, [taskId, startTyping, stopTyping]);

  const onSubmit = async (data: CreateCommentFormData) => {
    try {
      // Stop typing before submitting
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping(taskId);

      await createComment.mutateAsync({
        content: data.content,
        parentId,
      });
      reset();
      if (onCancel) onCancel();
      toast('Comment added', 'success');
    } catch (error) {
      toast('Failed to add comment', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="relative">
        <textarea
          {...register('content')}
          placeholder={placeholder}
          rows={parentId ? 2 : 3}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
          onFocus={() => setIsFocused(true)}
          onChange={(e) => {
            register('content').onChange(e);
            handleTyping();
          }}
        />
        {errors.content && (
          <p className="mt-1 text-xs text-danger-600">{errors.content.message}</p>
        )}
      </div>

      {(isFocused || parentId) && (
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            loading={createComment.isPending}
            disabled={!content?.trim()}
          >
            <Send className="h-4 w-4 mr-1" />
            {parentId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      )}
    </form>
  );
}
