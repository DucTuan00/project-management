'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, X } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
    >
      <Box>
        <textarea
          {...register('content')}
          placeholder={placeholder}
          rows={parentId ? 2 : 3}
          style={{
            width: '100%',
            borderRadius: '6px',
            border: '1px solid #c5c0b1',
            padding: '12px 16px',
            fontSize: '14px',
            color: '#201515',
            backgroundColor: '#fffefb',
            resize: 'none',
            outline: 'none',
          }}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => {
            register('content').onChange(e);
            handleTyping();
          }}
        />
        {errors.content && (
          <Typography variant="caption" sx={{ color: '#dc2626', mt: 0.5, display: 'block', fontSize: '12px' }}>
            {errors.content.message}
          </Typography>
        )}
      </Box>

      {(isFocused || parentId) && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X size={16} style={{ marginRight: '4px' }} />
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            loading={createComment.isPending}
            disabled={!content?.trim()}
          >
            <Send size={16} style={{ marginRight: '4px' }} />
            {parentId ? 'Reply' : 'Comment'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
